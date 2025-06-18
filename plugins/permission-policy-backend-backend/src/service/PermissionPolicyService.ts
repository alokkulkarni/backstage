/**
 * Permission Policy Service
 * Main service orchestrating policy management and evaluation
 */

import { LoggerService, RootConfigService as ConfigService } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import {
  PolicyRule,
  PolicyTemplate,
  PolicyBundle,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicyStorage,
  PolicyEvaluator,
  PolicyConfig,
} from '../types';
import { FileSystemPolicyStorage } from './storage';
import { OpaPolicyEvaluator } from '../evaluator/opaEvaluator';

export class PermissionPolicyService {
  private readonly storage: PolicyStorage;
  private readonly evaluator: PolicyEvaluator;
  private readonly config: PolicyConfig;

  constructor(
    private readonly logger: LoggerService,
    configService: ConfigService,
    private readonly catalogApi: CatalogApi,
  ) {
    this.config = this.loadConfig(configService);
    this.storage = new FileSystemPolicyStorage(
      this.config.storage.path || './data/policies',
      logger,
    );
    this.evaluator = new OpaPolicyEvaluator(
      this.storage,
      logger,
      {
        enableWasm: this.config.opa.enabled,
        wasmPath: this.config.opa.wasmPath,
        serverUrl: this.config.opa.serverUrl,
      },
    );
  }

  private loadConfig(configService: ConfigService): PolicyConfig {
    const config = configService.getOptionalConfig('permission.policy');
    
    return {
      storage: {
        type: (config?.getOptionalString('storage.type') || 'filesystem') as 'filesystem' | 'database',
        path: config?.getOptionalString('storage.path') || './data/policies',
        connectionString: config?.getOptionalString('storage.connectionString'),
      },
      opa: {
        enabled: config?.getOptionalBoolean('opa.enabled') || false,
        wasmPath: config?.getOptionalString('opa.wasmPath'),
        serverUrl: config?.getOptionalString('opa.serverUrl'),
      },
      defaultTemplates: config?.getOptionalBoolean('defaultTemplates') !== false,
      evaluation: {
        cacheEnabled: config?.getOptionalBoolean('evaluation.cacheEnabled') || true,
        cacheTtl: config?.getOptionalNumber('evaluation.cacheTtl') || 300,
        parallelEvaluation: config?.getOptionalBoolean('evaluation.parallelEvaluation') || true,
      },
    };
  }

  // Policy Rule Management
  async listRules(): Promise<PolicyRule[]> {
    return this.storage.listRules();
  }

  async getRule(id: string): Promise<PolicyRule | undefined> {
    return this.storage.getRule(id);
  }

  async createRule(rule: Omit<PolicyRule, 'id'>): Promise<PolicyRule> {
    // Validate rule before creating
    const validation = await this.evaluator.validateRule({ ...rule, id: 'temp' });
    if (!validation.valid) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }

    return this.storage.createRule(rule);
  }

  async updateRule(id: string, updates: Partial<PolicyRule>): Promise<PolicyRule> {
    const existingRule = await this.storage.getRule(id);
    if (!existingRule) {
      throw new Error(`Rule ${id} not found`);
    }

    const updatedRule = { ...existingRule, ...updates };
    const validation = await this.evaluator.validateRule(updatedRule);
    if (!validation.valid) {
      throw new Error(`Invalid rule update: ${validation.errors.join(', ')}`);
    }

    return this.storage.updateRule(id, updates);
  }

  async deleteRule(id: string): Promise<void> {
    return this.storage.deleteRule(id);
  }

  // Policy Template Management
  async listTemplates(): Promise<PolicyTemplate[]> {
    return this.storage.listTemplates();
  }

  async getTemplate(id: string): Promise<PolicyTemplate | undefined> {
    return this.storage.getTemplate(id);
  }

  async createTemplate(template: Omit<PolicyTemplate, 'id'>): Promise<PolicyTemplate> {
    return this.storage.createTemplate(template);
  }

  async updateTemplate(id: string, updates: Partial<PolicyTemplate>): Promise<PolicyTemplate> {
    return this.storage.updateTemplate(id, updates);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.storage.deleteTemplate(id);
  }

  async createRuleFromTemplate(
    templateId: string,
    variables: Record<string, any>,
  ): Promise<PolicyRule> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace template variables
    const rule = this.interpolateTemplate(template, variables);
    return this.createRule(rule);
  }

  private interpolateTemplate(
    template: PolicyTemplate,
    variables: Record<string, any>,
  ): Omit<PolicyRule, 'id'> {
    // Simple template interpolation
    const ruleJson = JSON.stringify(template.template);
    let interpolated = ruleJson;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      interpolated = interpolated.replace(new RegExp(placeholder, 'g'), String(value));
    }

    const rule = JSON.parse(interpolated);

    // Add metadata
    rule.metadata = {
      ...rule.metadata,
      createdFrom: template.id,
      templateVariables: variables,
    };

    return rule;
  }

  // Policy Evaluation
  async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    return this.evaluator.evaluate(context);
  }

  async evaluateMultiple(contexts: PolicyEvaluationContext[]): Promise<PolicyEvaluationResult[]> {
    return this.evaluator.evaluateMultiple(contexts);
  }

  async validateRule(rule: PolicyRule): Promise<{ valid: boolean; errors: string[] }> {
    return this.evaluator.validateRule(rule);
  }

  // Bundle Management
  async getBundle(): Promise<PolicyBundle> {
    return this.storage.getBundle();
  }

  async saveBundle(bundle: PolicyBundle): Promise<void> {
    return this.storage.saveBundle(bundle);
  }

  async exportBundle(): Promise<PolicyBundle> {
    const rules = await this.listRules();
    return {
      rules,
      metadata: {
        version: '1.0.0',
        name: 'Exported Policy Bundle',
        description: 'Exported from Backstage Permission Policy Plugin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async importBundle(bundle: PolicyBundle): Promise<void> {
    // Validate all rules in the bundle
    for (const rule of bundle.rules) {
      const validation = await this.evaluator.validateRule(rule);
      if (!validation.valid) {
        throw new Error(`Invalid rule in bundle: ${rule.name} - ${validation.errors.join(', ')}`);
      }
    }

    // Clear existing rules and import new ones
    const existingRules = await this.listRules();
    for (const rule of existingRules) {
      await this.deleteRule(rule.id);
    }

    for (const rule of bundle.rules) {
      await this.createRule(rule);
    }

    this.logger.info(`Imported ${bundle.rules.length} rules from bundle`);
  }

  // Catalog Integration
  async getUserGroups(userEntityRef: string): Promise<string[]> {
    try {
      const entity = await this.catalogApi.getEntityByRef(userEntityRef);
      if (entity?.kind === 'User') {
        const relations = entity.relations || [];
        return relations
          .filter(rel => rel.type === 'memberOf' && rel.targetRef.startsWith('group:'))
          .map(rel => rel.targetRef);
      }
    } catch (error) {
      this.logger.debug(`Failed to get user groups for ${userEntityRef}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return [];
  }

  async getAllUsers(): Promise<Array<{ entityRef: string; name?: string; email?: string }>> {
    try {
      const entities = await this.catalogApi.getEntities({
        filter: { kind: 'User' },
      });

      return entities.items.map(entity => ({
        entityRef: entity.metadata.name ? `user:default/${entity.metadata.name}` : '',
        name: typeof entity.spec?.displayName === 'string' ? entity.spec.displayName : 
              typeof entity.metadata.name === 'string' ? entity.metadata.name : undefined,
        email: typeof entity.spec?.profile === 'object' && entity.spec.profile && 
               typeof (entity.spec.profile as any).email === 'string' ? 
               (entity.spec.profile as any).email : undefined,
      })).filter(user => user.entityRef);
    } catch (error) {
      this.logger.debug(`Failed to get users from catalog, using fallback data: ${error instanceof Error ? error.message : String(error)}`);
      // Return fallback users that are commonly referenced in policies
      return [
        { entityRef: 'user:default/guest', name: 'Guest User' },
        { entityRef: 'user:default/alokkulkarni', name: 'Alok Kulkarni' },
      ];
    }
  }

  async getAllGroups(): Promise<Array<{ entityRef: string; name?: string; description?: string }>> {
    try {
      const entities = await this.catalogApi.getEntities({
        filter: { kind: 'Group' },
      });

      return entities.items.map(entity => ({
        entityRef: entity.metadata.name ? `group:default/${entity.metadata.name}` : '',
        name: typeof entity.spec?.displayName === 'string' ? entity.spec.displayName : 
              typeof entity.metadata.name === 'string' ? entity.metadata.name : undefined,
        description: entity.metadata.description,
      })).filter(group => group.entityRef);
    } catch (error) {
      this.logger.debug(`Failed to get groups from catalog, using fallback data: ${error instanceof Error ? error.message : String(error)}`);
      // Return fallback groups that are commonly referenced in policies
      return [
        { entityRef: 'group:default/admins', name: 'Administrators', description: 'System administrators' },
        { entityRef: 'group:default/platform-team', name: 'Platform Team', description: 'Platform engineering team' },
        { entityRef: 'group:default/developers', name: 'Developers', description: 'Development team' },
      ];
    }
  }

  // Frontend-specific methods for dropdown compatibility
  async getUsers(): Promise<Array<{ entityRef: string; name: string; }>> {
    const users = await this.getAllUsers();
    return users.map(user => ({
      entityRef: user.entityRef,
      name: user.name || user.entityRef.split('/').pop() || 'Unknown User',
    }));
  }

  async getGroups(): Promise<Array<{ entityRef: string; name: string; }>> {
    const groups = await this.getAllGroups();
    return groups.map(group => ({
      entityRef: group.entityRef,
      name: group.name || group.entityRef.split('/').pop() || 'Unknown Group',
    }));
  }

  // Policy Testing and Simulation
  async testRule(rule: PolicyRule, testContexts: PolicyEvaluationContext[]): Promise<{
    rule: PolicyRule;
    results: Array<{
      context: PolicyEvaluationContext;
      result: PolicyEvaluationResult;
    }>;
  }> {
    const results = [];
    
    for (const context of testContexts) {
      // Temporarily add the rule to storage for testing
      const tempRule = await this.createRule(rule);
      try {
        const result = await this.evaluate(context);
        results.push({ context, result });
      } finally {
        // Clean up temporary rule
        await this.deleteRule(tempRule.id);
      }
    }

    return { rule, results };
  }

  async simulateRuleChange(
    ruleId: string,
    changes: Partial<PolicyRule>,
    testContexts: PolicyEvaluationContext[],
  ): Promise<{
    original: PolicyRule;
    modified: PolicyRule;
    results: Array<{
      context: PolicyEvaluationContext;
      originalResult: PolicyEvaluationResult;
      modifiedResult: PolicyEvaluationResult;
    }>;
  }> {
    const originalRule = await this.getRule(ruleId);
    if (!originalRule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const modifiedRule = { ...originalRule, ...changes };
    const results = [];

    for (const context of testContexts) {
      const originalResult = await this.evaluate(context);
      
      // Temporarily update the rule
      await this.updateRule(ruleId, changes);
      const modifiedResult = await this.evaluate(context);
      
      // Restore original rule
      await this.updateRule(ruleId, originalRule);
      
      results.push({ context, originalResult, modifiedResult });
    }

    return { original: originalRule, modified: modifiedRule, results };
  }
}

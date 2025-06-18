/**
 * File-based Policy Storage Implementation
 * Stores policies as JSON files with backup and versioning
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  PolicyRule,
  PolicyTemplate,
  PolicyBundle,
  PolicyStorage,
} from '../types';

export class FileSystemPolicyStorage implements PolicyStorage {
  private readonly rulesPath: string;
  private readonly templatesPath: string;
  private readonly bundlePath: string;

  constructor(
    basePath: string,
    private readonly logger: LoggerService,
  ) {
    this.rulesPath = path.join(basePath, 'rules');
    this.templatesPath = path.join(basePath, 'templates');
    this.bundlePath = path.join(basePath, 'bundle.json');
    
    this.ensureDirectories();
    this.initializeDefaultData();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.ensureDir(this.rulesPath);
    await fs.ensureDir(this.templatesPath);
    await fs.ensureDir(path.dirname(this.bundlePath));
  }

  private async initializeDefaultData(): Promise<void> {
    try {
      // Initialize with default templates if none exist
      const templates = await this.listTemplates();
      if (templates.length === 0) {
        await this.createDefaultTemplates();
      }

      // Initialize with sample rules if none exist
      const rules = await this.listRules();
      if (rules.length === 0) {
        await this.createDefaultRules();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Failed to initialize default data:', { error: errorMessage });
    }
  }

  private async createDefaultTemplates(): Promise<void> {
    const defaultTemplates: Omit<PolicyTemplate, 'id'>[] = [
      {
        name: 'Catalog Read Access',
        description: 'Grant read access to catalog entities',
        category: 'catalog',
        template: {
          name: 'Catalog Read - {{subject}}',
          description: 'Read access to catalog for {{subject}}',
          resource: 'catalog',
          actions: ['read'],
          effect: 'allow',
        },
        variables: [
          {
            name: 'subject',
            description: 'User or group to grant access to',
            type: 'string',
            required: true,
          },
        ],
      },
      {
        name: 'Admin Full Access',
        description: 'Grant full administrative access',
        category: 'admin',
        template: {
          name: 'Admin Access - {{subject}}',
          description: 'Full administrative access for {{subject}}',
          resource: '*',
          actions: ['*'],
          effect: 'allow',
        },
        variables: [
          {
            name: 'subject',
            description: 'User or group to grant admin access to',
            type: 'string',
            required: true,
          },
        ],
      },
      {
        name: 'Scaffolder Template Access',
        description: 'Grant access to use scaffolder templates',
        category: 'scaffolder',
        template: {
          name: 'Scaffolder Access - {{subject}}',
          description: 'Access to scaffolder templates for {{subject}}',
          resource: 'scaffolder',
          actions: ['read', 'create'],
          effect: 'allow',
        },
        variables: [
          {
            name: 'subject',
            description: 'User or group to grant scaffolder access to',
            type: 'string',
            required: true,
          },
        ],
      },
    ];

    for (const template of defaultTemplates) {
      await this.createTemplate(template);
    }

    this.logger.info('Created default policy templates');
  }

  private async createDefaultRules(): Promise<void> {
    const defaultRules: Omit<PolicyRule, 'id'>[] = [
      {
        name: 'Default Catalog Read',
        description: 'Allow all authenticated users to read catalog',
        resource: 'catalog',
        actions: ['read'],
        effect: 'allow',
        subjects: [{ type: 'user', identifier: '*' }],
        metadata: {
          priority: 10,
          category: 'default',
          tags: ['catalog', 'read', 'default'],
        },
      },
      {
        name: 'Admin Full Access',
        description: 'Allow admin group full access to all resources',
        resource: '*',
        actions: ['*'],
        effect: 'allow',
        subjects: [{ type: 'group', identifier: 'group:default/admins' }],
        metadata: {
          priority: 100,
          category: 'admin',
          tags: ['admin', 'full-access'],
        },
      },
    ];

    for (const rule of defaultRules) {
      await this.createRule(rule);
    }

    this.logger.info('Created default policy rules');
  }

  async listRules(): Promise<PolicyRule[]> {
    try {
      const files = await fs.readdir(this.rulesPath);
      const rules: PolicyRule[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const rulePath = path.join(this.rulesPath, file);
          const rule = await fs.readJson(rulePath);
          rules.push(rule);
        }
      }

      return rules.sort((a, b) => (b.metadata?.priority || 0) - (a.metadata?.priority || 0));
    } catch (error) {
      this.logger.error('Failed to list rules:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getRule(id: string): Promise<PolicyRule | undefined> {
    try {
      const rulePath = path.join(this.rulesPath, `${id}.json`);
      if (await fs.pathExists(rulePath)) {
        return await fs.readJson(rulePath);
      }
    } catch (error) {
      this.logger.error(`Failed to get rule ${id}:`, { error: error instanceof Error ? error.message : String(error) });
    }
    return undefined;
  }

  async createRule(rule: Omit<PolicyRule, 'id'>): Promise<PolicyRule> {
    const id = uuidv4();
    const newRule: PolicyRule = {
      ...rule,
      id,
      metadata: {
        ...rule.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const rulePath = path.join(this.rulesPath, `${id}.json`);
    await fs.writeJson(rulePath, newRule, { spaces: 2 });
    
    this.logger.info(`Created policy rule: ${newRule.name} (${id})`);
    await this.updateBundle();
    
    return newRule;
  }

  async updateRule(id: string, updates: Partial<PolicyRule>): Promise<PolicyRule> {
    const existingRule = await this.getRule(id);
    if (!existingRule) {
      throw new Error(`Rule ${id} not found`);
    }

    const updatedRule: PolicyRule = {
      ...existingRule,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...existingRule.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    const rulePath = path.join(this.rulesPath, `${id}.json`);
    await fs.writeJson(rulePath, updatedRule, { spaces: 2 });
    
    this.logger.info(`Updated policy rule: ${updatedRule.name} (${id})`);
    await this.updateBundle();
    
    return updatedRule;
  }

  async deleteRule(id: string): Promise<void> {
    const rulePath = path.join(this.rulesPath, `${id}.json`);
    if (await fs.pathExists(rulePath)) {
      await fs.remove(rulePath);
      this.logger.info(`Deleted policy rule: ${id}`);
      await this.updateBundle();
    }
  }

  async listTemplates(): Promise<PolicyTemplate[]> {
    try {
      const files = await fs.readdir(this.templatesPath);
      const templates: PolicyTemplate[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const templatePath = path.join(this.templatesPath, file);
          const template = await fs.readJson(templatePath);
          templates.push(template);
        }
      }

      return templates.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error('Failed to list templates:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getTemplate(id: string): Promise<PolicyTemplate | undefined> {
    try {
      const templatePath = path.join(this.templatesPath, `${id}.json`);
      if (await fs.pathExists(templatePath)) {
        return await fs.readJson(templatePath);
      }
    } catch (error) {
      this.logger.error(`Failed to get template ${id}:`, { error: error instanceof Error ? error.message : String(error) });
    }
    return undefined;
  }

  async createTemplate(template: Omit<PolicyTemplate, 'id'>): Promise<PolicyTemplate> {
    const id = uuidv4();
    const newTemplate: PolicyTemplate = { ...template, id };

    const templatePath = path.join(this.templatesPath, `${id}.json`);
    await fs.writeJson(templatePath, newTemplate, { spaces: 2 });
    
    this.logger.info(`Created policy template: ${newTemplate.name} (${id})`);
    
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<PolicyTemplate>): Promise<PolicyTemplate> {
    const existingTemplate = await this.getTemplate(id);
    if (!existingTemplate) {
      throw new Error(`Template ${id} not found`);
    }

    const updatedTemplate: PolicyTemplate = {
      ...existingTemplate,
      ...updates,
      id, // Ensure ID doesn't change
    };

    const templatePath = path.join(this.templatesPath, `${id}.json`);
    await fs.writeJson(templatePath, updatedTemplate, { spaces: 2 });
    
    this.logger.info(`Updated policy template: ${updatedTemplate.name} (${id})`);
    
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const templatePath = path.join(this.templatesPath, `${id}.json`);
    if (await fs.pathExists(templatePath)) {
      await fs.remove(templatePath);
      this.logger.info(`Deleted policy template: ${id}`);
    }
  }

  async getBundle(): Promise<PolicyBundle> {
    try {
      if (await fs.pathExists(this.bundlePath)) {
        return await fs.readJson(this.bundlePath);
      }
    } catch (error) {
      this.logger.error('Failed to load policy bundle:', { error: error instanceof Error ? error.message : String(error) });
    }

    // Return empty bundle if none exists
    return {
      rules: [],
      metadata: {
        version: '1.0.0',
        name: 'Default Policy Bundle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async saveBundle(bundle: PolicyBundle): Promise<void> {
    await fs.writeJson(this.bundlePath, bundle, { spaces: 2 });
    this.logger.info(`Saved policy bundle with ${bundle.rules.length} rules`);
  }

  private async updateBundle(): Promise<void> {
    const rules = await this.listRules();
    const bundle: PolicyBundle = {
      rules,
      metadata: {
        version: '1.0.0',
        name: 'Active Policy Bundle',
        description: 'Current active policy rules',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.saveBundle(bundle);
  }
}

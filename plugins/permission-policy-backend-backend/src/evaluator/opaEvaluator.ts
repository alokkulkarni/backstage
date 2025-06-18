/**
 * Open Policy Agent (OPA) Integration for Policy Evaluation
 * Supports both WASM and HTTP server modes
 */

import { LoggerService } from '@backstage/backend-plugin-api';
import {
  PolicyRule,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicyEvaluator,
  PolicyStorage,
} from '../types';

export class OpaPolicyEvaluator implements PolicyEvaluator {
  private opaModule: any = null;

  constructor(
    private readonly storage: PolicyStorage,
    private readonly logger: LoggerService,
    private readonly config: {
      wasmPath?: string;
      serverUrl?: string;
      enableWasm: boolean;
    },
  ) {
    this.initializeOpa();
  }

  private async initializeOpa(): Promise<void> {
    if (this.config.enableWasm) {
      try {
        // Dynamic import of OPA WASM
        const { loadPolicy } = await import('@open-policy-agent/opa-wasm');
        
        // Load the policy WASM module
        const wasmPath = this.config.wasmPath || this.getDefaultWasmPath();
        this.opaModule = await loadPolicy(wasmPath);
        
        this.logger.info('OPA WASM module loaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('Failed to load OPA WASM, falling back to native evaluation:', { 
          error: errorMessage 
        });
        this.config.enableWasm = false;
      }
    }
  }

  private getDefaultWasmPath(): string {
    // Return path to bundled OPA WASM policy
    return require.resolve('../policies/bundle.wasm');
  }

  async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableWasm && this.opaModule) {
        return await this.evaluateWithOpa(context);
      } else {
        return await this.evaluateNative(context);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Policy evaluation failed:', { error: errorMessage });
      return {
        decision: 'deny',
        reason: `Evaluation error: ${errorMessage}`,
        metadata: {
          evaluationTime: Date.now() - startTime,
          rulesEvaluated: 0,
        },
      };
    }
  }

  async evaluateMultiple(contexts: PolicyEvaluationContext[]): Promise<PolicyEvaluationResult[]> {
    // Evaluate in parallel for better performance
    return Promise.all(contexts.map(context => this.evaluate(context)));
  }

  private async evaluateWithOpa(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    
    try {
      // Prepare input for OPA
      const input = {
        user: context.user,
        resource: context.resource,
        action: context.action,
        environment: context.environment || {},
      };

      // Evaluate with OPA WASM
      const result = this.opaModule.evaluate(input);
      
      return {
        decision: result.allow ? 'allow' : 'deny',
        reason: result.reason || 'OPA policy evaluation',
        metadata: {
          evaluationTime: Date.now() - startTime,
          rulesEvaluated: result.rulesEvaluated || 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('OPA evaluation failed:', { error: errorMessage });
      return {
        decision: 'deny',
        reason: `OPA evaluation error: ${errorMessage}`,
        metadata: {
          evaluationTime: Date.now() - startTime,
          rulesEvaluated: 0,
        },
      };
    }
  }

  private async evaluateNative(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    const rules = await this.storage.listRules();
    let rulesEvaluated = 0;

    // Sort rules by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => 
      (b.metadata?.priority || 0) - (a.metadata?.priority || 0)
    );

    for (const rule of sortedRules) {
      rulesEvaluated++;
      
      // Check if rule matches the context
      if (await this.ruleMatches(rule, context)) {
        return {
          decision: rule.effect,
          rule,
          reason: `Matched rule: ${rule.name}`,
          metadata: {
            evaluationTime: Date.now() - startTime,
            rulesEvaluated,
          },
        };
      }
    }

    // No rules matched - default deny
    return {
      decision: 'deny',
      reason: 'No matching rules found',
      metadata: {
        evaluationTime: Date.now() - startTime,
        rulesEvaluated,
      },
    };
  }

  private async ruleMatches(rule: PolicyRule, context: PolicyEvaluationContext): Promise<boolean> {
    // Check resource match
    if (!this.resourceMatches(rule.resource, context.resource.type)) {
      return false;
    }

    // Check action match
    if (!this.actionMatches(rule.actions, context.action)) {
      return false;
    }

    // Check subject match
    if (!await this.subjectMatches(rule.subjects, context.user)) {
      return false;
    }

    // Check conditions
    if (rule.conditions && !await this.conditionsMatch(rule.conditions, context)) {
      return false;
    }

    return true;
  }

  private resourceMatches(ruleResource: string, contextResource: string): boolean {
    if (ruleResource === '*') return true;
    if (ruleResource === contextResource) return true;
    
    // Support for wildcard patterns like "catalog.*"
    if (ruleResource.includes('*')) {
      const pattern = ruleResource.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(contextResource);
    }
    
    return false;
  }

  private actionMatches(ruleActions: string[], contextAction: string): boolean {
    if (ruleActions.includes('*')) return true;
    if (ruleActions.includes(contextAction)) return true;
    
    // Support for wildcard patterns
    return ruleActions.some(action => {
      if (action.includes('*')) {
        const pattern = action.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(contextAction);
      }
      return false;
    });
  }

  private async subjectMatches(ruleSubjects: any[], contextUser: any): Promise<boolean> {
    for (const subject of ruleSubjects) {
      if (subject.type === 'user') {
        if (subject.identifier === '*') return true;
        if (subject.identifier === contextUser.entityRef) return true;
      } else if (subject.type === 'group') {
        if (contextUser.groups?.includes(subject.identifier)) return true;
      }
    }
    return false;
  }

  private async conditionsMatch(conditions: any[], context: PolicyEvaluationContext): Promise<boolean> {
    for (const condition of conditions) {
      if (!await this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: any, context: PolicyEvaluationContext): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'matches':
        return typeof fieldValue === 'string' && new RegExp(condition.value).test(fieldValue);
      default:
        this.logger.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  private getFieldValue(field: string, context: PolicyEvaluationContext): any {
    const parts = field.split('.');
    let value: any = context;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  async validateRule(rule: PolicyRule): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!rule.name?.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.resource?.trim()) {
      errors.push('Resource is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    if (!rule.subjects || rule.subjects.length === 0) {
      errors.push('At least one subject is required');
    }

    if (!['allow', 'deny'].includes(rule.effect)) {
      errors.push('Effect must be either "allow" or "deny"');
    }

    // Validate subjects
    for (const subject of rule.subjects || []) {
      if (!['user', 'group', 'role'].includes(subject.type)) {
        errors.push(`Invalid subject type: ${subject.type}`);
      }
      if (!subject.identifier?.trim()) {
        errors.push('Subject identifier is required');
      }
    }

    // Validate conditions
    for (const condition of rule.conditions || []) {
      if (!condition.field?.trim()) {
        errors.push('Condition field is required');
      }
      if (!['equals', 'not_equals', 'in', 'not_in', 'contains', 'matches'].includes(condition.operator)) {
        errors.push(`Invalid condition operator: ${condition.operator}`);
      }
      if (condition.value === undefined || condition.value === null) {
        errors.push('Condition value is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate OPA Rego policy from rules
   * This can be used to compile rules into OPA format
   */
  async generateRegoPolicy(_rules: PolicyRule[]): Promise<string> {
    let rego = `
package backstage.authz

import rego.v1

# Default deny
default allow := false

# Allow rules
allow if {
  rule_matches
}

rule_matches if {
  some rule in data.rules
  rule_applies(rule)
}

rule_applies(rule) if {
  rule.effect == "allow"
  resource_matches(rule.resource)
  action_matches(rule.actions)
  subject_matches(rule.subjects)
  conditions_match(rule.conditions)
}

resource_matches(resource_pattern) if {
  resource_pattern == "*"
}

resource_matches(resource_pattern) if {
  resource_pattern == input.resource.type
}

action_matches(actions) if {
  "*" in actions
}

action_matches(actions) if {
  input.action in actions
}

subject_matches(subjects) if {
  some subject in subjects
  subject_applies(subject)
}

subject_applies(subject) if {
  subject.type == "user"
  subject.identifier == "*"
}

subject_applies(subject) if {
  subject.type == "user"
  subject.identifier == input.user.entityRef
}

subject_applies(subject) if {
  subject.type == "group"
  subject.identifier in input.user.groups
}

conditions_match(conditions) if {
  count(conditions) == 0
}

conditions_match(conditions) if {
  count(conditions) > 0
  every condition in conditions {
    condition_applies(condition)
  }
}

condition_applies(condition) if {
  condition.operator == "equals"
  get_field_value(condition.field) == condition.value
}

# Add more condition operators as needed...

get_field_value(field) := value if {
  path := split(field, ".")
  value := object.get(input, path, null)
}
`;

    return rego;
  }
}

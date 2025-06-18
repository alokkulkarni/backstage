/**
 * Types for the Permission Policy Backend Plugin
 * Following Backstage standards and OPA integration
 */

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  subjects: PolicySubject[];
  conditions?: PolicyCondition[];
  metadata?: {
    priority?: number;
    tags?: string[];
    category?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface PolicySubject {
  type: 'user' | 'group' | 'role';
  identifier: string; // Backstage entity reference or role name
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'matches';
  value: string | string[];
}

export interface PolicyEvaluationContext {
  user: {
    entityRef: string;
    claims: Record<string, any>;
    groups?: string[];
  };
  resource: {
    type: string;
    identifier?: string;
    attributes?: Record<string, any>;
  };
  action: string;
  environment?: {
    time?: string;
    location?: string;
    [key: string]: any;
  };
}

export interface PolicyEvaluationResult {
  decision: 'allow' | 'deny' | 'not_applicable';
  rule?: PolicyRule;
  reason?: string;
  metadata?: {
    evaluationTime: number;
    rulesEvaluated: number;
  };
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Partial<PolicyRule>;
  variables: PolicyTemplateVariable[];
}

export interface PolicyTemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'array' | 'boolean' | 'number';
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface PolicyBundle {
  rules: PolicyRule[];
  metadata: {
    version: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface PolicyConfig {
  storage: {
    type: 'filesystem' | 'database';
    path?: string;
    connectionString?: string;
  };
  opa: {
    enabled: boolean;
    wasmPath?: string;
    serverUrl?: string;
  };
  defaultTemplates: boolean;
  evaluation: {
    cacheEnabled: boolean;
    cacheTtl: number;
    parallelEvaluation: boolean;
  };
}

export interface PolicyStorage {
  listRules(): Promise<PolicyRule[]>;
  getRule(id: string): Promise<PolicyRule | undefined>;
  createRule(rule: Omit<PolicyRule, 'id'>): Promise<PolicyRule>;
  updateRule(id: string, rule: Partial<PolicyRule>): Promise<PolicyRule>;
  deleteRule(id: string): Promise<void>;
  
  listTemplates(): Promise<PolicyTemplate[]>;
  getTemplate(id: string): Promise<PolicyTemplate | undefined>;
  createTemplate(template: Omit<PolicyTemplate, 'id'>): Promise<PolicyTemplate>;
  updateTemplate(id: string, template: Partial<PolicyTemplate>): Promise<PolicyTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  getBundle(): Promise<PolicyBundle>;
  saveBundle(bundle: PolicyBundle): Promise<void>;
}

export interface PolicyEvaluator {
  evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult>;
  evaluateMultiple(contexts: PolicyEvaluationContext[]): Promise<PolicyEvaluationResult[]>;
  validateRule(rule: PolicyRule): Promise<{ valid: boolean; errors: string[] }>;
}

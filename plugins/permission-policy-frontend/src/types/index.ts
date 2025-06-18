/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

export interface PolicyTestRequest {
  user: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface PolicyTestResult {
  decision: 'allow' | 'deny' | 'not_applicable';
  rule?: PolicyRule;
  reason?: string;
  metadata?: {
    evaluationTime: number;
    rulesEvaluated: number;
  };
}

export interface PolicyListFilter {
  search?: string;
  effect?: 'allow' | 'deny';
  resourceType?: string;
  action?: string;
  enabled?: boolean;
  category?: string;
  tags?: string[];
  priority?: number;
}

export interface PolicyTestCase {
  name: string;
  description?: string;
  user: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
  expectedDecision: 'allow' | 'deny' | 'not_applicable';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  entityRef?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  entityRef?: string;
}

// UI specific types
export interface PolicyFormData {
  name: string;
  description: string;
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  subjects: PolicySubject[];
  conditions: PolicyCondition[];
  priority: number;
  category: string;
  tags: string[];
}

// Resource types for the UI
export const RESOURCE_TYPES = [
  'catalog-entity',
  'catalog-location',
  'scaffolder-template',
  'scaffolder-action',
  'kubernetes-cluster',
  'permission',
  'custom',
] as const;

// Common actions for resources
export const COMMON_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'catalog:read',
  'catalog:write',
  'scaffolder:read',
  'scaffolder:use',
  'policy:read',
  'policy:write',
  'policy:delete',
] as const;

// Policy categories
export const POLICY_CATEGORIES = [
  'access-control',
  'data-protection',
  'compliance',
  'security',
  'operations',
  'custom',
] as const;

// Condition operators
export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals', description: 'Field equals the specified value' },
  { value: 'not_equals', label: 'Not Equals', description: 'Field does not equal the specified value' },
  { value: 'in', label: 'In', description: 'Field value is in the specified list' },
  { value: 'not_in', label: 'Not In', description: 'Field value is not in the specified list' },
  { value: 'contains', label: 'Contains', description: 'Field contains the specified value' },
  { value: 'matches', label: 'Matches', description: 'Field matches the specified regex pattern' },
] as const;

// Common condition fields
export const CONDITION_FIELDS = [
  { value: 'user.groups', label: 'User Groups', description: 'User group memberships' },
  { value: 'user.email', label: 'User Email', description: 'User email address' },
  { value: 'user.claims.department', label: 'User Department', description: 'User department from claims' },
  { value: 'resource.type', label: 'Resource Type', description: 'Type of resource being accessed' },
  { value: 'resource.owner', label: 'Resource Owner', description: 'Owner of the resource' },
  { value: 'resource.namespace', label: 'Resource Namespace', description: 'Namespace of the resource' },
  { value: 'environment.time', label: 'Time', description: 'Current time' },
  { value: 'environment.location', label: 'Location', description: 'Access location' },
] as const;

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  details?: string;
  statusCode?: number;
}

export interface UiState {
  loading: boolean;
  error?: ApiError;
}

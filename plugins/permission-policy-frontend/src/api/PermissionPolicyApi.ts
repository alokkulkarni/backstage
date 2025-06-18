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

import { createApiRef } from '@backstage/core-plugin-api';
import {
  PolicyRule,
  PolicyTemplate,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicyTestCase,
  ApiListResponse,
  PolicyListFilter,
} from '../types';

export const permissionPolicyApiRef = createApiRef<PermissionPolicyApi>({
  id: 'plugin.permission-policy.service',
});

export interface PermissionPolicyApi {
  // Policy Rules
  getRules(filter?: PolicyListFilter): Promise<ApiListResponse<PolicyRule>>;
  getRule(id: string): Promise<PolicyRule>;
  createRule(rule: Omit<PolicyRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyRule>;
  updateRule(id: string, rule: Partial<PolicyRule>): Promise<PolicyRule>;
  deleteRule(id: string): Promise<void>;

  // Policy Templates
  getTemplates(): Promise<PolicyTemplate[]>;
  getTemplate(id: string): Promise<PolicyTemplate>;

  // Policy Evaluation
  evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult>;
  testPolicies(testCases: PolicyTestCase[]): Promise<Array<{
    testCase: PolicyTestCase;
    result: PolicyEvaluationResult;
    passed: boolean;
  }>>;

  // Catalog Integration
  getUsers(): Promise<Array<{ entityRef: string; name: string; }>>;
  getGroups(): Promise<Array<{ entityRef: string; name: string; }>>;
}

export class PermissionPolicyApiClient implements PermissionPolicyApi {
  private readonly discoveryApi: any;
  private readonly fetchApi: any;

  constructor(options: {
    discoveryApi: any;
    fetchApi: any;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('permission-policy');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${path}`;
    
    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getRules(filter?: PolicyListFilter): Promise<ApiListResponse<PolicyRule>> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const queryString = params.toString();
    const path = `/rules${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ApiListResponse<PolicyRule>>(path);
  }

  async getRule(id: string): Promise<PolicyRule> {
    return this.request<PolicyRule>(`/rules/${encodeURIComponent(id)}`);
  }

  async createRule(rule: Omit<PolicyRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyRule> {
    return this.request<PolicyRule>('/rules', {
      method: 'POST',
      body: JSON.stringify({ rule }),
    });
  }

  async updateRule(id: string, rule: Partial<PolicyRule>): Promise<PolicyRule> {
    return this.request<PolicyRule>(`/rules/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ rule }),
    });
  }

  async deleteRule(id: string): Promise<void> {
    await this.request<void>(`/rules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getTemplates(): Promise<PolicyTemplate[]> {
    return this.request<PolicyTemplate[]>('/templates');
  }

  async getTemplate(id: string): Promise<PolicyTemplate> {
    return this.request<PolicyTemplate>(`/templates/${encodeURIComponent(id)}`);
  }

  async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    return this.request<PolicyEvaluationResult>('/evaluate', {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
  }

  async testPolicies(testCases: PolicyTestCase[]): Promise<Array<{
    testCase: PolicyTestCase;
    result: PolicyEvaluationResult;
    passed: boolean;
  }>> {
    return this.request('/test', {
      method: 'POST',
      body: JSON.stringify({ testCases }),
    });
  }

  async getUsers(): Promise<Array<{ entityRef: string; name: string; }>> {
    return this.request<Array<{ entityRef: string; name: string; }>>('/users');
  }

  async getGroups(): Promise<Array<{ entityRef: string; name: string; }>> {
    return this.request<Array<{ entityRef: string; name: string; }>>('/groups');
  }
}

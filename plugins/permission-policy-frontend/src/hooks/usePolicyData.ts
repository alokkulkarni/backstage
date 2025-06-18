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

import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { permissionPolicyApiRef } from '../api/PermissionPolicyApi';
import {
  PolicyRule,
  PolicyTemplate,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicyTestCase,
  ApiListResponse,
  PolicyListFilter,
  UiState,
} from '../types';

export const usePolicyRules = (filter?: PolicyListFilter) => {
  const api = useApi(permissionPolicyApiRef);
  const [state, setState] = useState<UiState & { data?: ApiListResponse<PolicyRule> }>({
    loading: false,
  });

  const fetchRules = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const data = await api.getRules(filter);
      setState({ loading: false, data });
    } catch (error) {
      setState({
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Failed to fetch policy rules' },
      });
    }
  }, [api, filter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { ...state, refetch: fetchRules };
};

export const usePolicyRule = (id?: string) => {
  const api = useApi(permissionPolicyApiRef);
  const [state, setState] = useState<UiState & { data?: PolicyRule }>({
    loading: false,
  });

  const fetchRule = useCallback(async () => {
    if (!id) return;
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const data = await api.getRule(id);
      setState({ loading: false, data });
    } catch (error) {
      setState({
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Failed to fetch policy rule' },
      });
    }
  }, [api, id]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule]);

  return { ...state, refetch: fetchRule };
};

export const usePolicyTemplates = () => {
  const api = useApi(permissionPolicyApiRef);
  const [state, setState] = useState<UiState & { data?: PolicyTemplate[] }>({
    loading: false,
  });

  const fetchTemplates = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const data = await api.getTemplates();
      setState({ loading: false, data });
    } catch (error) {
      setState({
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Failed to fetch policy templates' },
      });
    }
  }, [api]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { ...state, refetch: fetchTemplates };
};

export const usePolicyActions = () => {
  const api = useApi(permissionPolicyApiRef);

  const createRule = useCallback(async (rule: Omit<PolicyRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    return api.createRule(rule);
  }, [api]);

  const updateRule = useCallback(async (id: string, rule: Partial<PolicyRule>) => {
    return api.updateRule(id, rule);
  }, [api]);

  const deleteRule = useCallback(async (id: string) => {
    return api.deleteRule(id);
  }, [api]);

  const evaluatePolicy = useCallback(async (context: PolicyEvaluationContext) => {
    return api.evaluate(context);
  }, [api]);

  const testPolicies = useCallback(async (testCases: PolicyTestCase[]) => {
    return api.testPolicies(testCases);
  }, [api]);

  return {
    createRule,
    updateRule,
    deleteRule,
    evaluatePolicy,
    testPolicies,
  };
};

export const useCatalogEntities = () => {
  const api = useApi(permissionPolicyApiRef);
  const [state, setState] = useState<UiState & { 
    users?: Array<{ entityRef: string; name: string; }>;
    groups?: Array<{ entityRef: string; name: string; }>;
  }>({
    loading: false,
  });

  const fetchEntities = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const [users, groups] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
      ]);
      setState({ loading: false, users, groups });
    } catch (error) {
      setState({
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Failed to fetch catalog entities' },
      });
    }
  }, [api]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  return { ...state, refetch: fetchEntities };
};

export const usePolicyEvaluation = () => {
  const api = useApi(permissionPolicyApiRef);
  const [state, setState] = useState<UiState & { result?: PolicyEvaluationResult }>({
    loading: false,
  });

  const evaluate = useCallback(async (context: PolicyEvaluationContext) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const result = await api.evaluate(context);
      setState({ loading: false, result });
      return result;
    } catch (error) {
      setState({
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Failed to evaluate policy' },
      });
      throw error;
    }
  }, [api]);

  const reset = useCallback(() => {
    setState({ loading: false });
  }, []);

  return { ...state, evaluate, reset };
};

/**
 * Permission Policy Router
 * RESTful API endpoints for policy management
 */

import { Router } from 'express';
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError } from '@backstage/errors';
import { PermissionPolicyService } from '../service/PermissionPolicyService';

export function createRouter(
  service: PermissionPolicyService,
  logger: LoggerService,
): Router {
  const router = Router();
  
  // Add JSON parsing middleware
  router.use(express.json());

  // Helper function to safely log errors
  const logError = (message: string, error: unknown) => {
    logger.error(message, error instanceof Error ? error : new Error(String(error)));
  };

  // Policy Rules endpoints
  router.get('/rules', async (_req, res) => {
    try {
      const rules = await service.listRules();
      // Return data in the format expected by frontend ApiListResponse<PolicyRule>
      res.json({ 
        items: rules || [],
        total: (rules || []).length 
      });
    } catch (error) {
      logError('Failed to list rules:', error);
      res.status(500).json({ error: 'Failed to list rules' });
    }
  });

  router.get('/rules/:id', async (req, res) => {
    try {
      const rule = await service.getRule(req.params.id);
      if (!rule) {
        throw new NotFoundError(`Rule ${req.params.id} not found`);
      }
      res.json({ rule });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        logError('Failed to get rule:', error);
        res.status(500).json({ error: 'Failed to get rule' });
      }
    }
  });

  router.post('/rules', async (req, res) => {
    try {
      const { rule } = req.body;
      if (!rule) {
        throw new InputError('Rule data is required');
      }
      const newRule = await service.createRule(rule);
      res.status(201).json({ rule: newRule });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to create rule:', error);
        res.status(500).json({ error: 'Failed to create rule' });
      }
    }
  });

  router.put('/rules/:id', async (req, res) => {
    try {
      const { rule } = req.body;
      if (!rule) {
        throw new InputError('Rule data is required');
      }
      const updatedRule = await service.updateRule(req.params.id, rule);
      res.json({ rule: updatedRule });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        logError('Failed to update rule:', error);
        res.status(500).json({ error: 'Failed to update rule' });
      }
    }
  });

  router.delete('/rules/:id', async (req, res) => {
    try {
      await service.deleteRule(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError('Failed to delete rule:', error);
      res.status(500).json({ error: 'Failed to delete rule' });
    }
  });

  // Policy Template endpoints
  router.get('/templates', async (_req, res) => {
    try {
      const templates = await service.listTemplates();
      // Return templates array directly as expected by frontend
      res.json(templates || []);
    } catch (error) {
      logError('Failed to list templates:', error);
      res.status(500).json({ error: 'Failed to list templates' });
    }
  });

  router.get('/templates/:id', async (req, res) => {
    try {
      const template = await service.getTemplate(req.params.id);
      if (!template) {
        throw new NotFoundError(`Template ${req.params.id} not found`);
      }
      res.json({ template });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        logError('Failed to get template:', error);
        res.status(500).json({ error: 'Failed to get template' });
      }
    }
  });

  router.post('/templates', async (req, res) => {
    try {
      const { template } = req.body;
      if (!template) {
        throw new InputError('Template data is required');
      }
      const newTemplate = await service.createTemplate(template);
      res.status(201).json({ template: newTemplate });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to create template:', error);
        res.status(500).json({ error: 'Failed to create template' });
      }
    }
  });

  router.put('/templates/:id', async (req, res) => {
    try {
      const { template } = req.body;
      if (!template) {
        throw new InputError('Template data is required');
      }
      const updatedTemplate = await service.updateTemplate(req.params.id, template);
      res.json({ template: updatedTemplate });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        logError('Failed to update template:', error);
        res.status(500).json({ error: 'Failed to update template' });
      }
    }
  });

  router.delete('/templates/:id', async (req, res) => {
    try {
      await service.deleteTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError('Failed to delete template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  router.post('/templates/:id/create-rule', async (req, res) => {
    try {
      const { variables } = req.body;
      if (!variables) {
        throw new InputError('Template variables are required');
      }
      const rule = await service.createRuleFromTemplate(req.params.id, variables);
      res.status(201).json({ rule });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to create rule from template:', error);
        res.status(500).json({ error: 'Failed to create rule from template' });
      }
    }
  });

  // Policy Evaluation endpoints
  router.post('/evaluate', async (req, res) => {
    try {
      const { context } = req.body;
      if (!context) {
        throw new InputError('Evaluation context is required');
      }
      const result = await service.evaluate(context);
      res.json({ result });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to evaluate policy:', error);
        res.status(500).json({ error: 'Failed to evaluate policy' });
      }
    }
  });

  router.post('/evaluate/multiple', async (req, res) => {
    try {
      const { contexts } = req.body;
      if (!contexts || !Array.isArray(contexts)) {
        throw new InputError('Evaluation contexts array is required');
      }
      const results = await service.evaluateMultiple(contexts);
      res.json({ results });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to evaluate policies:', error);
        res.status(500).json({ error: 'Failed to evaluate policies' });
      }
    }
  });

  router.post('/validate', async (req, res) => {
    try {
      const { rule } = req.body;
      if (!rule) {
        throw new InputError('Rule data is required for validation');
      }
      const validation = await service.validateRule(rule);
      res.json({ validation });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to validate rule:', error);
        res.status(500).json({ error: 'Failed to validate rule' });
      }
    }
  });

  // Bundle Management endpoints
  router.get('/bundle', async (_req, res) => {
    try {
      const bundle = await service.getBundle();
      res.json({ bundle });
    } catch (error) {
      logError('Failed to get bundle:', error);
      res.status(500).json({ error: 'Failed to get bundle' });
    }
  });

  router.post('/bundle/export', async (_req, res) => {
    try {
      const bundle = await service.exportBundle();
      res.json({ bundle });
    } catch (error) {
      logError('Failed to export bundle:', error);
      res.status(500).json({ error: 'Failed to export bundle' });
    }
  });

  router.post('/bundle/import', async (req, res) => {
    try {
      const { bundle } = req.body;
      if (!bundle) {
        throw new InputError('Bundle data is required');
      }
      await service.importBundle(bundle);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to import bundle:', error);
        res.status(500).json({ error: 'Failed to import bundle' });
      }
    }
  });

  // Catalog Integration endpoints
  router.get('/catalog/users', async (_req, res) => {
    try {
      const users = await service.getAllUsers();
      res.json({ users });
    } catch (error) {
      logError('Failed to get users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  router.get('/catalog/groups', async (_req, res) => {
    try {
      const groups = await service.getAllGroups();
      res.json({ groups });
    } catch (error) {
      logError('Failed to get groups:', error);
      res.status(500).json({ error: 'Failed to get groups' });
    }
  });

  router.get('/catalog/users/:userRef/groups', async (req, res) => {
    try {
      const groups = await service.getUserGroups(req.params.userRef);
      res.json({ groups });
    } catch (error) {
      logError('Failed to get user groups:', error);
      res.status(500).json({ error: 'Failed to get user groups' });
    }
  });

  // Catalog Integration endpoints (for frontend dropdowns)
  router.get('/users', async (_req, res) => {
    try {
      const users = await service.getUsers();
      res.json(users);
    } catch (error) {
      logError('Failed to get users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  router.get('/groups', async (_req, res) => {
    try {
      const groups = await service.getGroups();
      res.json(groups);
    } catch (error) {
      logError('Failed to get groups:', error);
      res.status(500).json({ error: 'Failed to get groups' });
    }
  });

  // Testing and Simulation endpoints
  router.post('/test/rule', async (req, res) => {
    try {
      const { rule, testContexts } = req.body;
      if (!rule || !testContexts) {
        throw new InputError('Rule and test contexts are required');
      }
      const result = await service.testRule(rule, testContexts);
      res.json({ result });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to test rule:', error);
        res.status(500).json({ error: 'Failed to test rule' });
      }
    }
  });

  router.post('/test/simulate/:ruleId', async (req, res) => {
    try {
      const { changes, testContexts } = req.body;
      if (!changes || !testContexts) {
        throw new InputError('Changes and test contexts are required');
      }
      const result = await service.simulateRuleChange(req.params.ruleId, changes, testContexts);
      res.json({ result });
    } catch (error) {
      if (error instanceof InputError) {
        res.status(400).json({ error: error.message });
      } else {
        logError('Failed to simulate rule change:', error);
        res.status(500).json({ error: 'Failed to simulate rule change' });
      }
    }
  });

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}

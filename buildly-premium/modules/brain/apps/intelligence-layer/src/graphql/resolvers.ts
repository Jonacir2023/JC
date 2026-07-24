import { IResolvers } from 'apollo-server-express';

export const resolvers: IResolvers = {
  Query: {
    // Tenant queries
    me: async (_, __, context) => {
      const tenant = context.tenant;
      if (!tenant) throw new Error('Not authenticated');
      return tenant;
    },

    tenants: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');
      // Return tenants for current user
      return context.db.query('SELECT * FROM tenants WHERE owner_id = $1', [context.user.id]);
    },

    tenant: async (_, { id }, context) => {
      if (!context.tenant) throw new Error('Not authenticated');
      return context.db.query('SELECT * FROM tenants WHERE id = $1', [id]);
    },

    // Event queries
    events: async (_, { obra_id, limit, offset }, context) => {
      const tenant_id = context.tenant.id;
      return context.db.query(
        'SELECT * FROM rdo_events WHERE tenant_id = $1 AND obra_id = $2 LIMIT $3 OFFSET $4',
        [tenant_id, obra_id, limit, offset]
      );
    },

    event: async (_, { id }, context) => {
      const tenant_id = context.tenant.id;
      return context.db.query(
        'SELECT * FROM rdo_events WHERE id = $1 AND tenant_id = $2',
        [id, tenant_id]
      );
    },

    // Pattern queries
    patterns: async (_, { obra_id, pattern_type }, context) => {
      const tenant_id = context.tenant.id;
      const query = pattern_type
        ? 'SELECT * FROM brain_alerts WHERE tenant_id = $1 AND obra_id = $2 AND pattern_type = $3'
        : 'SELECT * FROM brain_alerts WHERE tenant_id = $1 AND obra_id = $2';

      const params = pattern_type ? [tenant_id, obra_id, pattern_type] : [tenant_id, obra_id];
      return context.db.query(query, params);
    },

    patternStats: async (_, { pattern_type }, context) => {
      const tenant_id = context.tenant.id;
      const result = await context.db.query(
        `SELECT pattern_type, COUNT(*) as count, AVG(confidence) as avg_confidence
         FROM brain_alerts
         WHERE tenant_id = $1 AND pattern_type = $2
         GROUP BY pattern_type`,
        [tenant_id, pattern_type]
      );
      return result;
    },

    // Alert queries
    alerts: async (_, { obra_id, severity }, context) => {
      const tenant_id = context.tenant.id;
      const query = severity
        ? 'SELECT * FROM brain_alerts WHERE tenant_id = $1 AND obra_id = $2 AND alert_severity = $3'
        : 'SELECT * FROM brain_alerts WHERE tenant_id = $1 AND obra_id = $2';

      const params = severity ? [tenant_id, obra_id, severity] : [tenant_id, obra_id];
      return context.db.query(query, params);
    },

    alertStats: async (_, { obra_id }, context) => {
      const tenant_id = context.tenant.id;
      const stats = await context.db.query(
        `SELECT
          obra_id,
          COUNT(*) as total_alerts,
          AVG(confidence) as avg_confidence,
          COUNT(DISTINCT CASE WHEN pattern_type = 'temporal' THEN 1 END) as temporal_count,
          COUNT(DISTINCT CASE WHEN pattern_type = 'causal' THEN 1 END) as causal_count,
          COUNT(DISTINCT CASE WHEN pattern_type = 'cascade' THEN 1 END) as cascade_count,
          COUNT(DISTINCT CASE WHEN pattern_type = 'resource' THEN 1 END) as resource_count
         FROM brain_alerts
         WHERE tenant_id = $1 AND obra_id = $2
         GROUP BY obra_id`,
        [tenant_id, obra_id]
      );
      return stats[0] || null;
    },

    // Search
    search: async (_, { query, obra_id, limit }, context) => {
      const tenant_id = context.tenant.id;
      const startTime = Date.now();

      const results = await context.services.semanticSearch.search({
        query,
        tenant_id,
        obra_id,
        limit,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        results,
        total_found: results.length,
        execution_time_ms: executionTime,
      };
    },

    searchAdvanced: async (_, { query, obra_id, filters, limit }, context) => {
      const tenant_id = context.tenant.id;
      const startTime = Date.now();

      const results = await context.services.semanticSearch.searchAdvanced({
        query,
        tenant_id,
        obra_id,
        filters,
        limit,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        results,
        total_found: results.length,
        execution_time_ms: executionTime,
      };
    },

    // Health
    health: async (_, __, context) => {
      const services = await context.services.health.check();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services,
        uptime_seconds: Math.floor(process.uptime()),
        version: '3.6.0',
      };
    },
  },

  Mutation: {
    // Tenant mutations
    createTenant: async (_, { name, slug }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const tenant = {
        id: `tenant-${Date.now()}`,
        name,
        slug,
        owner_id: context.user.id,
        subscription_tier: 'FREE',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await context.db.query(
        `INSERT INTO tenants (id, name, slug, owner_id, subscription_tier, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenant.id, name, slug, context.user.id, 'FREE', true, tenant.created_at]
      );

      return tenant;
    },

    updateTenant: async (_, { id, name, slug }, context) => {
      if (!context.tenant || context.tenant.id !== id) {
        throw new Error('Unauthorized');
      }

      const updates = [];
      const params = [id];

      if (name) {
        updates.push(`name = $${params.length + 1}`);
        params.push(name);
      }
      if (slug) {
        updates.push(`slug = $${params.length + 1}`);
        params.push(slug);
      }

      if (updates.length === 0) return context.tenant;

      const query = `UPDATE tenants SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
      const result = await context.db.query(query, params);
      return result[0];
    },

    deleteTenant: async (_, { id }, context) => {
      if (!context.tenant || context.tenant.id !== id) {
        throw new Error('Unauthorized');
      }

      await context.db.query('DELETE FROM tenants WHERE id = $1', [id]);
      return true;
    },

    // Event mutations
    createEvent: async (_, { input }, context) => {
      const tenant_id = context.tenant.id;
      const event_id = `RDO-${Date.now()}`;

      const event = {
        id: event_id,
        tenant_id,
        obra_id: input.obra_id,
        tipo: input.tipo,
        descricao: input.descricao,
        criador: input.criador,
        data_evento: input.data_evento,
        created_at: new Date().toISOString(),
      };

      await context.db.query(
        `INSERT INTO rdo_events (id, tenant_id, obra_id, tipo, descricao, criador, data_evento, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [event.id, tenant_id, input.obra_id, input.tipo, input.descricao, input.criador, input.data_evento, event.created_at]
      );

      // Trigger pattern detection
      await context.services.patternDetector.detect(event);

      return event;
    },

    updateEvent: async (_, { id, input }, context) => {
      const tenant_id = context.tenant.id;

      const updates = [];
      const params = [id, tenant_id];

      if (input.tipo) {
        updates.push(`tipo = $${params.length + 1}`);
        params.push(input.tipo);
      }
      if (input.descricao) {
        updates.push(`descricao = $${params.length + 1}`);
        params.push(input.descricao);
      }
      if (input.criador) {
        updates.push(`criador = $${params.length + 1}`);
        params.push(input.criador);
      }

      const query = `UPDATE rdo_events SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`;
      const result = await context.db.query(query, params);
      return result[0];
    },

    // Alert mutations
    recordAlertFeedback: async (_, { alert_id, action_taken, effectiveness_achieved }, context) => {
      const tenant_id = context.tenant.id;

      await context.db.query(
        `INSERT INTO brain_alert_feedback (alert_id, action_taken, effectiveness_achieved, created_at)
         VALUES ($1, $2, $3, $4)`,
        [alert_id, action_taken, effectiveness_achieved || null, new Date().toISOString()]
      );

      // Update pattern weights
      await context.services.patternDetector.updateWeights(alert_id, effectiveness_achieved);

      const alert = await context.db.query(
        'SELECT * FROM brain_alerts WHERE id = $1 AND tenant_id = $2',
        [alert_id, tenant_id]
      );

      return alert[0];
    },

    // Subscription mutations
    upgradeSubscription: async (_, { tenant_id, tier }, context) => {
      if (context.tenant.id !== tenant_id) {
        throw new Error('Unauthorized');
      }

      await context.db.query(
        'UPDATE tenants SET subscription_tier = $1 WHERE id = $2',
        [tier, tenant_id]
      );

      const features = {
        FREE: ['basic_search', 'pattern_detection'],
        PRO: ['basic_search', 'pattern_detection', 'advanced_filters', 'api_access'],
        ENTERPRISE: ['basic_search', 'pattern_detection', 'advanced_filters', 'api_access', 'multi_workspace', 'custom_integrations'],
      };

      return {
        tier,
        max_obrasCount: tier === 'FREE' ? 1 : tier === 'PRO' ? 5 : 999,
        max_api_requests_per_month: tier === 'FREE' ? 1000 : tier === 'PRO' ? 100000 : 999999,
        features: features[tier],
      };
    },
  },
};

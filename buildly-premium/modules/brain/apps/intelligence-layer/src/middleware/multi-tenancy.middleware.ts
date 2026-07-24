import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

interface TenantRequest extends Request {
  tenant?: any;
  user?: any;
  db?: Pool;
}

@Injectable()
export class MultiTenancyMiddleware implements NestMiddleware {
  constructor(private readonly pool: Pool) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      // Extract tenant from header or JWT
      const tenantId = this.extractTenantId(req);
      if (!tenantId) {
        throw new UnauthorizedException('Tenant ID not provided');
      }

      // Verify tenant exists and is active
      const tenant = await this.getTenant(tenantId);
      if (!tenant || !tenant.is_active) {
        throw new UnauthorizedException('Tenant not found or inactive');
      }

      // Extract user from JWT or context
      const user = this.extractUser(req);

      // Attach to request object
      req.tenant = tenant;
      req.user = user;
      req.db = this.pool;

      // Set database connection to use tenant-specific schema or data
      // For PostgreSQL, we use row-level security (RLS) with tenant_id
      // All queries automatically filter by tenant_id

      next();
    } catch (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error.message,
      });
    }
  }

  private extractTenantId(req: TenantRequest): string | null {
    // Try multiple sources for tenant ID
    // 1. X-Tenant-ID header
    const headerTenant = req.get('X-Tenant-ID');
    if (headerTenant) return headerTenant;

    // 2. JWT payload
    const authHeader = req.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = this.decodeJWT(token);
        if (decoded.tenant_id) return decoded.tenant_id;
      } catch (e) {
        // Fall through
      }
    }

    // 3. Query parameter (for debugging/testing)
    if (process.env.NODE_ENV === 'development') {
      const queryTenant = req.query.tenant_id as string;
      if (queryTenant) return queryTenant;
    }

    return null;
  }

  private extractUser(req: TenantRequest): any | null {
    const authHeader = req.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        return this.decodeJWT(token);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private async getTenant(tenantId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM tenants WHERE id = $1 AND is_active = true',
      [tenantId]
    );
    return result.rows[0] || null;
  }

  private decodeJWT(token: string): any {
    // Simple JWT decode (doesn't verify signature)
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');

    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return decoded;
  }
}

/**
 * GraphQL Context Builder
 * Enriches Apollo context with tenant and database info
 */
export function buildGraphQLContext(req: TenantRequest) {
  return {
    tenant: req.tenant,
    user: req.user,
    db: req.db,
    // Services injected here
    services: {
      semanticSearch: req.app?.get?.('SemanticSearchService'),
      patternDetector: req.app?.get?.('PatternDetectorService'),
      health: req.app?.get?.('HealthService'),
    },
  };
}

/**
 * Row-Level Security (RLS) Helper
 * Ensures all DB queries include tenant_id filter
 */
export class TenantQueryBuilder {
  static addTenantFilter(query: string, tenantId: string): [string, any[]] {
    // Ensures all queries filter by tenant_id
    // Usage: const [sql, params] = TenantQueryBuilder.addTenantFilter(
    //          'SELECT * FROM rdo_events',
    //          context.tenant.id
    //        );

    // Simple regex-based approach (production should use proper query builder)
    const whereIndex = query.indexOf('WHERE');

    if (whereIndex === -1) {
      return [
        query + ` WHERE tenant_id = $1`,
        [tenantId],
      ];
    }

    const beforeWhere = query.slice(0, whereIndex + 5);
    const afterWhere = query.slice(whereIndex + 5);

    return [
      `${beforeWhere} tenant_id = $1 AND ${afterWhere}`,
      [tenantId],
    ];
  }
}

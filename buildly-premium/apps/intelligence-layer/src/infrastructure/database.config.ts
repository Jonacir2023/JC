/**
 * Database Configuration
 *
 * Centraliza configurações de conexão para:
 * - PostgreSQL (Event Store + Estado)
 * - Neo4j (Graph DB)
 */

import { Pool } from 'pg';
import neo4j, { Driver, Session } from 'neo4j-driver';

export interface IDatabaseConfig {
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max_pool_size: number;
  };
  neo4j: {
    uri: string;
    user: string;
    password: string;
    database: string;
  };
}

export interface IDatabaseConnections {
  postgres: Pool;
  neo4j: Driver;
}

/**
 * Factory para criar conexões com bancos de dados
 */
export class DatabaseFactory {
  /**
   * Carrega configurações do ambiente
   */
  static loadConfig(): IDatabaseConfig {
    return {
      postgres: {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'buildly',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'password',
        max_pool_size: parseInt(process.env.PG_POOL_SIZE || '20'),
      },
      neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        user: process.env.NEO4J_USER || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'password',
        database: process.env.NEO4J_DB || 'neo4j',
      },
    };
  }

  /**
   * Cria conexões com ambos os bancos
   */
  static async createConnections(config: IDatabaseConfig): Promise<IDatabaseConnections> {
    console.log('[DatabaseFactory] Inicializando conexões...');

    // ========== PostgreSQL ==========
    const postgres_pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      max: config.postgres.max_pool_size,
    });

    // Testar conexão PostgreSQL
    try {
      const result = await postgres_pool.query('SELECT NOW()');
      console.log('✓ PostgreSQL conectado em', result.rows[0].now);
    } catch (erro) {
      console.error('✗ Erro conectando PostgreSQL:', erro);
      throw erro;
    }

    // ========== Neo4j ==========
    const neo4j_driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );

    // Testar conexão Neo4j
    try {
      const session = neo4j_driver.session({ database: config.neo4j.database });
      const result = await session.run('RETURN datetime() as now');
      const now = result.records[0].get('now');
      await session.close();
      console.log('✓ Neo4j conectado em', now);
    } catch (erro) {
      console.error('✗ Erro conectando Neo4j:', erro);
      throw erro;
    }

    return {
      postgres: postgres_pool,
      neo4j: neo4j_driver,
    };
  }

  /**
   * Fecha conexões (cleanup)
   */
  static async closeConnections(connections: IDatabaseConnections): Promise<void> {
    console.log('[DatabaseFactory] Fechando conexões...');
    await connections.postgres.end();
    await connections.neo4j.close();
    console.log('✓ Conexões fechadas');
  }
}

/**
 * Exemplo de uso:
 *
 * const config = DatabaseFactory.loadConfig();
 * const connections = await DatabaseFactory.createConnections(config);
 *
 * // Usar conexões
 * const result = await connections.postgres.query('SELECT * FROM events');
 * const session = connections.neo4j.session();
 * const graph_result = await session.run('MATCH (n) RETURN n LIMIT 5');
 * await session.close();
 *
 * // Cleanup
 * await DatabaseFactory.closeConnections(connections);
 */

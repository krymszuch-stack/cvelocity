import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { Entity, Relation, Proposal, EntitySchema, RelationSchema } from '../domain/types.js';
import { normalizeTerm } from '../services/normalizer.js';

export class SqliteGraphRepository {
  private dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>>;

  constructor(dbPath: string = './data/swg.db') {
    const resolvedPath = path.resolve(dbPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.dbPromise = open({
      filename: resolvedPath,
      driver: sqlite3.Database,
    }).then(async (db) => {
      await this.initDatabase(db);
      return db;
    });
  }

  private async initDatabase(db: Database): Promise<void> {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        aliases TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL NOT NULL,
        source TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
      CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);

      CREATE TABLE IF NOT EXISTS relations (
        id TEXT PRIMARY KEY,
        fromEntityId TEXT NOT NULL,
        toEntityId TEXT NOT NULL,
        type TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1.0,
        confidence REAL NOT NULL,
        status TEXT NOT NULL,
        source TEXT NOT NULL,
        evidence TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY(fromEntityId) REFERENCES entities(id) ON DELETE CASCADE,
        FOREIGN KEY(toEntityId) REFERENCES entities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(fromEntityId);
      CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(toEntityId);
      CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(type);
      CREATE INDEX IF NOT EXISTS idx_relations_status ON relations(status);

      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        status TEXT NOT NULL,
        proposedBy TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
    `);
  }

  public async upsertEntity(entity: Entity): Promise<void> {
    const db = await this.dbPromise;
    const validated = EntitySchema.parse(entity);
    await db.run(
      `
      INSERT INTO entities (id, type, name, aliases, description, tags, status, confidence, source, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type,
        name=excluded.name,
        aliases=excluded.aliases,
        description=excluded.description,
        tags=excluded.tags,
        status=excluded.status,
        confidence=excluded.confidence,
        source=excluded.source,
        updatedAt=excluded.updatedAt
    `,
      [
        validated.id,
        validated.type,
        validated.name,
        JSON.stringify(validated.aliases),
        validated.description,
        JSON.stringify(validated.tags),
        validated.status,
        validated.confidence,
        validated.source,
        validated.createdAt,
        validated.updatedAt,
      ]
    );
  }

  public async upsertRelation(relation: Relation): Promise<void> {
    const db = await this.dbPromise;
    const validated = RelationSchema.parse(relation);
    await db.run(
      `
      INSERT INTO relations (id, fromEntityId, toEntityId, type, weight, confidence, status, source, evidence, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        fromEntityId=excluded.fromEntityId,
        toEntityId=excluded.toEntityId,
        type=excluded.type,
        weight=excluded.weight,
        confidence=excluded.confidence,
        status=excluded.status,
        source=excluded.source,
        evidence=excluded.evidence,
        updatedAt=excluded.updatedAt
    `,
      [
        validated.id,
        validated.fromEntityId,
        validated.toEntityId,
        validated.type,
        validated.weight,
        validated.confidence,
        validated.status,
        validated.source,
        JSON.stringify(validated.evidence),
        validated.createdAt,
        validated.updatedAt,
      ]
    );
  }

  public async getEntityById(id: string): Promise<Entity | null> {
    const db = await this.dbPromise;
    const row = await db.get('SELECT * FROM entities WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  public async getEntityByName(name: string): Promise<Entity | null> {
    const norm = normalizeTerm(name).normalized;
    const db = await this.dbPromise;
    const rows = await db.all('SELECT * FROM entities');
    for (const row of rows) {
      const e = this.mapRowToEntity(row);
      if (normalizeTerm(e.name).normalized === norm) return e;
      if (e.aliases.some((a) => normalizeTerm(a).normalized === norm)) return e;
    }
    return null;
  }

  public async getAllEntities(): Promise<Entity[]> {
    const db = await this.dbPromise;
    const rows = await db.all('SELECT * FROM entities');
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async getAllRelations(): Promise<Relation[]> {
    const db = await this.dbPromise;
    const rows = await db.all('SELECT * FROM relations');
    return rows.map((r) => this.mapRowToRelation(r));
  }

  public async getRelationsForEntity(entityId: string): Promise<Relation[]> {
    const db = await this.dbPromise;
    const rows = await db.all(
      `SELECT * FROM relations WHERE (fromEntityId = ? OR toEntityId = ?) AND status != 'rejected'`,
      [entityId, entityId]
    );
    return rows.map((r) => this.mapRowToRelation(r));
  }

  public async saveProposal(proposal: Proposal): Promise<void> {
    const db = await this.dbPromise;
    await db.run(
      `
      INSERT INTO proposals (id, data, status, proposedBy, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data=excluded.data,
        status=excluded.status
    `,
      [proposal.id, JSON.stringify(proposal), proposal.status, proposal.proposedBy, proposal.createdAt]
    );
  }

  public async getPendingProposals(): Promise<Proposal[]> {
    const db = await this.dbPromise;
    const rows = await db.all("SELECT data FROM proposals WHERE status = 'proposed'");
    return rows.map((r) => JSON.parse(r.data));
  }

  private mapRowToEntity(row: any): Entity {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      aliases: JSON.parse(row.aliases),
      description: row.description,
      tags: JSON.parse(row.tags),
      status: row.status,
      confidence: row.confidence,
      source: row.source,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapRowToRelation(row: any): Relation {
    return {
      id: row.id,
      fromEntityId: row.fromEntityId,
      toEntityId: row.toEntityId,
      type: row.type,
      weight: row.weight,
      confidence: row.confidence,
      status: row.status,
      source: row.source,
      evidence: JSON.parse(row.evidence),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public async close(): Promise<void> {
    const db = await this.dbPromise;
    await db.close();
  }
}

import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { JobSource, NormalizedJobPosting } from '../src/jobs/types.js';

export type ImportSummary = {
  received: number;
  inserted: number;
  updated: number;
  unchanged: number;
  snapshotsAdded: number;
};

function contentHash(posting: NormalizedJobPosting) {
  const { collectedAt: _collectedAt, ...content } = posting;
  void _collectedAt;
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export class JobStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS job_postings (
        source TEXT NOT NULL,
        external_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        company_key TEXT NOT NULL,
        published_at TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        closed_at TEXT,
        payload_json TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        PRIMARY KEY (source, external_id)
      );

      CREATE INDEX IF NOT EXISTS idx_job_postings_company
        ON job_postings (company_key, published_at);
      CREATE INDEX IF NOT EXISTS idx_job_postings_fingerprint
        ON job_postings (fingerprint);

      CREATE TABLE IF NOT EXISTS job_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        external_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        collected_date TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (source, external_id, collected_date, content_hash)
      );
    `);
  }

  import(postings: NormalizedJobPosting[]): ImportSummary {
    const findExisting = this.database.prepare(
      'SELECT content_hash FROM job_postings WHERE source = ? AND external_id = ?',
    );
    const insertPosting = this.database.prepare(`
      INSERT INTO job_postings (
        source, external_id, fingerprint, company_key, published_at,
        first_seen_at, last_seen_at, closed_at, payload_json, content_hash,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `);
    const updatePosting = this.database.prepare(`
      UPDATE job_postings SET
        fingerprint = ?, company_key = ?, published_at = ?, last_seen_at = ?,
        closed_at = ?, payload_json = ?, content_hash = ?, updated_at = ?, deleted_at = NULL
      WHERE source = ? AND external_id = ?
    `);
    const touchPosting = this.database.prepare(`
      UPDATE job_postings SET
        last_seen_at = ?, payload_json = ?, updated_at = ?
      WHERE source = ? AND external_id = ?
    `);
    const insertSnapshot = this.database.prepare(`
      INSERT OR IGNORE INTO job_snapshots (
        source, external_id, fingerprint, collected_date, collected_at,
        content_hash, payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const summary: ImportSummary = {
      received: postings.length,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      snapshotsAdded: 0,
    };

    this.database.exec('BEGIN IMMEDIATE');
    try {
      for (const posting of postings) {
        const payload = JSON.stringify(posting);
        const hash = contentHash(posting);
        const existing = findExisting.get(posting.source, posting.externalId) as
          { content_hash: string } | undefined;
        const closedAt = posting.active ? null : posting.collectedAt;

        if (!existing) {
          insertPosting.run(
            posting.source,
            posting.externalId,
            posting.fingerprint,
            posting.normalizedCompanyName,
            posting.publishedAt,
            posting.collectedAt,
            posting.collectedAt,
            closedAt,
            payload,
            hash,
            posting.collectedAt,
            posting.collectedAt,
          );
          summary.inserted += 1;
        } else if (existing.content_hash !== hash) {
          updatePosting.run(
            posting.fingerprint,
            posting.normalizedCompanyName,
            posting.publishedAt,
            posting.collectedAt,
            closedAt,
            payload,
            hash,
            posting.collectedAt,
            posting.source,
            posting.externalId,
          );
          summary.updated += 1;
        } else {
          touchPosting.run(
            posting.collectedAt,
            payload,
            posting.collectedAt,
            posting.source,
            posting.externalId,
          );
          summary.unchanged += 1;
        }

        const snapshotResult = insertSnapshot.run(
          posting.source,
          posting.externalId,
          posting.fingerprint,
          posting.collectedAt.slice(0, 10),
          posting.collectedAt,
          hash,
          payload,
          posting.collectedAt,
        );
        summary.snapshotsAdded += Number(snapshotResult.changes);
      }
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }

    return summary;
  }

  readPostings(source?: JobSource): NormalizedJobPosting[] {
    const rows = (
      source
        ? this.database
            .prepare(
              'SELECT payload_json FROM job_postings WHERE deleted_at IS NULL AND source = ?',
            )
            .all(source)
        : this.database
            .prepare('SELECT payload_json FROM job_postings WHERE deleted_at IS NULL')
            .all()
    ) as Array<{ payload_json: string }>;
    return rows.map((row) => JSON.parse(row.payload_json) as NormalizedJobPosting);
  }

  close() {
    this.database.close();
  }
}

/**
 * ping-vocabulary.test.ts
 *
 * 1. Vocabulary invariants: predicates, forbidden predicates, revocability,
 *    schemas, operations, visibility, and the PING_ONLY gap.
 * 2. SQL mirror test (fail-before): database/ping_objects.sql CHECK
 *    constraints must exactly mirror PROJECTOR_OPERATIONS and
 *    SOCIAL_PREDICATES. If the TypeScript vocabulary and the SQL schema
 *    drift, this test fails and forces reconciliation before any commit.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  SOCIAL_PREDICATES,
  FORBIDDEN_PREDICATES,
  SOCIAL_SCHEMAS,
  PROJECTOR_OPERATIONS,
  SUPPORTED_VISIBILITIES,
  VISIBILITY_GAP,
  JOURNAL_EVENT_TYPES,
  isSocialPredicate,
  isForbiddenPredicate,
  isRevocablePredicate,
  isSupportedVisibility,
  assertProjectorOperation,
} from './ping-vocabulary';

function extractCheckList(sql: string, column: string): string[] {
  const re = new RegExp(
    `CHECK\\s*\\(\\s*${column}\\s+IN\\s*\\(([^)]+)\\)`,
    'i'
  );
  const m = sql.match(re);
  if (!m) throw new Error(`no CHECK(${column} IN (...)) found in SQL`);
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^'|'$/g, ''))
    .sort();
}

describe('PingVocabulary invariants', () => {
  test('social predicates are exactly the five canonical ones', () => {
    expect([...SOCIAL_PREDICATES].sort()).toEqual([
      'approves',
      'denies',
      'follows',
      'likes',
      'replies_to',
    ]);
  });

  test('unfollows/unlikes are forbidden, never predicates', () => {
    expect([...FORBIDDEN_PREDICATES].sort()).toEqual(['unfollows', 'unlikes']);
    for (const p of FORBIDDEN_PREDICATES) {
      expect(isSocialPredicate(p)).toBe(false);
      expect(isForbiddenPredicate(p)).toBe(true);
    }
  });

  test('only follows and likes are revocable (status inactive, last-wins)', () => {
    expect(isRevocablePredicate('follows')).toBe(true);
    expect(isRevocablePredicate('likes')).toBe(true);
    expect(isRevocablePredicate('replies_to')).toBe(false);
    expect(isRevocablePredicate('approves')).toBe(false);
    expect(isRevocablePredicate('denies')).toBe(false);
  });

  test('schemas are the five canonical social schemas', () => {
    expect([...SOCIAL_SCHEMAS].sort()).toEqual([
      'ping.identity@1',
      'ping.social.circle@1',
      'ping.social.post@1',
      'ping.social.profile@1',
      'ping.social.proposal@1',
    ]);
  });

  test('projector operations are exactly create/update/relate', () => {
    expect([...PROJECTOR_OPERATIONS].sort()).toEqual(['create', 'relate', 'update']);
    expect(() => assertProjectorOperation('create')).not.toThrow();
    expect(() => assertProjectorOperation('update')).not.toThrow();
    expect(() => assertProjectorOperation('relate')).not.toThrow();
    expect(() => assertProjectorOperation('delete')).toThrow();
    expect(() => assertProjectorOperation('ping.create')).toThrow();
  });

  test('supported visibilities; PING_ONLY is an explicit gap', () => {
    expect([...SUPPORTED_VISIBILITIES].sort()).toEqual([
      'followers',
      'private',
      'public',
    ]);
    expect(VISIBILITY_GAP).toBe('PING_ONLY');
    expect(isSupportedVisibility(VISIBILITY_GAP)).toBe(false);
  });

  test('journal event types are the three registered names', () => {
    expect([...JOURNAL_EVENT_TYPES].sort()).toEqual([
      'OBJECT_CREATED',
      'OBJECT_UPDATED',
      'RELATIONSHIP_CREATED',
    ]);
  });
});

describe('SQL mirror (fail-before)', () => {
  const sqlPath = path.join(__dirname, '../../../database/ping_objects.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  test('ping_objects.operation CHECK mirrors PROJECTOR_OPERATIONS', () => {
    expect(extractCheckList(sql, 'operation')).toEqual([...PROJECTOR_OPERATIONS].sort());
  });

  test('ping_relationships.predicate CHECK mirrors SOCIAL_PREDICATES', () => {
    expect(extractCheckList(sql, 'predicate')).toEqual([...SOCIAL_PREDICATES].sort());
  });

  test('SQL never mentions forbidden predicates', () => {
    for (const p of FORBIDDEN_PREDICATES) {
      expect(sql.includes(`'${p}'`)).toBe(false);
    }
  });
});

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
  KNOWLEDGE_PREDICATES,
  CANONICAL_PREDICATES,
  FORBIDDEN_PREDICATES,
  SOCIAL_SCHEMAS,
  KNOWLEDGE_SCHEMAS,
  CANONICAL_SCHEMAS,
  PROJECTOR_OPERATIONS,
  SUPPORTED_VISIBILITIES,
  VISIBILITY_GAP,
  JOURNAL_EVENT_TYPES,
  isSocialPredicate,
  isKnowledgePredicate,
  isCanonicalPredicate,
  isForbiddenPredicate,
  isRevocablePredicate,
  isKnowledgeSchema,
  isCanonicalSchema,
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

describe('Knowledge vocabulary (Lane B, additive)', () => {
  test('knowledge predicates are exactly the seven canonical ones', () => {
    expect([...KNOWLEDGE_PREDICATES].sort()).toEqual([
      'employs',
      'external_identity',
      'has_website',
      'located_at',
      'member_of',
      'offers',
      'published',
    ]);
  });

  test('canonical predicates are social + knowledge, no overlap', () => {
    const social = new Set<string>([...SOCIAL_PREDICATES]);
    for (const p of KNOWLEDGE_PREDICATES) expect(social.has(p)).toBe(false);
    expect([...CANONICAL_PREDICATES].sort()).toEqual(
      [...SOCIAL_PREDICATES, ...KNOWLEDGE_PREDICATES].sort()
    );
    expect(CANONICAL_PREDICATES.length).toBe(
      SOCIAL_PREDICATES.length + KNOWLEDGE_PREDICATES.length
    );
  });

  test('knowledge predicates are recognized; social-only checks still hold', () => {
    for (const p of KNOWLEDGE_PREDICATES) {
      expect(isKnowledgePredicate(p)).toBe(true);
      expect(isCanonicalPredicate(p)).toBe(true);
      expect(isSocialPredicate(p)).toBe(false);
      expect(isForbiddenPredicate(p)).toBe(false);
    }
    for (const p of SOCIAL_PREDICATES) {
      expect(isCanonicalPredicate(p)).toBe(true);
      expect(isKnowledgePredicate(p)).toBe(false);
    }
  });

  test('no negative predicates exist anywhere (revocation is status inactive)', () => {
    // The canonical set contains no 'un-*' negative predicates; the only
    // 'un-*' strings in the vocabulary are the explicitly forbidden ones,
    // which are never canonical.
    for (const p of CANONICAL_PREDICATES) {
      expect(p.startsWith('un')).toBe(false);
    }
    for (const p of FORBIDDEN_PREDICATES) {
      expect(isCanonicalPredicate(p)).toBe(false);
      expect(isKnowledgePredicate(p)).toBe(false);
      expect(isSocialPredicate(p)).toBe(false);
    }
    expect(isCanonicalPredicate('unfollows')).toBe(false);
    expect(isCanonicalPredicate('unlikes')).toBe(false);
  });

  test('knowledge schemas are the seven canonical ones', () => {
    expect([...KNOWLEDGE_SCHEMAS].sort()).toEqual([
      'ping.knowledge.article@1',
      'ping.knowledge.business@1',
      'ping.knowledge.external_identity@1',
      'ping.knowledge.location@1',
      'ping.knowledge.person@1',
      'ping.knowledge.service@1',
      'ping.knowledge.website@1',
    ]);
  });

  test('canonical schemas are social + knowledge', () => {
    expect([...CANONICAL_SCHEMAS].sort()).toEqual(
      [...SOCIAL_SCHEMAS, ...KNOWLEDGE_SCHEMAS].sort()
    );
    for (const s of KNOWLEDGE_SCHEMAS) {
      expect(isKnowledgeSchema(s)).toBe(true);
      expect(isCanonicalSchema(s)).toBe(true);
    }
    for (const s of SOCIAL_SCHEMAS) {
      expect(isCanonicalSchema(s)).toBe(true);
      expect(isKnowledgeSchema(s)).toBe(false);
    }
    expect(isCanonicalSchema('ping.social.post@1')).toBe(true);
    expect(isCanonicalSchema('ping.unknown@1')).toBe(false);
  });

  test('social vocabulary is unchanged by the knowledge addition', () => {
    expect([...SOCIAL_PREDICATES].sort()).toEqual([
      'approves',
      'denies',
      'follows',
      'likes',
      'replies_to',
    ]);
    expect([...SOCIAL_SCHEMAS].sort()).toEqual([
      'ping.identity@1',
      'ping.social.circle@1',
      'ping.social.post@1',
      'ping.social.profile@1',
      'ping.social.proposal@1',
    ]);
  });
});

describe('SQL mirror (fail-before)', () => {
  const sqlPath = path.join(__dirname, '../../../database/ping_objects.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  test('ping_objects.operation CHECK mirrors PROJECTOR_OPERATIONS', () => {
    expect(extractCheckList(sql, 'operation')).toEqual([...PROJECTOR_OPERATIONS].sort());
  });

  test('ping_relationships.predicate CHECK mirrors CANONICAL_PREDICATES (social + knowledge)', () => {
    expect(extractCheckList(sql, 'predicate')).toEqual([...CANONICAL_PREDICATES].sort());
  });

  test('SQL never mentions forbidden predicates', () => {
    for (const p of FORBIDDEN_PREDICATES) {
      expect(sql.includes(`'${p}'`)).toBe(false);
    }
  });
});

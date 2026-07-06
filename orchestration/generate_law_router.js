const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const routingIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingIndex.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));
const hygieneReport = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', 'utf8').replace(/^\uFEFF/, ''));

const lawRouter = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  laws: {}
};

// Define constitutional laws with their keywords and descriptions
const lawDefinitions = {
  ReplayEquivalence: {
    keywords: ['replay', 'replay_log', 'replay_entry', 'deterministic', 'equivalence'],
    description: 'Replay operations must produce identical results across executions',
    severity: 'CRITICAL',
    category: 'Replay'
  },
  HashLaw: {
    keywords: ['hash', 'canonical', 'digest', 'checksum', 'sha256', 'crypto'],
    description: 'Hashing must use canonical authorities and be deterministic',
    severity: 'CRITICAL',
    category: 'Hash'
  },
  WitnessLaw: {
    keywords: ['witness', 'witness_chain', 'witness_proof', 'witness_graph'],
    description: 'Witness generation must be deterministic and verifiable',
    severity: 'CRITICAL',
    category: 'Witness'
  },
  OrderingLaw: {
    keywords: ['order', 'sequence', 'sort', 'ordering'],
    description: 'Ordering operations must be deterministic and platform-independent',
    severity: 'HIGH',
    category: 'Ordering'
  },
  FailureLaw: {
    keywords: ['error', 'failure', 'exception', 'throw'],
    description: 'Failure handling must be deterministic and replay-safe',
    severity: 'HIGH',
    category: 'Failure'
  },
  UnicodeLaw: {
    keywords: ['unicode', 'encoding', 'string'],
    description: 'String operations must handle Unicode consistently',
    severity: 'MEDIUM',
    category: 'Unicode'
  },
  MutationLaw: {
    keywords: ['immutable', 'mutation', 'mutate', 'readonly'],
    description: 'Immutable artifacts must not be mutated after creation',
    severity: 'CRITICAL',
    category: 'Mutation'
  },
  ClockLaw: {
    keywords: ['time', 'clock', 'timestamp', 'date', 'Date.now', 'new Date'],
    description: 'Clock dependencies must be eliminated for determinism',
    severity: 'CRITICAL',
    category: 'Clock'
  },
  SerializationLaw: {
    keywords: ['serialize', 'deserialize', 'canonical_bytes', 'json.stringify'],
    description: 'Serialization must be canonical and deterministic',
    severity: 'HIGH',
    category: 'Serialization'
  },
  IdentityLaw: {
    keywords: ['id', 'identity', 'uuid', 'identifier', 'crypto.randomuuid', 'Math.random'],
    description: 'Identity generation must be deterministic or explicitly non-deterministic',
    severity: 'CRITICAL',
    category: 'Identity'
  },
  KnowledgeLaw: {
    keywords: ['knowledge', 'index', 'search', 'compiler'],
    description: 'Knowledge compilation must be reproducible',
    severity: 'MEDIUM',
    category: 'Knowledge'
  }
};

// Build law router
Object.keys(lawDefinitions).forEach(lawName => {
  const definition = lawDefinitions[lawName];
  const matchingUUIDs = routingIndex.law.lawToUUIDs[lawName] || [];
  
  // Get detailed info for each UUID
  const implementations = matchingUUIDs.map(uuid => {
    const uuidEntry = uuidRegistry.uuids.find(u => u.uuid === uuid);
    return {
      uuid: uuid,
      path: uuidEntry.path,
      type: uuidEntry.type,
      size: uuidEntry.size,
      lifecycle: uuidEntry.lifecycle || 'UNKNOWN'
    };
  });
  
  // Map to authorities
  const authorities = [];
  Object.keys(authorityResolver.authorities).forEach(authorityName => {
    const authority = authorityResolver.authorities[authorityName];
    const lowerName = authorityName.toLowerCase();
    
    if (definition.keywords.some(keyword => lowerName.includes(keyword))) {
      authorities.push({
        name: authorityName,
        canonical: authority.canonical ? authority.canonical.uuid : null,
        implementations: authority.totalImplementations
      });
    }
  });
  
  // Map violations from hygiene report
  const violations = [];
  hygieneReport.findings.deterministicViolations.forEach(violation => {
    const uuid = uuidRegistry.pathToUUID[violation.path];
    if (uuid && matchingUUIDs.includes(uuid)) {
      violations.push({
        uuid: uuid,
        path: violation.path,
        violations: violation.violations
      });
    }
  });
  
  // Map tests (placeholder - would need test graph data)
  const tests = [];
  
  lawRouter.laws[lawName] = {
    name: lawName,
    description: definition.description,
    severity: definition.severity,
    category: definition.category,
    keywords: definition.keywords,
    implementations: implementations,
    authorities: authorities,
    tests: tests,
    violations: violations,
    totalImplementations: implementations.length,
    totalAuthorities: authorities.length,
    totalViolations: violations.length,
    evidenceChain: [
      { level: 'L1', source: 'Parser', finding: `Keywords matched: ${definition.keywords.join(', ')}` },
      { level: 'L3', source: 'Routing Index', finding: `${implementations.length} implementations identified` },
      { level: 'L4', source: 'Hygiene Report', finding: `${violations.length} violations detected` }
    ]
  };
});

// Generate summary
const summary = {
  totalLaws: Object.keys(lawRouter.laws).length,
  totalImplementations: Object.values(lawRouter.laws).reduce((sum, law) => sum + law.totalImplementations, 0),
  totalAuthorities: Object.values(lawRouter.laws).reduce((sum, law) => sum + law.totalAuthorities, 0),
  totalViolations: Object.values(lawRouter.laws).reduce((sum, law) => sum + law.totalViolations, 0),
  lawsWithViolations: Object.values(lawRouter.laws).filter(law => law.totalViolations > 0).length,
  criticalLaws: Object.values(lawRouter.laws).filter(law => law.severity === 'CRITICAL').length,
  highSeverityLaws: Object.values(lawRouter.laws).filter(law => law.severity === 'HIGH').length
};

lawRouter.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\LawRouter.json', JSON.stringify(lawRouter, null, 2));
console.log('Law Router generated successfully.');
console.log(JSON.stringify(summary, null, 2));

const fs = require('fs');
const path = require('path');

const filesystemIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_Filesystem.json', 'utf8').replace(/^\uFEFF/, ''));
const constitutionManifest = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', 'utf8').replace(/^\uFEFF/, ''));

// UUID prefix mapping based on artifact type
const prefixMap = {
  KERNEL: 'PING-KERNEL',
  AUTH: 'PING-AUTH',
  GATEWAY: 'PING-GATEWAY',
  REPLAY: 'PING-REPLAY',
  WITNESS: 'PING-WITNESS',
  COMMIT: 'PING-COMMIT',
  WORKER: 'PING-WORKER',
  SCHEDULER: 'PING-SCHED',
  CONS: 'PING-CONS',
  EVENT: 'PING-EVENT',
  ARTIFACT: 'PING-ARTF',
  CONTEXT: 'PING-CTX',
  MISSION: 'PING-MISS',
  KNOWLEDGE: 'PING-KNOW',
  INFRA: 'PING-INFRA',
  TEST: 'PING-TEST',
  BUILD: 'PING-BUILD',
  MIGRATION: 'PING-MIGR',
  UNKNOWN: 'PING-UNKN'
};

// Determine artifact type from path
function getArtifactType(relativePath) {
  const lowerPath = relativePath.toLowerCase();
  
  // Priority order for classification
  
  // Authority files
  if (lowerPath.includes('authority')) return 'AUTH';
  
  // Specific subsystems
  if (lowerPath.includes('scheduler')) return 'SCHEDULER';
  if (lowerPath.includes('consensus')) return 'CONS';
  if (lowerPath.includes('event_queue') || lowerPath.includes('event_fabric')) return 'EVENT';
  if (lowerPath.includes('artifact')) return 'ARTIFACT';
  if (lowerPath.includes('context')) return 'CONTEXT';
  if (lowerPath.includes('mission')) return 'MISSION';
  
  // Runtime subsystems
  if (lowerPath.includes('runtime/replay')) return 'REPLAY';
  if (lowerPath.includes('witness')) return 'WITNESS';
  if (lowerPath.includes('commit-service')) return 'COMMIT';
  if (lowerPath.includes('worker')) return 'WORKER';
  
  // Knowledge compiler
  if (lowerPath.includes('knowledge_compiler')) return 'KNOWLEDGE';
  
  // Gateway
  if (lowerPath.includes('gateway')) return 'GATEWAY';
  
  // Kernel/orchestration files (catch remaining execution files)
  if (lowerPath.includes('runtime/kernel') || lowerPath.includes('orchestration/execution') || lowerPath.includes('orchestration/')) {
    return 'KERNEL';
  }
  
  // Test files
  if (lowerPath.includes('test') || lowerPath.includes('spec')) return 'TEST';
  
  // Migration files
  if (lowerPath.includes('migrate')) return 'MIGRATION';
  
  // Infrastructure
  if (lowerPath.includes('docker') || lowerPath.includes('compose')) return 'INFRA';
  
  // Node modules and dependencies
  if (lowerPath.includes('node_modules') || lowerPath.includes('.cursor') || lowerPath.includes('.venv')) return 'UNKNOWN';
  
  return 'UNKNOWN';
}

// Generate sequential UUIDs for each type
const uuidRegistry = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  uuids: [],
  pathToUUID: {},
  uuidToPath: {},
  typeToUUIDs: {}
};

// Track counters for each type
const typeCounters = {};
Object.keys(prefixMap).forEach(type => {
  typeCounters[type] = 0;
  uuidRegistry.typeToUUIDs[type] = [];
});

// Assign UUIDs to all filesystem artifacts
filesystemIndex.forEach(file => {
  const type = getArtifactType(file.RelativePath);
  const counter = typeCounters[type];
  const uuid = `${prefixMap[type]}-${String(counter).padStart(6, '0')}`;
  
  typeCounters[type]++;
  
  const uuidEntry = {
    uuid: uuid,
    type: type,
    path: file.RelativePath,
    absolutePath: file.AbsolutePath,
    size: file.Size,
    checksum: file.Checksum,
    language: file.Language
  };
  
  uuidRegistry.uuids.push(uuidEntry);
  uuidRegistry.pathToUUID[file.RelativePath] = uuid;
  uuidRegistry.uuidToPath[uuid] = file.RelativePath;
  uuidRegistry.typeToUUIDs[type].push(uuid);
});

// Add manifest metadata to UUID entries
constitutionManifest.artifacts.forEach(artifact => {
  const uuid = uuidRegistry.pathToUUID[artifact.path];
  if (uuid) {
    const uuidEntry = uuidRegistry.uuids.find(u => u.uuid === uuid);
    if (uuidEntry) {
      uuidEntry.owner = artifact.owner;
      uuidEntry.subsystem = artifact.subsystem;
      uuidEntry.authorityType = artifact.authorityType;
      uuidEntry.lifecycle = artifact.lifecycle;
      uuidEntry.deletionRisk = artifact.deletionRisk;
    }
  }
});

// Generate summary statistics
const summary = {
  totalArtifacts: uuidRegistry.uuids.length,
  byType: {}
};

Object.keys(prefixMap).forEach(type => {
  summary.byType[type] = uuidRegistry.typeToUUIDs[type].length;
});

uuidRegistry.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', JSON.stringify(uuidRegistry, null, 2));
console.log('UUID Registry generated successfully.');
console.log(`Total artifacts: ${uuidRegistry.uuids.length}`);
console.log('UUID distribution:');
Object.keys(summary.byType).forEach(type => {
  if (summary.byType[type] > 0) {
    console.log(`  ${type}: ${summary.byType[type]} (${prefixMap[type]}-000000 to ${prefixMap[type]}-${String(summary.byType[type] - 1).padStart(6, '0')})`);
  }
});

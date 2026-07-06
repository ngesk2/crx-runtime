const fs = require('fs');
const path = require('path');

const filesystemIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_Filesystem.json', 'utf8').replace(/^\uFEFF/, ''));

const constitutionManifest = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  evidenceLevel: 'L4 - Constitutional Ownership Manifest',
  metadata: {
    description: 'Constitutional ownership manifest for repository artifacts. Unknown ownership is recorded as UNKNOWN rather than guessed.',
    instruction: 'This manifest requires human constitutional judgment to fill in UNKNOWN fields.'
  },
  artifacts: []
};

// Focus on kernel components (gateway/, runtime/, orchestration/)
const kernelFiles = filesystemIndex.filter(f => 
  f.RelativePath.startsWith('gateway\\') || 
  f.RelativePath.startsWith('runtime\\') || 
  f.RelativePath.startsWith('orchestration\\')
);

console.log(`Processing ${kernelFiles.length} kernel files...`);

kernelFiles.forEach(file => {
  const artifact = {
    path: file.RelativePath,
    absolutePath: file.AbsolutePath,
    language: file.Language,
    constitutionalOwner: 'UNKNOWN',
    subsystem: 'UNKNOWN',
    authorityType: 'UNKNOWN',
    canonicalReplacement: null,
    replayVisible: 'UNKNOWN',
    witnessVisible: 'UNKNOWN',
    startupCritical: 'UNKNOWN',
    buildCritical: 'UNKNOWN',
    documentationArtifact: file.Extension === '.md',
    generatedArtifact: file.RelativePath.includes('knowledge_report.json') || file.RelativePath.includes('RepositoryKnowledgeIndex'),
    deletionRisk: 'UNKNOWN',
    justification: 'UNKNOWN - Requires human constitutional judgment'
  };
  
  // Auto-detect documentation artifacts
  if (file.Extension === '.md') {
    artifact.documentationArtifact = true;
    artifact.deletionRisk = 'Keep';
    artifact.justification = 'Documentation artifact';
  }
  
  // Auto-detect generated artifacts
  if (file.RelativePath.includes('knowledge_report.json') || file.RelativePath.includes('RepositoryKnowledgeIndex')) {
    artifact.generatedArtifact = true;
    artifact.deletionRisk = 'Keep';
    artifact.justification = 'Generated artifact';
  }
  
  // Auto-detect empty directories (from filesystem index)
  if (file.Size === 0 && file.Extension === '') {
    artifact.deletionRisk = 'Safe';
    artifact.justification = 'Empty file';
  }
  
  constitutionManifest.artifacts.push(artifact);
});

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', JSON.stringify(constitutionManifest, null, 2));
console.log('Constitutional ownership manifest generated successfully.');
console.log(`Total artifacts: ${constitutionManifest.artifacts.length}`);
console.log('All ownership fields marked as UNKNOWN - requires human constitutional judgment.');

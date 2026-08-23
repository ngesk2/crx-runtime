const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const capabilityRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\CapabilityRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const symbolRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\SymbolRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));

const routingCache = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  capabilityToUUIDToPath: {},
  symbolToUUIDToPath: {},
  authorityToUUIDToPath: {},
  uuidToPath: {},
  uuidToType: {}
};

// Build UUID to path and type mappings (base lookups)
uuidRegistry.uuids.forEach(uuidEntry => {
  routingCache.uuidToPath[uuidEntry.uuid] = uuidEntry.path;
  routingCache.uuidToType[uuidEntry.uuid] = uuidEntry.type;
});

// Build capability → UUID → path cache
Object.keys(capabilityRegistry.capabilities).forEach(capabilityName => {
  const capability = capabilityRegistry.capabilities[capabilityName];
  routingCache.capabilityToUUIDToPath[capabilityName] = {};
  
  if (capability.canonical) {
    routingCache.capabilityToUUIDToPath[capabilityName][capability.canonical.uuid] = capability.canonical.path;
  }
  
  capability.supporting.forEach(supporting => {
    routingCache.capabilityToUUIDToPath[capabilityName][supporting.uuid] = supporting.path;
  });
  
  capability.deprecated.forEach(deprecated => {
    routingCache.capabilityToUUIDToPath[capabilityName][deprecated.uuid] = deprecated.path;
  });
  
  capability.experimental.forEach(experimental => {
    routingCache.capabilityToUUIDToPath[capabilityName][experimental.uuid] = experimental.path;
  });
});

// Build symbol → UUID → path cache
Object.keys(symbolRouter.symbolToUUID).forEach(symbol => {
  const uuids = symbolRouter.symbolToUUID[symbol];
  routingCache.symbolToUUIDToPath[symbol] = {};
  
  uuids.forEach(uuid => {
    const path = routingCache.uuidToPath[uuid];
    if (path) {
      routingCache.symbolToUUIDToPath[symbol][uuid] = path;
    }
  });
});

// Build authority → UUID → path cache
Object.keys(authorityResolver.authorities).forEach(authorityName => {
  const authority = authorityResolver.authorities[authorityName];
  routingCache.authorityToUUIDToPath[authorityName] = {};
  
  if (authority.canonical) {
    routingCache.authorityToUUIDToPath[authorityName][authority.canonical.uuid] = authority.canonical.path;
  }
  
  authority.supporting.forEach(supporting => {
    routingCache.authorityToUUIDToPath[authorityName][supporting.uuid] = supporting.path;
  });
  
  authority.deprecated.forEach(deprecated => {
    routingCache.authorityToUUIDToPath[authorityName][deprecated.uuid] = deprecated.path;
  });
  
  authority.experimental.forEach(experimental => {
    routingCache.authorityToUUIDToPath[authorityName][experimental.uuid] = experimental.path;
  });
  
  authority.unreachable.forEach(unreachable => {
    routingCache.authorityToUUIDToPath[authorityName][unreachable.uuid] = unreachable.path;
  });
});

// Generate summary
const summary = {
  totalCapabilities: Object.keys(routingCache.capabilityToUUIDToPath).length,
  totalSymbols: Object.keys(routingCache.symbolToUUIDToPath).length,
  totalAuthorities: Object.keys(routingCache.authorityToUUIDToPath).length,
  totalUUIDs: Object.keys(routingCache.uuidToPath).length,
  totalCapabilityMappings: Object.values(routingCache.capabilityToUUIDToPath).reduce((sum, map) => sum + Object.keys(map).length, 0),
  totalSymbolMappings: Object.values(routingCache.symbolToUUIDToPath).reduce((sum, map) => sum + Object.keys(map).length, 0),
  totalAuthorityMappings: Object.values(routingCache.authorityToUUIDToPath).reduce((sum, map) => sum + Object.keys(map).length, 0)
};

routingCache.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingCache.json', JSON.stringify(routingCache, null, 2));
console.log('Routing Cache generated successfully.');
console.log(JSON.stringify(summary, null, 2));

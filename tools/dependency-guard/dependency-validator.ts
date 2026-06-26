/**
 * DEPENDENCY VALIDATOR
 */

import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN_IMPORTS = ['express', 'pg', 'redis', 'axios', 'websocket', 'ws', 'fs', 'path', 'process'];

export function validateReplayDependencies(replayDir: string): string[] {
  const violations: string[] = [];
  
  function scanDirectory(dir: string): void {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        for (const forbidden of FORBIDDEN_IMPORTS) {
          const regex = new RegExp(`import.*from\\s*['"]${escapedRegex(forbidden)}`, 'g');
          if (regex.test(content)) {
            violations.push(`${fullPath}: imports ${forbidden}`);
          }
        }
        
        if (content.includes('process.env')) {
          violations.push(`${fullPath}: accesses process.env`);
        }
      }
    }
  }
  
  scanDirectory(replayDir);
  return violations;
}

function escapedRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

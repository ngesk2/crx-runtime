/**
 * REPLAY DEPENDENCY RULES
 * 
 * ESLint rules to enforce replay kernel purity.
 * 
 * Rules:
 * - replay/ MUST NOT import: express, pg, redis, axios, websocket, fs, process.env
 * - runtime adapters MAY import replay/
 * - replay/ MUST remain dependency-pure
 * - replay/ MUST NOT use dynamic imports
 * - replay/ MUST NOT use Date.now
 * - replay/ MUST NOT use Math.random
 * - replay/ MUST NOT use fetch
 */

module.exports = {
  rules: {
    'no-replay-forbidden-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Forbid forbidden imports in replay kernel',
          category: 'Best Practices',
          recommended: true
        },
        schema: []
      },
      create(context) {
        const forbiddenImports = [
          'express',
          'pg',
          'redis',
          'axios',
          'websocket',
          'ws',
          'fs',
          'path',
          'process.env',
          'process',
          'global',
          'http',
          'https',
          'net',
          'tls',
          'child_process',
          'cluster',
          'worker_threads',
          'os',
          'vm'
        ];

        return {
          ImportDeclaration(node) {
            // Check if file is in replay directory
            const filename = context.getFilename();
            if (!filename.includes('runtime/replay')) {
              return;
            }

            // Check for forbidden imports
            const importSource = node.source.value;
            
            for (const forbidden of forbiddenImports) {
              if (importSource === forbidden || importSource.startsWith(forbidden + '/')) {
                context.report({
                  node,
                  message: `Forbidden import in replay kernel: '${importSource}'. Replay kernel must remain dependency-pure.`
                });
              }
            }
          },
          MemberExpression(node) {
            // Check if file is in replay directory
            const filename = context.getFilename();
            if (!filename.includes('runtime/replay')) {
              return;
            }

            // Check for process.env access
            if (node.object.type === 'Identifier' && node.object.name === 'process') {
              if (node.property.type === 'Identifier' && node.property.name === 'env') {
                context.report({
                  node,
                  message: 'Forbidden process.env access in replay kernel. Replay kernel must not depend on environment variables.'
                });
              }
            }
          },
          CallExpression(node) {
            // Check if file is in replay directory
            const filename = context.getFilename();
            if (!filename.includes('runtime/replay')) {
              return;
            }

            // Check for Date.now
            if (node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj.type === 'Identifier' && obj.name === 'Date' &&
                  prop.type === 'Identifier' && prop.name === 'now') {
                context.report({
                  node,
                  message: 'Forbidden Date.now in replay kernel. Replay kernel must not depend on clocks.'
                });
              }
            }

            // Check for Math.random
            if (node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj.type === 'Identifier' && obj.name === 'Math' &&
                  prop.type === 'Identifier' && prop.name === 'random') {
                context.report({
                  node,
                  message: 'Forbidden Math.random in replay kernel. Replay kernel must not depend on randomness.'
                });
              }
            }

            // Check for fetch
            if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
              context.report({
                node,
                message: 'Forbidden fetch in replay kernel. Replay kernel must not depend on network IO.'
              });
            }
          },
          ImportExpression(node) {
            // Check if file is in replay directory
            const filename = context.getFilename();
            if (!filename.includes('runtime/replay')) {
              return;
            }

            // Check for dynamic imports
            context.report({
              node,
              message: 'Forbidden dynamic import in replay kernel. Dynamic imports bypass static analysis.'
            });
          }
        };
      }
    }
  }
};

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { verifyBuildTargets } from './scripts/verify-build-targets.mjs';

const verifyTargets = {
  name: 'verify-build-targets',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const html = readFileSync(
        fileURLToPath(new URL('index.html', dir)),
        'utf8',
      );
      const problems = verifyBuildTargets(html);
      if (problems.length > 0) throw new Error(problems.join('\n'));
    },
  },
};

export default defineConfig({
  output: 'static',
  integrations: [react(), verifyTargets],
});

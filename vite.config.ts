import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// Build stamp shown in the player menu, so "which version is live?" has an answer: "#47 · 5ab3c9d · Nov 4 15:55"
const sh = (c: string) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const sha = (process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || process.env.COMMIT_REF || sh('git rev-parse HEAD')).slice(0, 7) || 'dev';
const shallow = sh('git rev-parse --is-shallow-repository') === 'true';
const count = shallow ? '' : sh('git rev-list --count HEAD');
const BUILD = [count && `#${count}`, sha].filter(Boolean).join(' · ');
const BUILD_AT = new Date().toISOString();   // shown on the device in its own time zone, 24h

// The static pages (study guide, homework) read the same stamp from /build.js
const buildFile = (): Plugin => ({
  name: 'build-stamp',
  closeBundle() { mkdirSync('dist', { recursive: true }); writeFileSync('dist/build.js', `window.mathseyeBuild=${JSON.stringify(BUILD)};window.mathseyeBuildAt=${JSON.stringify(BUILD_AT)};\n`); },
});

// base './' so the build works under any path
export default defineConfig({ base: './', define: { __BUILD__: JSON.stringify(BUILD), __BUILD_AT__: JSON.stringify(BUILD_AT) }, plugins: [react(), buildFile()] });

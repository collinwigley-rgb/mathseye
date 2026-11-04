import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// Build stamp shown in the player menu, so "which version is live?" has an answer: "#47 · 5ab3c9d · Nov 4"
const sh = (c: string) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const sha = (process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || process.env.COMMIT_REF || sh('git rev-parse HEAD')).slice(0, 7) || 'dev';
const shallow = sh('git rev-parse --is-shallow-repository') === 'true';
const count = shallow ? '' : sh('git rev-list --count HEAD');
const day = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
const BUILD = [count && `#${count}`, sha, day].filter(Boolean).join(' · ');

// The static pages (study guide, homework) read the same stamp from /build.js
const buildFile = (): Plugin => ({
  name: 'build-stamp',
  closeBundle() { mkdirSync('dist', { recursive: true }); writeFileSync('dist/build.js', `window.mathseyeBuild=${JSON.stringify(BUILD)};\n`); },
});

// base './' so the build works under any path
export default defineConfig({ base: './', define: { __BUILD__: JSON.stringify(BUILD) }, plugins: [react(), buildFile()] });

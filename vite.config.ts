import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Porta própria do projeto (a 5173 padrão costuma estar ocupada por outros projetos).
  server: { port: 5180 },
  preview: { port: 5180 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    globals: true,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})

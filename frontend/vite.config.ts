import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './src/test/coverage',
      exclude: [
        'src/components/ui/**',
        'src/components/AppSidebar.tsx',
        'src/components/PageLayout.tsx',
        'src/components/EditStakeholderDialog.tsx',
        'src/components/forms/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/pages/DashboardPage.tsx',
        'src/pages/StakeholdersPage.tsx',
        'src/pages/CreateStakeholderPage.tsx',
        'src/test/**',
      ],
      thresholds: {
        statements: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
})

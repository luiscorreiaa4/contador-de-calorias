import { defineConfig, devices } from '@playwright/test';

// E2E (#22): só Chromium, em portas próprias (3101/5273) para não colidir com o dev. Sobe API (banco `_test`) e front; captcha desligado.
const api = {
  NODE_ENV: 'test',
  DB_NAME: 'contador_calorias_test',
  PORT: '3101',
  CORS_ORIGIN: 'http://localhost:5273',
  CAPTCHA_SECRET_KEY: '',
  SENTRY_DSN: '',
  MAIL_TRANSPORT: 'memory',
  APP_BASE_URL: 'http://localhost:5273',
  MAIL_FROM: 'CalorieSync <no-reply@caloriesync.local>',
  AUTH_TOKEN_PEPPER: 'super_secret_test_pepper_with_at_least_32_chars_456!',
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5273', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node --import tsx src/server.ts',
      cwd: '../backend',
      env: api,
      url: 'http://localhost:3101/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --port 5273 --strictPort',
      env: { VITE_CAPTCHA_SITE_KEY: '', VITE_API_URL: 'http://localhost:3101/api' },
      url: 'http://localhost:5273',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});

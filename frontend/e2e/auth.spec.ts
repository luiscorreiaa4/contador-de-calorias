import { test, expect, type Page } from '@playwright/test';

const EMAIL = 'tester-e2e-user@example.com';
const PASSWORD = 'senhaForte123';

async function login(page: Page, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /acessar diário/i }).click();
}

test('visitante anônimo é levado ao login', async ({ page }) => {
  await page.goto('/app/conta');
  await expect(page).toHaveURL(/\/login/);
});

test('senha errada mostra erro e não abre sessão', async ({ page }) => {
  await login(page, 'senhaErrada999');
  await expect(page.getByText(/e-mail ou senha incorretos/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('login abre o diário com cookie HttpOnly e mantém a sessão ao recarregar', async ({
  page,
  context,
}) => {
  await login(page);
  await expect(page).not.toHaveURL(/\/login/);

  const cookie = (await context.cookies()).find((c) => c.name === 'cs_session');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Strict');

  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
});

test('sair da conta volta ao login', async ({ page }) => {
  await login(page);
  await page.goto('/app/conta');
  await page.getByRole('button', { name: /sair da conta/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('rota inexistente mostra a página 404', async ({ page }) => {
  await page.goto('/rota-que-nao-existe');
  await expect(page.getByText('404', { exact: true })).toBeVisible();
});

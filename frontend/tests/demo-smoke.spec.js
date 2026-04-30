const { test, expect } = require('@playwright/test');

async function setDemoRole(page, roleKey) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((role) => {
    window.localStorage.setItem('demoModeOverride', 'true');
    window.localStorage.setItem('demoRoleOverride', role);
    window.localStorage.removeItem('demoTourDone:admin');
    window.localStorage.removeItem('demoTourDone:paciente');
    window.sessionStorage.removeItem('demoTourState');
  }, roleKey);

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/dashboard/);
}

async function completeTour(page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  const tooltip = page.locator('.react-joyride__tooltip').first();
  await expect(tooltip).toBeVisible({ timeout: 15000 });

  for (let i = 0; i < 14; i += 1) {
    const finalizar = tooltip.getByRole('button', { name: /finalizar/i });
    if (await finalizar.isVisible()) {
      await finalizar.click();
      return;
    }

    const siguiente = tooltip.getByRole('button', { name: /siguiente/i });
    if (await siguiente.isVisible()) {
      await siguiente.click();
      continue;
    }

    break;
  }
}

test('demo admin login and management navigation smoke', async ({ page }) => {
  await setDemoRole(page, 'admin');

  await expect(page.getByText('Sistema Clinico')).toBeVisible();
  await page.goto('/gestion/medicos', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/gestion\/medicos/);

  await page.goto('/gestion/pacientes', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/gestion\/pacientes/);
});

test('complete admin guided tour smoke', async ({ page }) => {
  await setDemoRole(page, 'admin');
  await completeTour(page);

  const isDone = await page.evaluate(() => window.localStorage.getItem('demoTourDone:admin'));
  expect(isDone).toBe('true');
});

test('complete patient guided tour smoke', async ({ page }) => {
  await setDemoRole(page, 'paciente');
  await completeTour(page);

  const isDone = await page.evaluate(() => window.localStorage.getItem('demoTourDone:paciente'));
  expect(isDone).toBe('true');
});

test('patient can navigate across core areas', async ({ page }) => {
  await setDemoRole(page, 'paciente');

  await page.goto('/turnos', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/turnos/);

  await page.goto('/teleconsultas', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/teleconsultas/);

  await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/perfil/);
});

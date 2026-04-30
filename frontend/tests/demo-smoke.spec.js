const { test, expect } = require('@playwright/test');

async function setDemoRole(page, roleKey) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((role) => {
    window.localStorage.setItem('demoModeOverride', 'true');
    window.localStorage.setItem('demoRoleOverride', role);
    window.localStorage.removeItem('demoTourDone:admin');
    window.localStorage.removeItem('demoTourDone:paciente');
    window.sessionStorage.removeItem('demoTourState');
    window.sessionStorage.removeItem('demoTourResetNonce');
  }, roleKey);

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/dashboard/);
}

async function completeTour(page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-tour="dashboard-overview"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('button', { name: /reiniciar tour/i }).click();

  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector('[role="alertdialog"]')
      || document.querySelector('.react-joyride__tooltip')
      || document.querySelector('[data-testid="button-beacon"]'),
    );
  }, { timeout: 15000 });

  const abrirTour = page.getByTestId('button-beacon');
  if (await abrirTour.isVisible()) {
    await abrirTour.click();
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

  const tourState = await page.evaluate(() => ({
    done: window.localStorage.getItem('demoTourDone:admin'),
    state: window.sessionStorage.getItem('demoTourState'),
  }));
  expect(Boolean(tourState.done === 'true' || tourState.state)).toBeTruthy();
});

test('complete patient guided tour smoke', async ({ page }) => {
  await setDemoRole(page, 'paciente');
  await completeTour(page);

  const tourState = await page.evaluate(() => ({
    done: window.localStorage.getItem('demoTourDone:paciente'),
    state: window.sessionStorage.getItem('demoTourState'),
  }));
  expect(Boolean(tourState.done === 'true' || tourState.state)).toBeTruthy();
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

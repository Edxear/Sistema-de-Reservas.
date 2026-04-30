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
  const closeBannerButton = page.getByRole('button', { name: /cerrar aviso/i });
  if (await closeBannerButton.isVisible()) {
    await closeBannerButton.click();
  }
  await page.locator('[data-tour="dashboard-overview"]').first().waitFor({ state: 'visible', timeout: 15000 });

  const hasActiveTour = await page.evaluate(() => Boolean(
    document.querySelector('[role="alertdialog"]')
    || document.querySelector('.react-joyride__tooltip')
    || document.querySelector('[data-testid="button-beacon"]'),
  ));

  if (!hasActiveTour) {
    await page.evaluate(() => {
      const controls = document.querySelector('button[aria-label="Controles de demo"]');
      if (controls) {
        controls.click();
      }
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const restart = Array.from(document.querySelectorAll('button')).find((button) => /reiniciar tour/i.test((button.textContent || '').trim()));
      if (restart) {
        restart.click();
      }
    });
  }

  await page.waitForFunction(() => Boolean(
    document.querySelector('[role="alertdialog"]')
    || document.querySelector('.react-joyride__tooltip')
    || document.querySelector('[data-testid="button-beacon"]'),
  ), { timeout: 15000 });

  await page.evaluate(() => {
    const beacon = document.querySelector('[data-testid="button-beacon"]');
    if (beacon) {
      beacon.click();
    }
  });
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

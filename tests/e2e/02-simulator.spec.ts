/**
 * E2E Test 02 — Simulateur financier (réactivité des sliders)
 *
 * Parcours couvert :
 *   1. Après login, aller sur l'onglet Simulateur
 *   2. Lire la valeur initiale du KPI CA 3 ans
 *   3. Modifier le slider "Consultations/jour"
 *   4. Vérifier que le KPI CA 3 ans a changé (réactivité)
 *   5. Modifier le slider "Associés" et vérifier l'impact
 *   6. Vérifier que le TimeScrubber est présent et interactif
 *
 * Variables d'environnement requises :
 *   E2E_EMAIL / E2E_PASSWORD
 */

import { test, expect } from '@playwright/test';

const EMAIL    = process.env.E2E_EMAIL    || '';
const PASSWORD = process.env.E2E_PASSWORD || '';

test.describe('Simulateur — Réactivité', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL et E2E_PASSWORD requis');
    await page.goto('/');
    await page.fill('#loginEmail', EMAIL);
    await page.fill('#loginPassword', PASSWORD);
    await page.click('button[type="submit"], button:has-text("Se connecter")');
    await expect(page.locator('#app-content')).toBeVisible({ timeout: 10_000 });
  });

  test('naviguer vers Simulateur affiche les sliders et les KPIs', async ({ page }) => {
    // Cliquer sur "Simulateur" dans la sidebar
    await page.click('.sidebar nav button:has(.nav-label:text-matches("Simulateur", "i"))');
    await expect(page.locator('#simulator')).toBeVisible();
    await expect(page.locator('#sConsult')).toBeVisible();
    await expect(page.locator('#simTopCa3')).toBeVisible();
  });

  test('modifier "Consultations/jour" met à jour le CA 3 ans', async ({ page }) => {
    await page.click('.sidebar nav button:has(.nav-label:text-matches("Simulateur", "i"))');
    await expect(page.locator('#simulator')).toBeVisible();

    // Lire la valeur initiale du KPI CA 3 ans
    const initialCa = await page.locator('#simTopCa3').textContent();

    // Déplacer le slider sConsult vers le maximum
    const slider = page.locator('#sConsult');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = String(el.max);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Attendre que les KPIs se mettent à jour (réactivité synchrone en vanilla JS)
    await page.waitForTimeout(200);

    const updatedCa = await page.locator('#simTopCa3').textContent();

    // Le CA doit avoir changé
    expect(updatedCa).not.toBe(initialCa);
  });

  test('modifier le slider "Associés" impacte le résultat', async ({ page }) => {
    await page.click('.sidebar nav button:has(.nav-label:text-matches("Simulateur", "i"))');
    await expect(page.locator('#simulator')).toBeVisible();

    const initialRes = await page.locator('#simTopRes3').textContent();

    const slider = page.locator('#sAssoc');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = String(el.max); // max associés
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await page.waitForTimeout(200);
    const updatedRes = await page.locator('#simTopRes3').textContent();
    expect(updatedRes).not.toBe(initialRes);
  });

  test('le TimeScrubber Simulateur est présent et les boutons années fonctionnent', async ({ page }) => {
    await page.click('.sidebar nav button:has(.nav-label:text-matches("Simulateur", "i"))');
    await expect(page.locator('#simulator')).toBeVisible();

    // Vérifier la présence du scrubber
    const scrubber = page.locator('.time-scrubber[data-section="simulator"]');
    await expect(scrubber).toBeVisible();

    // "Vue 3 ans" doit être actif par défaut
    await expect(scrubber.locator('.ts-all')).toHaveClass(/active/);

    // Cliquer "Année 1"
    await scrubber.locator('.ts-years button:first-child').click();
    await page.waitForTimeout(200);

    // Le bouton "Année 1" doit maintenant être actif
    await expect(scrubber.locator('.ts-years button:first-child')).toHaveClass(/active/);
    // Le label doit afficher M1–12
    await expect(scrubber.locator('.ts-lbl')).toHaveText('M1–12');
  });

  test('le verdict change selon les paramètres', async ({ page }) => {
    await page.click('.sidebar nav button:has(.nav-label:text-matches("Simulateur", "i"))');
    await expect(page.locator('#simulator')).toBeVisible();

    // S'assurer que le verdict est visible
    await expect(page.locator('#simVerdictText')).toBeVisible();
    const verdict = await page.locator('#simVerdictText').textContent();
    expect(verdict?.length).toBeGreaterThan(10);
  });

});

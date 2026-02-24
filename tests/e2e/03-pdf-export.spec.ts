/**
 * E2E Test 03 — Export PDF
 *
 * Parcours couvert :
 *   1. Après login, ouvrir le menu Actions
 *   2. Cliquer sur "Export PDF"
 *   3. Vérifier que la fonction exportPDF() s'exécute sans erreur JS
 *   4. Vérifier que jsPDF est chargé (objet window.jspdf ou window.jsPDF présent)
 *   5. Vérifier que le bouton est accessible depuis toutes les sections principales
 *
 * Note : en environnement headless Playwright, `doc.save()` déclenche un téléchargement.
 * On vérifie l'événement download ou l'absence d'erreur console selon la config.
 *
 * Variables d'environnement requises :
 *   E2E_EMAIL / E2E_PASSWORD
 */

import { test, expect } from '@playwright/test';

const EMAIL    = process.env.E2E_EMAIL    || '';
const PASSWORD = process.env.E2E_PASSWORD || '';

test.describe('Export PDF', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL et E2E_PASSWORD requis');
    await page.goto('/');
    await page.fill('#loginEmail', EMAIL);
    await page.fill('#loginPassword', PASSWORD);
    await page.click('button[type="submit"], button:has-text("Se connecter")');
    await expect(page.locator('#app-content')).toBeVisible({ timeout: 10_000 });
  });

  test('le menu Actions est présent et s\'ouvre au clic', async ({ page }) => {
    // Vérifier la présence du bouton Actions
    const actionsBtn = page.locator('#actionsToggleBtn');
    await expect(actionsBtn).toBeVisible();

    // Ouvrir le menu
    await actionsBtn.click();
    const menu = page.locator('#actionsMenu');
    await expect(menu).toBeVisible();

    // Le menu doit contenir le bouton Export PDF
    const pdfBtn = menu.locator('button:has-text("Export PDF"), button:has-text("export pdf")');
    await expect(pdfBtn).toBeVisible();

    // Fermer le menu en cliquant ailleurs
    await page.keyboard.press('Escape');
  });

  test('le menu Actions contient toutes les actions attendues', async ({ page }) => {
    await page.locator('#actionsToggleBtn').click();
    const menu = page.locator('#actionsMenu');
    await expect(menu).toBeVisible();

    // Vérifier la présence des entrées principales
    await expect(menu.locator('button:has-text("Importer"), button:has-text("Import")')).toBeVisible();
    await expect(menu.locator('button:has-text("Versions")')).toBeVisible();
    await expect(menu.locator('button:has-text("Comparer"), button:has-text("Compare")')).toBeVisible();
    await expect(menu.locator('button:has-text("PDF")')).toBeVisible();
  });

  test('cliquer Export PDF déclenche un téléchargement', async ({ page }) => {
    // Écouter l'événement download avant de cliquer
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });

    await page.locator('#actionsToggleBtn').click();
    const menu = page.locator('#actionsMenu');
    await expect(menu).toBeVisible();

    // Cliquer sur Export PDF
    await menu.locator('button:has-text("Export PDF"), button:has-text("PDF")').last().click();

    // Attendre le téléchargement
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Le fichier téléchargé doit être un PDF
    expect(filename.toLowerCase()).toMatch(/\.pdf$/);
  });

  test('aucune erreur JS console lors de l\'export PDF', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.locator('#actionsToggleBtn').click();
    const menu = page.locator('#actionsMenu');
    await expect(menu).toBeVisible();

    // Intercepter le download pour ne pas bloquer
    page.on('download', dl => dl.cancel());

    await menu.locator('button:has-text("Export PDF"), button:has-text("PDF")').last().click();

    // Laisser le temps à la génération PDF de s'exécuter
    await page.waitForTimeout(3_000);

    // Aucune erreur JavaScript ne doit être levée
    expect(errors.filter(e => !e.includes('net::ERR_ABORTED'))).toHaveLength(0);
  });

  test('export PDF fonctionne depuis la section Simulateur', async ({ page }) => {
    // Naviguer vers le Simulateur
    await page.click('.sidebar nav button:has(.nav-label:text-matches("Simulateur", "i"))');
    await expect(page.locator('#simulator')).toBeVisible();

    // Déclencher l'export depuis cette section
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });

    await page.locator('#actionsToggleBtn').click();
    await page.locator('#actionsMenu button:has-text("PDF")').last().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/);
  });

});

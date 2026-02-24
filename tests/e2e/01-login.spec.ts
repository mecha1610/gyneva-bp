/**
 * E2E Test 01 — Login (whitelist email + password auth)
 *
 * Parcours couvert :
 *   1. La page de login s'affiche correctement
 *   2. Un email hors liste blanche affiche une erreur
 *   3. Un mot de passe incorrect affiche une erreur
 *   4. Les credentials valides donnent accès à l'app
 *
 * Variables d'environnement requises :
 *   E2E_BASE_URL  — URL de l'app (défaut : https://gyneva-bp-https.vercel.app)
 *   E2E_EMAIL     — Email d'un compte de test valide
 *   E2E_PASSWORD  — Mot de passe de ce compte
 */

import { test, expect } from '@playwright/test';

const EMAIL    = process.env.E2E_EMAIL    || '';
const PASSWORD = process.env.E2E_PASSWORD || '';

test.describe('Login', () => {

  test('affiche la page de login au chargement', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#login-screen')).toBeVisible();
    await expect(page.locator('#app-content')).not.toBeVisible();
  });

  test('affiche une erreur pour des credentials invalides', async ({ page }) => {
    await page.goto('/');
    await page.fill('#loginEmail', 'inconnu@inconnu.ch');
    await page.fill('#loginPassword', 'mauvais-mdp');
    await page.click('button[type="submit"], button:has-text("Se connecter")');

    const errorEl = page.locator('#auth-error');
    await expect(errorEl).toBeVisible({ timeout: 8_000 });
    await expect(errorEl).not.toHaveText('');
  });

  test('connecte un utilisateur valide et affiche l\'app', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL et E2E_PASSWORD requis');

    await page.goto('/');
    await page.fill('#loginEmail', EMAIL);
    await page.fill('#loginPassword', PASSWORD);
    await page.click('button[type="submit"], button:has-text("Se connecter")');

    // L'app doit devenir visible, le login screen disparaître
    await expect(page.locator('#app-content')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#login-screen')).not.toBeVisible();

    // La sidebar avec les icônes SVG doit être présente
    await expect(page.locator('.sidebar nav button').first()).toBeVisible();

    // Le topbar doit afficher le titre de page
    await expect(page.locator('#pageTitle')).toBeVisible();
  });

  test('déconnecte et retourne au login', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL et E2E_PASSWORD requis');

    await page.goto('/');
    await page.fill('#loginEmail', EMAIL);
    await page.fill('#loginPassword', PASSWORD);
    await page.click('button[type="submit"], button:has-text("Se connecter")');
    await expect(page.locator('#app-content')).toBeVisible({ timeout: 10_000 });

    // Ouvre le menu Actions et clique Déconnexion (si présent) ou cherche le bouton logout
    const logoutBtn = page.locator('button:has-text("Déconnexion"), button:has-text("Logout")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Appel direct via console (fallback)
      await page.evaluate(() => (window as any).logout());
    }

    await expect(page.locator('#login-screen')).toBeVisible({ timeout: 8_000 });
  });

});

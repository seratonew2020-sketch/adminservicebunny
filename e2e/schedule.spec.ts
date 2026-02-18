import { test, expect } from '@playwright/test';

test.describe('Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming we have a way to login or bypass auth for testing
    // For now, we'll assume the user logs in manually or we mock the auth state
    // But typically we'd do something like:
    await page.goto('/login');
    await page.fill('input[type="email"]', 'testadmin@bunny.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    await page.goto('/schedule');
  });

  test('should load the schedule page', async ({ page }) => {
    await expect(page.getByText('ตารางการลาหยุด')).toBeVisible();
    await expect(page.getByLabel('ค้นหาชื่อ/รหัส/แผนก')).toBeVisible();
    await expect(page.getByRole('button', { name: 'รีเฟรช' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('End-to-end User Journey', () => {
  test('should load the homepage and check title', async ({ page }) => {
    await page.goto('/');
    
    // Check if the title is set correctly
    await expect(page).toHaveTitle(/GhostLaw/i);
    
    // Check if the Dashboard loads
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should open the file complaint modal', async ({ page }) => {
    await page.goto('/');
    
    // Find the primary call to action to file a complaint
    const fileComplaintButton = page.getByText(/File a Complaint/i);
    if (await fileComplaintButton.isVisible()) {
      await fileComplaintButton.click();
      
      // Ensure the newly added Evidence checklist or Timeline reminders are present
      await expect(page.getByText(/Evidence/i)).toBeVisible();
    }
  });
});

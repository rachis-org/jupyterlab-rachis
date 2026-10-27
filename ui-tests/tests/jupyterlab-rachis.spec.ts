import { expect, test } from '@jupyterlab/galata';

test('should display rachis-archive data file', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByText('Open from URL…').click();
  await page.getByRole('textbox', { name: 'URL' }).click();
  await page
    .getByRole('textbox', { name: 'URL' })
    .fill(
      'https://zenodo.org/api/records/13887457/files/sample-metadata.qzv/content?ext=.qzv'
    );
  await page.getByRole('button', { name: 'Open' }).click();

  const view = page.getByRole('main').locator('.mimerenderer-rachis-archive');

  await expect(view).toHaveScreenshot('rachis-archive-file.png', {
    timeout: 10000
  });
});

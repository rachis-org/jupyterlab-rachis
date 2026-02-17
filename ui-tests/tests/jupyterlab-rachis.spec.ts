import { expect, test } from '@jupyterlab/galata';

test('should display rachis-archive data file', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByText('Open from URL…').click();
  await page.getByRole('textbox', { name: 'URL' }).click();
  await page
    .getByRole('textbox', { name: 'URL' })
    .fill(
      'https://zenodo.org/api/records/13887457/files/sample-metadata.qzv/content'
    );
  await page.getByRole('button', { name: 'Open' }).click();

  await page.waitForTimeout(4000);

  const view = page.getByRole('main').locator('.mimerenderer-rachis-archive');

  expect(await view.screenshot()).toMatchSnapshot('rachis-archive-file.png');
});

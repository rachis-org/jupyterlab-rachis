import { expect, test } from '@jupyterlab/galata';

test('should display rachis-archive data file', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'File' }).click();
  await page.getByText('Open from URL…').click();
  await page.getByRole('textbox', { name: 'URL' }).click();
  await page
    .getByRole('textbox', { name: 'URL' })
    .fill(
      'https://raw.githubusercontent.com/qiime2/q2-fmt/master/demo/raincloud-baseline0.qzv'
    );
  await page.getByRole('button', { name: 'Open' }).click();

  await page.waitForTimeout(4000);

  const view = page.getByRole('main').locator('.mimerenderer-rachis-archive');

  expect(await view.screenshot()).toMatchSnapshot('rachis-archive-file.png');
});

import { expect, test } from '@playwright/test'

test.describe('App E2E smoke', () => {
  test('login and browse shipments', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('admin@thai-lao.com')
    await page.locator('#password').fill('Admin@123456')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.locator('main h1').first()).toHaveText('Overview')

    await page.goto('/dashboard/shipments')
    await expect(page.locator('main h1').first()).toHaveText('Shipments')

    const firstTracking = page.locator('span.font-mono.text-xs.font-semibold').first()
    await expect(firstTracking).toBeVisible()

    const trackingNo = (await firstTracking.textContent())?.trim()
    expect(trackingNo).toBeTruthy()

    await page.goto(`/track/${trackingNo}`)
    await expect(page.getByRole('heading', { name: 'Track shipment' })).toBeVisible()
    await expect(page.getByText(trackingNo ?? '', { exact: false })).toBeVisible()
  })

  test('shipments detail has printable label endpoint', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@thai-lao.com')
    await page.locator('#password').fill('Admin@123456')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.goto('/dashboard/shipments')
    await expect(page.locator('main h1').first()).toHaveText('Shipments')

    const firstShipmentLink = page
      .locator('a[href^="/dashboard/shipments/"]')
      .filter({ has: page.locator('span.font-mono.text-xs.font-semibold') })
      .first()
    await expect(firstShipmentLink).toBeVisible()
    await firstShipmentLink.click()
    await expect(page).toHaveURL(/\/dashboard\/shipments\/.+/)

    const printLink = page.getByRole('link', { name: /Print label|ພິມປ້າຍ/i }).first()
    await expect(printLink).toBeVisible()
    const href = await printLink.getAttribute('href')
    expect(href).toBeTruthy()

    await page.goto(href ?? '')
    await expect(page.locator('body')).toContainText(/Label|ປ້າຍ|Tracking|ເລກຕິດຕາມ/i)
  })
})

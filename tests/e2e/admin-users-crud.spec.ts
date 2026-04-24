import { expect, test, type Page } from '@playwright/test'

async function adminLogin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('admin@thai-lao.com')
  await page.locator('#password').fill('Admin@123456')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test.describe('Admin users CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    await page.goto('/dashboard/admin/users')
    await expect(page.locator('main h1').first()).toHaveText('Users')
  })

  test('admin can create, edit, and deactivate user', async ({ page }) => {
    const suffix = Date.now()
    const email = `e2e.admin.user.${suffix}@example.com`
    const updatedLastName = `Updated${suffix}`

    await page.getByTestId('admin-user-create-firstname').fill('E2E')
    await page.getByTestId('admin-user-create-lastname').fill('AdminUser')
    await page.getByTestId('admin-user-create-email').fill(email)
    await page.getByTestId('admin-user-create-password').fill('Pass@123456')
    await page.getByTestId('admin-user-create-role').selectOption('staff')
    await page.getByTestId('admin-user-create-status').selectOption('active')
    await page.getByTestId('admin-user-create-submit').click()

    const createdCard = page.locator('[data-testid^="admin-user-card-"]', { hasText: email }).first()
    await expect(createdCard).toBeVisible()

    await page.getByTestId('admin-user-search').fill(email)
    await expect(createdCard).toBeVisible()

    const cardId = await createdCard.getAttribute('data-testid')
    expect(cardId).toBeTruthy()
    const userId = (cardId ?? '').replace('admin-user-card-', '')

    await page.getByTestId(`admin-user-edit-${userId}`).click()
    await page.getByTestId(`admin-user-edit-lastname-${userId}`).fill(updatedLastName)
    await page.getByTestId(`admin-user-edit-role-${userId}`).selectOption('manager')
    await page.getByTestId(`admin-user-save-${userId}`).click()

    await expect(createdCard.getByText(updatedLastName)).toBeVisible()
    await expect(createdCard.getByText('Manager')).toBeVisible()

    page.once('dialog', async (dialog) => {
      await dialog.accept()
    })
    await page.getByTestId(`admin-user-delete-${userId}`).click()

    await expect(createdCard.getByText('Inactive')).toBeVisible()
  })

  test('search and filters work for role, status, and branch', async ({ page }) => {
    await page.getByTestId('admin-user-filter-role').selectOption('manager')
    await expect(page).toHaveURL(/role=manager/)
    await expect(page.getByText('manager.th@thai-lao.com')).toBeVisible()

    await page.getByTestId('admin-user-filter-role').selectOption('all')
    await page.getByTestId('admin-user-search').fill('staff.la@thai-lao.com')
    await expect(page).toHaveURL(/q=staff\.la%40thai-lao\.com/)
    await expect(page.getByText('staff.la@thai-lao.com')).toBeVisible()

    await page.getByTestId('admin-user-search').fill('')
    await page.getByTestId('admin-user-filter-status').selectOption('active')
    const branchFilter = page.getByTestId('admin-user-filter-branch')
    const branchValue = await branchFilter.evaluate((el) => {
      const options = Array.from((el as HTMLSelectElement).options)
      return options.map((option) => option.value).find((value) => value !== 'all') ?? 'all'
    })
    await branchFilter.selectOption(branchValue)

    if (branchValue !== 'all') {
      await expect(page).toHaveURL(new RegExp(`branch=${encodeURIComponent(branchValue)}`))
    }

    const shareUrl = page.url()
    expect(shareUrl).toContain('status=active')

    await page.goto(shareUrl)
    await expect(page).toHaveURL(/status=active/)

    await expect(page.locator('[data-testid^="admin-user-card-"]').first()).toBeVisible()
  })
})

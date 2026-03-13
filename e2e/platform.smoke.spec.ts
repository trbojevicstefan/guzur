import { expect, Page, test } from 'playwright/test'
import { FIXTURE_IDS, installApiMocks } from './mockApi'

const desktopOnly = () => test.info().project.name !== 'desktop'

const assertNoHorizontalOverflow = async (page: Page) => {
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
}

const waitForRouteReady = async (page: Page, route: string) => {
  if (route === '/') {
    await expect(page.locator('.home-search-panel')).toBeVisible()
    return
  }

  if (route.startsWith('/projects')) {
    await expect(page.locator('.projects-page')).toBeVisible()
    await expect(page.locator('.projects-grid')).toBeVisible()
    return
  }

  if (route.startsWith('/destinations')) {
    await expect(page.locator('.locations-intro')).toBeVisible()
    return
  }

  if (route.startsWith('/search')) {
    await expect(page.locator('.properties-page')).toBeVisible()
    await expect(page.locator('.property-list')).toBeVisible()
    return
  }

  if (route.startsWith('/property/')) {
    await expect(page.locator('.property-showcase')).toBeVisible()
  }
}

const selectMuiOption = async (page: Page, triggerSelector: string, optionLabel: string | RegExp) => {
  await page.locator(triggerSelector).click()
  if (typeof optionLabel === 'string') {
    await page.getByRole('option', { name: optionLabel, exact: true }).click()
    return
  }
  await page.getByRole('option', { name: optionLabel }).click()
}

test.beforeEach(async ({ page }) => {
  await installApiMocks(page)
})

test('home CTA routing, hero search URL state, and home map lock', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Welcome to Guzur')).toBeVisible()
  await expect(page.locator('.home-cover')).toBeVisible()

  await page.getByTestId('home-cta-explore').click()
  await expect(page).toHaveURL(/\/search$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)

  await page.getByTestId('home-cta-unit').click()
  await expect(page).toHaveURL(/\/search\?listingType=SALE/)

  await page.goBack()
  await page.getByTestId('home-cta-projects').click()
  await expect(page).toHaveURL(/\/projects/)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)

  await page.locator('form.home-search-form .keyword input').fill('Palm')
  await page.locator('form.home-search-form .price-min input').fill('300000')
  await page.locator('form.home-search-form .price-max input').fill('380000')
  await page.locator('form.home-search-form .bedrooms-min input').fill('3')
  await page.locator('form.home-search-form .area-min input').fill('150')
  await page.locator('form.home-search-form .area-max input').fill('190')
  await selectMuiOption(page, 'form.home-search-form .listing-type [role="combobox"]', 'Buy')
  await expect(page.locator('form.home-search-form .from')).toHaveCount(0)
  await expect(page.locator('form.home-search-form .to')).toHaveCount(0)
  await page.locator('form.home-search-form').getByRole('button', { name: /search/i }).click()

  await expect(page).toHaveURL(/q=Palm/)
  await expect(page).toHaveURL(/listingType=SALE/)
  await expect(page).toHaveURL(/priceMin=300000/)
  await expect(page).toHaveURL(/priceMax=380000/)
  await expect(page).toHaveURL(/bedroomsMin=3/)
  await expect(page).toHaveURL(/areaMin=150/)
  await expect(page).toHaveURL(/areaMax=190/)
  await expect(page.locator('.search-input input')).toHaveValue('Palm')
  await expect(page.locator('.property-list')).toContainText('Palm Residence 12')

  await page.reload()
  await expect(page).toHaveURL(/q=Palm/)
  await expect(page.locator('.search-input input')).toHaveValue('Palm')

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await page.goForward()
  await expect(page).toHaveURL(/q=Palm/)

  await page.goto('/')
  await page.locator('.home-map').scrollIntoViewIfNeeded()
  await expect(page.locator('.home-map .map-activation-mask')).toBeVisible()
  await page.locator('.home-map .map-activation-mask').click()
  await expect(page.locator('.home-map .map-activation-state')).toBeVisible()
})

test('home story section updates the preview from the selected card', async ({ page }) => {
  await page.goto('/')
  const section = page.locator('.home-different-section')
  await section.scrollIntoViewIfNeeded()
  await expect(page.locator('.home-different-preview-title')).toHaveText('Wide Range Of Properties')

  await page.locator('.home-different-step').nth(2).click()

  await expect(page.locator('.home-different-preview-title')).toHaveText('Excellent Prices')
  await expect(page.locator('.home-different-step.is-active h2')).toHaveText('Excellent Prices')
})

test('projects filters update in place and sticky filters stay below the header', async ({ page }) => {
  let loadEvents = 0
  page.on('load', () => {
    loadEvents += 1
  })

  await page.goto('/projects')
  await expect(page.locator('.projects-page')).toBeVisible()
  const initialLoadEvents = loadEvents

  await page.locator('.projects-search input').fill('Nile')
  await expect(page).toHaveURL(/q=Nile/)
  await expect(page.locator('.projects-grid .project-card h3')).toHaveCount(1)
  await expect(page.locator('.projects-grid')).toContainText('Nile Gate Residences')
  expect(loadEvents).toBe(initialLoadEvents)

  await page.locator('#projects-status-select').selectOption('IN_PROGRESS')
  await expect(page).toHaveURL(/status=IN_PROGRESS/)
  await expect(page.locator('.projects-grid .project-card h3')).toHaveCount(1)
  expect(loadEvents).toBe(initialLoadEvents)

  if (!desktopOnly()) {
    await page.mouse.wheel(0, 1200)
    const headerBox = await page.locator('.header.luxury-header').boundingBox()
    const stickyBox = await page.locator('.projects-filters').boundingBox()

    expect(headerBox).not.toBeNull()
    expect(stickyBox).not.toBeNull()
    expect(stickyBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1)
  }
})

test('search page keeps URL state and map access behavior in place', async ({ page }) => {
  await page.goto(`/search?location=${FIXTURE_IDS.cairo}&q=Palm`)
  await expect(page.locator('.search-input input')).toHaveValue('Palm')
  await expect(page.locator('.property-list')).toContainText('Palm Residence 12')

  if (test.info().project.name === 'mobile') {
    await page.getByRole('button', { name: /map view/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.map-dialog-content .map-shell')).toBeVisible()
    await dialog.locator('.close-btn').click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(new RegExp(`/search\\?location=${FIXTURE_IDS.cairo}.*q=Palm|/search\\?q=Palm.*location=${FIXTURE_IDS.cairo}`))
    await expect(page.locator('.search-input input')).toHaveValue('Palm')
    await expect(page.locator('.property-list')).toContainText('Palm Residence 12')
  } else {
    const mapShell = page.locator('div.properties div.col-1 .map-shell')
    const mapBox = await mapShell.boundingBox()

    expect(mapBox).not.toBeNull()
    await page.mouse.move(mapBox!.x + (mapBox!.width / 2), mapBox!.y + (mapBox!.height / 2))
    await page.mouse.move(Math.max(mapBox!.x - 20, 1), Math.max(mapBox!.y - 20, 1))

    const activationMask = mapShell.locator('.map-activation-mask')
    await expect(activationMask).toBeVisible()
    await activationMask.evaluate((node: HTMLElement) => {
      node.click()
    })
    await expect(mapShell.locator('.map-activation-state')).toBeVisible()
  }
})

test('destinations page keeps locked map behavior in place', async ({ page }) => {
  await page.goto('/destinations')
  await expect(page.locator('.locations .map-activation-mask')).toBeVisible()
  await page.locator('.locations .map-activation-mask').click()
  await expect(page.locator('.locations .map-activation-state')).toBeVisible()
})

test('property details open directly, gallery works, and rent and sale actions stay available', async ({ page }) => {
  await page.goto(`/property/${FIXTURE_IDS.property}`)
  await expect(page.locator('.property-showcase')).toBeVisible()
  await expect(page.locator('.property-hero-title h1')).toContainText('Palm Residence 12')
  await expect(page.locator('.property-booking-card')).toBeVisible()
  await expect(page.locator('.property-lead-card')).toBeVisible()
  await expect(page.locator('.property-map-card .map-activation-mask')).toBeVisible()
  await page.locator('.property-map-card .map-activation-mask').click()
  await expect(page.locator('.property-map-card .map-activation-state')).toBeVisible()

  await page.locator('.property-hero-gallery').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.locator('.image-viewer__close').click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('affected pages stay within the viewport at QA breakpoints and the search rail stays below the header', async ({ page }) => {
  test.skip(desktopOnly(), 'Viewport sweep runs once on the desktop project.')

  const routes = [
    '/',
    '/projects',
    '/destinations',
    `/search?location=${FIXTURE_IDS.cairo}&q=Palm`,
    `/property/${FIXTURE_IDS.property}`,
  ]
  const viewports = [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1024 },
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)

    for (const route of routes) {
      await page.goto(route)
      await waitForRouteReady(page, route)
      await assertNoHorizontalOverflow(page)
    }
  }

  await page.setViewportSize({ width: 1440, height: 1024 })
  await page.goto(`/search?location=${FIXTURE_IDS.cairo}&q=Palm`)
  await expect(page.locator('.properties-page')).toBeVisible()
  await page.mouse.wheel(0, 1000)

  const headerBox = await page.locator('.header.luxury-header').boundingBox()
  const railBox = await page.locator('div.properties div.col-1').boundingBox()

  expect(headerBox).not.toBeNull()
  expect(railBox).not.toBeNull()
  expect(railBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1)
})

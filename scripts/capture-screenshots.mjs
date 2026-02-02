import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3004';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3003';
const API_URL = process.env.API_URL || 'http://localhost:4004';
const OUTPUT_ROOT = process.env.OUTPUT_DIR || path.join(process.cwd(), 'screenshots');
const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS || 30000);
const EXTRA_WAIT_MS = Number(process.env.EXTRA_WAIT_MS || 2000);
const VIEWPORT = { width: 1440, height: 900 };

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .replace('Z', '');

const outputDir = path.join(OUTPUT_ROOT, `run-${timestamp}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const safeName = (name) => name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-+/g, '-');

const log = (message) => {
  console.log(message);
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const waitForServer = async (url, timeoutMs = 120000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.status < 500) {
        return true;
      }
    } catch {
      // ignore
    }
    await sleep(2000);
  }
  throw new Error(`Server not reachable: ${url}`);
};

const waitForSettled = async (page) => {
  await page.waitForLoadState('domcontentloaded', { timeout: NAV_TIMEOUT_MS }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT_MS }).catch(() => undefined);
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: NAV_TIMEOUT_MS })
    .catch(() => undefined);
  await page.evaluate(async () => {
    if (document?.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // ignore font load issues
      }
    }
  }).catch(() => undefined);
  await sleep(EXTRA_WAIT_MS);
};

const goto = async (page, url) => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await waitForSettled(page);
};

const shot = async (page, name) => {
  const filename = `${safeName(name)}.png`;
  const filepath = path.join(outputDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
};

const clickIfExists = async (locator, waitForUrl) => {
  const count = await locator.count();
  if (count === 0) {
    return false;
  }
  const first = locator.first();
  if (waitForUrl) {
    await Promise.all([
      first.click(),
      first.page().waitForURL(waitForUrl, { timeout: 15000 }).catch(() => undefined),
    ]);
  } else {
    await first.click();
  }
  return true;
};

const fillField = async (page, selectors, value) => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count() > 0) {
      await locator.fill(value);
      return true;
    }
  }
  return false;
};

const loginFrontend = async (page, email, password) => {
  await goto(page, `${FRONTEND_URL}/sign-in`);
  const emailFilled = await fillField(page, [
    'input[type="email"]',
    'input[name="email"]',
    'input[autocomplete="email"]',
    'input[placeholder*="Email" i]',
    'input[placeholder*="email" i]',
    'label:has-text("Email") >> input',
  ], email);

  const passwordFilled = await fillField(page, [
    'input[type="password"]',
    'input[name="password"]',
    'input[autocomplete="current-password"]',
    'input[placeholder*="Password" i]',
    'label:has-text("Password") >> input',
  ], password);

  if (!emailFilled || !passwordFilled) {
    await page.screenshot({ path: path.join(outputDir, 'login-frontend-missing-fields.png'), fullPage: true });
    throw new Error('Frontend login fields not found.');
  }
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();
  await Promise.all([
    signInButton.click(),
    page.waitForFunction(() => !!localStorage.getItem('mi-fe-user'), null, { timeout: 15000 }).catch(() => undefined),
  ]);
  await waitForSettled(page);
};

const loginAdmin = async (page, email, password) => {
  await goto(page, `${ADMIN_URL}/sign-in`);
  const emailFilled = await fillField(page, [
    'input[type="email"]',
    'input[name="email"]',
    'input[autocomplete="email"]',
    'input[placeholder*="Email" i]',
    'input[placeholder*="email" i]',
    'label:has-text("Email") >> input',
  ], email);

  const passwordFilled = await fillField(page, [
    'input[type="password"]',
    'input[name="password"]',
    'input[autocomplete="current-password"]',
    'input[placeholder*="Password" i]',
    'label:has-text("Password") >> input',
  ], password);

  if (!emailFilled || !passwordFilled) {
    await page.screenshot({ path: path.join(outputDir, 'login-admin-missing-fields.png'), fullPage: true });
    throw new Error('Admin login fields not found.');
  }
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();
  await Promise.all([
    signInButton.click(),
    page.waitForFunction(() => !!localStorage.getItem('mi-be-user'), null, { timeout: 15000 }).catch(() => undefined),
  ]);
  await waitForSettled(page);
};

const captureRoutes = async (page, baseUrl, routes, prefix) => {
  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    log(`Capturing ${prefix}: ${route.path}`);
    await goto(page, url);
    await shot(page, `${prefix}-${route.name}`);
  }
};

const captureFrontendDynamics = async (page) => {
  log('Capturing frontend dynamic pages');
  await goto(page, `${FRONTEND_URL}/search`);

  const viewButton = page.locator('.property .btn-view').first();
  if (await viewButton.count() === 0) {
    log('No properties found on search page. Skipping property/developer/project detail screenshots.');
    return;
  }

  await Promise.all([
    viewButton.click(),
    page.waitForURL('**/property/**', { timeout: 15000 }).catch(() => undefined),
  ]);
  await waitForSettled(page);

  const propertyUrl = page.url();
  await shot(page, 'frontend-property-detail');

  const sellerButton = page.locator('button.seller-action');
  if (await sellerButton.count() > 0) {
    await Promise.all([
      sellerButton.first().click(),
      page.waitForURL('**/brokers/**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'frontend-seller-detail');
    await goto(page, propertyUrl);
  }

  const projectButton = page.locator('button.property-link', { hasText: /project/i });
  if (await projectButton.count() > 0) {
    await Promise.all([
      projectButton.first().click(),
      page.waitForURL('**/projects/**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'frontend-project-detail');
    await goto(page, propertyUrl);
  }

  const developerButton = page.locator('button.property-link', { hasText: /developer/i });
  if (await developerButton.count() > 0) {
    await Promise.all([
      developerButton.first().click(),
      page.waitForURL('**/developers/**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'frontend-developer-detail');
    await goto(page, propertyUrl);
  }
};

const captureFrontendOrgDetails = async (page) => {
  log('Capturing frontend organization detail pages');

  await goto(page, `${FRONTEND_URL}/brokers`);
  const brokerCard = page.locator('.organization-card').first();
  if (await brokerCard.count() > 0) {
    await Promise.all([
      brokerCard.click(),
      page.waitForURL('**/brokers/**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'frontend-brokerage-detail');
  }

  await goto(page, `${FRONTEND_URL}/developers`);
  const developerCard = page.locator('.organization-card').first();
  if (await developerCard.count() > 0) {
    await Promise.all([
      developerCard.click(),
      page.waitForURL('**/developers/org/**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'frontend-developer-org-detail');
  }

  await goto(page, `${FRONTEND_URL}/projects`);
  const projectRow = page.locator('.development-list-row').first();
  if (await projectRow.count() > 0) {
    await Promise.all([
      projectRow.click(),
      page.waitForURL('**/projects/**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'frontend-project-detail-from-list');
  }
};

const captureFrontendRoleScreens = async (roleName, email, password, routes, captureListingDetail = false) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: 'reduce' });
  const page = await context.newPage();

  log(`Logging in frontend as ${roleName}`);
  await loginFrontend(page, email, password);

  await captureRoutes(page, FRONTEND_URL, routes, `frontend-${roleName}`);

  if (captureListingDetail) {
    log(`Capturing ${roleName} listing detail`);
    await goto(page, `${FRONTEND_URL}/dashboard/listings`);
    const updateButton = page.locator('button[aria-label="Update"]').first();
    if (await updateButton.count() > 0) {
      await Promise.all([
        updateButton.click(),
        page.waitForURL('**/dashboard/listings/**', { timeout: 15000 }).catch(() => undefined),
      ]);
      await waitForSettled(page);
      await shot(page, `frontend-${roleName}-listing-detail`);
    } else {
      log(`No listings found for ${roleName}. Skipping listing detail.`);
    }
  }

  await browser.close();
};

const captureAdminDynamics = async (page) => {
  log('Capturing admin dynamic pages');

  // Agencies / brokers
  await goto(page, `${ADMIN_URL}/agencies`);
  const viewAgencyButton = page.getByRole('button', { name: /view/i }).first();
  if (await viewAgencyButton.count() > 0) {
    await Promise.all([
      viewAgencyButton.click(),
      page.waitForURL('**/broker?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    const brokerUrl = page.url();
    await shot(page, 'admin-broker-view');

    const brokerId = new URL(brokerUrl).searchParams.get('c');
    if (brokerId) {
      await goto(page, `${ADMIN_URL}/agency?c=${brokerId}`);
      await shot(page, 'admin-agency-view');
      await goto(page, `${ADMIN_URL}/update-agency?c=${brokerId}`);
      await shot(page, 'admin-agency-update');
      await goto(page, `${ADMIN_URL}/update-broker?c=${brokerId}`);
      await shot(page, 'admin-broker-update');
    }
  }

  // Properties
  await goto(page, `${ADMIN_URL}/properties`);
  const propertyViewButton = page.locator('.property-list article .action button').first();
  if (await propertyViewButton.count() > 0) {
    await Promise.all([
      propertyViewButton.click(),
      page.waitForURL('**/property?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    const propertyUrl = page.url();
    await shot(page, 'admin-property-view');

    const propertyId = new URL(propertyUrl).searchParams.get('p');
    if (propertyId) {
      await goto(page, `${ADMIN_URL}/property-bookings?p=${propertyId}`);
      await shot(page, 'admin-property-bookings');
      await goto(page, `${ADMIN_URL}/update-property?p=${propertyId}`);
      await shot(page, 'admin-property-update');
    }
  }

  // Developments
  await goto(page, `${ADMIN_URL}/developments`);
  const devView = page.locator('.btn-view').first();
  if (await devView.count() > 0) {
    await Promise.all([
      devView.click(),
      page.waitForURL('**/development', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'admin-development-view');
  }
  const devEdit = page.locator('.btn-edit').first();
  if (await devEdit.count() > 0) {
    await Promise.all([
      devEdit.click(),
      page.waitForURL('**/update-development', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'admin-development-update');
  }

  // Organizations
  await goto(page, `${ADMIN_URL}/organizations`);
  const orgButton = page.locator('.organization-action-btn').first();
  if (await orgButton.count() > 0) {
    await Promise.all([
      orgButton.click(),
      page.waitForURL('**/organization?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'admin-organization-view');
  }

  // Users
  await goto(page, `${ADMIN_URL}/users`);
  const userLink = page.locator('a.us-user').first();
  if (await userLink.count() > 0) {
    await Promise.all([
      userLink.click(),
      page.waitForURL('**/user?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    const userUrl = page.url();
    await shot(page, 'admin-user-view');
    const userId = new URL(userUrl).searchParams.get('u');
    if (userId) {
      await goto(page, `${ADMIN_URL}/update-user?u=${userId}`);
      await shot(page, 'admin-user-update');
    }
  }

  // Locations
  await goto(page, `${ADMIN_URL}/locations`);
  const locEditButton = page.locator('.location-list-item button').first();
  if (await locEditButton.count() > 0) {
    await Promise.all([
      locEditButton.click(),
      page.waitForURL('**/update-location?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    const locUrl = page.url();
    await shot(page, 'admin-location-update');
    const locId = new URL(locUrl).searchParams.get('loc');
    if (locId) {
      await goto(page, `${ADMIN_URL}/update-location?loc=${locId}`);
    }
  }

  // Countries
  await goto(page, `${ADMIN_URL}/countries`);
  const countryEditButton = page.locator('.country-list-item button').first();
  if (await countryEditButton.count() > 0) {
    await Promise.all([
      countryEditButton.click(),
      page.waitForURL('**/update-country?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'admin-country-update');
  }

  // Bookings
  await goto(page, `${ADMIN_URL}/bookings`);
  const bookingEditIcon = page.locator('button:has(svg[data-testid="EditIcon"])').first();
  if (await bookingEditIcon.count() > 0) {
    await Promise.all([
      bookingEditIcon.click(),
      page.waitForURL('**/update-booking?**', { timeout: 15000 }).catch(() => undefined),
    ]);
    await waitForSettled(page);
    await shot(page, 'admin-booking-update');
  }
};

const main = async () => {
  ensureDir(outputDir);

  log('Waiting for frontend/admin servers...');
  await Promise.all([
    waitForServer(FRONTEND_URL),
    waitForServer(ADMIN_URL),
    waitForServer(`${API_URL}/api/health`).catch(() => undefined),
  ]);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: 'reduce' });
  const page = await context.newPage();

  const frontendPublicRoutes = [
    { name: 'home', path: '/' },
    { name: 'search', path: '/search' },
    { name: 'brokers', path: '/brokers' },
    { name: 'developers', path: '/developers' },
    { name: 'projects', path: '/projects' },
    { name: 'projects-browse', path: '/projects/browse' },
    { name: 'destinations', path: '/destinations' },
    { name: 'about', path: '/about' },
    { name: 'contact', path: '/contact' },
    { name: 'tos', path: '/tos' },
    { name: 'privacy', path: '/privacy' },
    { name: 'cookie-policy', path: '/cookie-policy' },
    { name: 'rfq', path: '/rfq' },
    { name: 'sign-in', path: '/sign-in' },
    { name: 'sign-up', path: '/sign-up' },
    { name: 'sign-up-role', path: '/sign-up/role' },
    { name: 'sign-up-role-broker', path: '/sign-up/role/broker' },
    { name: 'sign-up-role-developer', path: '/sign-up/role/developer' },
    { name: 'sign-up-role-owner', path: '/sign-up/role/owner' },
    { name: 'forgot-password', path: '/forgot-password' },
    { name: 'reset-password', path: '/reset-password' },
    { name: 'activate', path: '/activate' },
    { name: 'property-search', path: '/property' },
    { name: 'checkout', path: '/checkout' },
    { name: 'checkout-session', path: '/checkout-session/placeholder' },
    { name: 'agencies', path: '/agencies' },
    { name: 'no-match', path: '/__no-match__' },
  ];

  await captureRoutes(page, FRONTEND_URL, frontendPublicRoutes, 'frontend');
  await captureFrontendDynamics(page);
  await captureFrontendOrgDetails(page);

  await browser.close();

  const brokerRoutes = [
    { name: 'dashboard', path: '/dashboard/broker' },
    { name: 'listings', path: '/dashboard/listings' },
    { name: 'listings-new', path: '/dashboard/listings/new' },
    { name: 'organization', path: '/dashboard/organization' },
    { name: 'settings', path: '/settings' },
    { name: 'notifications', path: '/notifications' },
    { name: 'messages', path: '/messages' },
    { name: 'change-password', path: '/change-password' },
  ];

  const developerRoutes = [
    { name: 'dashboard', path: '/dashboard/developer' },
    { name: 'listings', path: '/dashboard/listings' },
    { name: 'listings-new', path: '/dashboard/listings/new' },
    { name: 'developments-new', path: '/dashboard/developments/new' },
    { name: 'organization', path: '/dashboard/organization' },
    { name: 'settings', path: '/settings' },
    { name: 'notifications', path: '/notifications' },
    { name: 'messages', path: '/messages' },
    { name: 'change-password', path: '/change-password' },
  ];

  const ownerRoutes = [
    { name: 'dashboard', path: '/dashboard/owner' },
    { name: 'listings', path: '/dashboard/listings' },
    { name: 'listings-new', path: '/dashboard/listings/new' },
    { name: 'organization', path: '/dashboard/organization' },
    { name: 'settings', path: '/settings' },
    { name: 'notifications', path: '/notifications' },
    { name: 'messages', path: '/messages' },
    { name: 'change-password', path: '/change-password' },
  ];

  await captureFrontendRoleScreens(
    'broker',
    'broker.test@guzur.com',
    'Test1234!',
    brokerRoutes,
    true,
  );

  await captureFrontendRoleScreens(
    'developer',
    'developer.test@guzur.com',
    'Test1234!',
    developerRoutes,
    true,
  );

  await captureFrontendRoleScreens(
    'owner',
    'owner.test@guzur.com',
    'Test1234!',
    ownerRoutes,
    true,
  );

  const adminBrowser = await chromium.launch({ headless: true });
  const adminContext = await adminBrowser.newContext({ viewport: VIEWPORT, reducedMotion: 'reduce' });
  const adminPage = await adminContext.newPage();

  await loginAdmin(adminPage, 'admin.test@guzur.com', 'Test1234!');

  const adminRoutes = [
    { name: 'dashboard', path: '/' },
    { name: 'bookings', path: '/bookings' },
    { name: 'agencies', path: '/agencies' },
    { name: 'brokers', path: '/brokers' },
    { name: 'locations', path: '/locations' },
    { name: 'properties', path: '/properties' },
    { name: 'developments', path: '/developments' },
    { name: 'organizations', path: '/organizations' },
    { name: 'developers', path: '/developers' },
    { name: 'owners', path: '/owners' },
    { name: 'leads', path: '/leads' },
    { name: 'rfqs', path: '/rfqs' },
    { name: 'users', path: '/users' },
    { name: 'settings', path: '/settings' },
    { name: 'notifications', path: '/notifications' },
    { name: 'change-password', path: '/change-password' },
    { name: 'about', path: '/about' },
    { name: 'tos', path: '/tos' },
    { name: 'contact', path: '/contact' },
    { name: 'countries', path: '/countries' },
    { name: 'scheduler', path: '/scheduler' },
    { name: 'create-agency', path: '/create-agency' },
    { name: 'create-broker', path: '/create-broker' },
    { name: 'create-location', path: '/create-location' },
    { name: 'create-property', path: '/create-property' },
    { name: 'create-development', path: '/create-development' },
    { name: 'create-booking', path: '/create-booking' },
    { name: 'create-user', path: '/create-user' },
    { name: 'create-country', path: '/create-country' },
    { name: 'no-match', path: '/__no-match__' },
  ];

  await captureRoutes(adminPage, ADMIN_URL, adminRoutes, 'admin');
  await captureAdminDynamics(adminPage);

  await adminBrowser.close();

  log(`Screenshots saved to ${outputDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});




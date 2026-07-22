import { test, expect, Page } from '@playwright/test';

const GOOGLE_SCRIPT_ROUTE = '**/script.google.com/macros/s/**';
const EMAIL_SERVICE_ROUTE = 'http://127.0.0.1:5001/api/**';

const SERVICE_FIXTURES = [
	{ id: 'SVC-001', title: 'FDM 3D Printing', desc: 'Print prototypes and models.', icon: 'Printer', order: 1 },
	{ id: 'SVC-002', title: 'Design Service', desc: 'Create a printable 3D design.', icon: 'Pencil', order: 2 },
	{ id: 'SVC-003', title: 'Custom Keychains', desc: 'Create personalized keychains.', icon: 'KeyRound', order: 3 },
	{ id: 'SVC-004', title: 'NFC Keychains', desc: 'Create programmable NFC keychains.', icon: 'Wifi', order: 4 },
];

const TESTIMONIAL_FIXTURES = [
	{
		id: 'TST-001',
		name: 'Nico Alvarez',
		program: 'BSCS-ST',
		text: 'FabLab made my thesis prototype a reality.',
		stars: 5,
		status: 'Approved',
		submittedAt: '2026-07-01T00:00:00.000Z',
		shownCount: 0,
	},
];

const WORKSHOP_FIXTURES = [
	{
		id: 'WKS-001',
		title: 'Introduction to 3D Printing',
		date: 'Aug 15',
		tag: 'Free • Beginner',
		image: 'https://example.com/workshop.jpg',
		link: 'https://example.com/register',
		order: 1,
	},
];

function dateDaysFromNow(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

async function goToClientPortal(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: /Client Portal/i }).click();
	await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
}

async function goBackToClientPortalAfterReload(page: Page) {
	await page.waitForLoadState('domcontentloaded').catch(() => {});
	const clientPortalButton = page.getByRole('button', { name: /Client Portal/i });

	if (await clientPortalButton.isVisible().catch(() => false)) {
		await clientPortalButton.click();
	}

	await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
}

async function makeCapacityAvailable(page: Page) {
	const clearDatabaseButton = page.getByRole('button', { name: /Clear Database/i });

	if (await clearDatabaseButton.isVisible().catch(() => false)) {
		await clearDatabaseButton.click();
		await goBackToClientPortalAfterReload(page);
	}

	await expect(page.getByText(/Active Commissions/i)).toBeVisible();
	await expect(page.getByText(/AVAILABLE/i)).toBeVisible();
}

async function openCommissionForm(page: Page) {
	await goToClientPortal(page);
	await makeCapacityAvailable(page);
	await page.getByRole('button', { name: /Request a Commission/i }).click();
	await expect(page.getByRole('heading', { name: /Commission Request/i })).toBeVisible();
	await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible();
}

async function mockBrowserDate(page: Page, isoDate: string) {
	await page.addInitScript((fixedIsoDate) => {
		const fixedTime = new Date(fixedIsoDate).getTime();
		const RealDate = Date;

		class MockDate extends RealDate {
			constructor(...args: any[]) {
				if (args.length === 0) {
					super(fixedTime);
				} else if (args.length === 1) {
					super(args[0]);
				} else {
					super(args[0], args[1], args[2], args[3] ?? 0, args[4] ?? 0, args[5] ?? 0, args[6] ?? 0);
				}
			}

			static now() {
				return fixedTime;
			}

			static parse(value: string) {
				return RealDate.parse(value);
			}

			static UTC(
				year: number,
				monthIndex: number,
				date?: number,
				hours?: number,
				minutes?: number,
				seconds?: number,
				ms?: number,
			) {
				return RealDate.UTC(year, monthIndex, date ?? 1, hours ?? 0, minutes ?? 0, seconds ?? 0, ms ?? 0);
			}
		}

		window.Date = MockDate as DateConstructor;
	}, isoDate);
}

async function fillStudentPersonalDetails(page: Page) {
	await page.getByPlaceholder('Juan dela Cruz').fill('QA Student');
	await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.student@dlsu.edu.ph');
	await page.getByPlaceholder('09123456789').fill('09123456789');
	await page.locator('select').nth(0).selectOption('DLSU Student');
	await page.getByPlaceholder(/12012345/i).fill('12345678');
	await page.getByPlaceholder(/BSCS-ST/i).fill('BSCS-ST');
	await page.locator('select').nth(1).selectOption('CCS');
	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
}

async function fillOutsiderPersonalDetails(page: Page, email = 'qa.outsider@example.com') {
	await page.getByPlaceholder('Juan dela Cruz').fill('QA Outsider');
	await page.getByPlaceholder('name@dlsu.edu.ph').fill(email);
	await page.getByPlaceholder('09123456789').fill('09123456789');
	await page.locator('select').nth(0).selectOption('Outsider');
	await page.getByPlaceholder(/Company \/ School \/ Organization/i).fill('QA Outsider Org');
	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
}

async function fillFacultyPersonalDetails(page: Page) {
	await page.getByPlaceholder('Juan dela Cruz').fill('QA Faculty');
	await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.faculty@dlsu.edu.ph');
	await page.getByPlaceholder('09123456789').fill('09123456789');
	await page.locator('select').nth(0).selectOption('Faculty');
	await page.getByPlaceholder(/Software Technology/i).fill('Software Technology');
	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
}

async function goToServiceSelection(page: Page) {
	await page.getByRole('button', { name: /Next Step/i }).click();
	await expect(page.getByRole('heading', { name: /Service Selection/i })).toBeVisible();
}

async function selectServiceAndPurpose(page: Page, serviceName: string | RegExp, purpose: string) {
	await page.getByRole('button', { name: serviceName }).click();
	await page.locator('select').nth(0).selectOption(purpose);
	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
	await page.getByRole('button', { name: /Next Step/i }).click();
	await expect(page.getByRole('heading', { name: /Commission Details/i })).toBeVisible();
}

async function select3DPrintingWithFile(page: Page) {
	await page.getByRole('button', { name: /3D Printing With File/i }).click();
	await page.locator('select').nth(0).selectOption('Academic / Thesis');
	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
	await page.getByRole('button', { name: /Next Step/i }).click();
	await expect(page.getByRole('heading', { name: /Commission Details/i })).toBeVisible();
}

async function fillCommissionDetails(
	page: Page,
	options: {
		color?: string;
		filament?: string;
		weight?: string;
		driveLink?: string | null;
		notes?: string;
		pickupDate?: string;
	} = {},
) {
	const color = options.color ?? 'Single Color';
	if (color === 'Single Color' || color === 'Multi-Color') {
		await page.locator('select').nth(0).selectOption(color);
	} else {
		await page.locator('select').nth(0).selectOption('Others');
		await page.getByPlaceholder(/e.g. Gold/i).fill(color);
	}

	await page.locator('select').nth(1).selectOption(options.filament ?? 'PLA');
	await page.locator('input[type="date"]').fill(options.pickupDate ?? dateDaysFromNow(7));

	if (options.weight !== undefined) {
		await page.locator('input[type="number"]').fill(options.weight);
	}

	await page.getByPlaceholder(/Dimensions/i).fill(options.notes ?? 'This is a QA test commission request.');

	if (options.driveLink !== null) {
		await page
			.getByPlaceholder(/drive.google.com/i)
			.fill(options.driveLink ?? 'https://drive.google.com/drive/folders/test-folder-123');
	}
}

async function fill3DPrintingDetails(page: Page, options?: { weight?: string; driveLink?: string | null }) {
	await page.locator('select').nth(0).selectOption('Single Color');
	await page.locator('select').nth(1).selectOption('PLA');
	await page.locator('input[type="date"]').fill(dateDaysFromNow(7));
	await page.locator('input[type="number"]').fill(options?.weight ?? '200');
	await page.getByPlaceholder(/Dimensions/i).fill('This is a QA test commission request.');

	if (options?.driveLink !== null) {
		await page
			.getByPlaceholder(/drive.google.com/i)
			.fill(options?.driveLink ?? 'https://drive.google.com/drive/folders/test-folder-123');
	}
}

async function mockGoogleSheets(
	page: Page,
	options: {
		commissions?: Record<string, unknown>[];
		services?: Record<string, unknown>[];
		testimonials?: Record<string, unknown>[];
		workshops?: Record<string, unknown>[];
	} = {},
) {
	const commissions = options.commissions ?? [];
	const services = options.services ?? SERVICE_FIXTURES;
	const testimonials = options.testimonials ?? TESTIMONIAL_FIXTURES;
	const workshops = options.workshops ?? WORKSHOP_FIXTURES;

	await page.route(GOOGLE_SCRIPT_ROUTE, async route => {
		const request = route.request();
		const headers = { 'Access-Control-Allow-Origin': '*' };

		if (request.method() === 'GET') {
			const sheet = new URL(request.url()).searchParams.get('sheet');
			const bodyBySheet: Record<string, Record<string, unknown>[]> = {
				commission_reqs: commissions,
				services,
				testimonials,
				workshops,
			};

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers,
				body: JSON.stringify(sheet ? bodyBySheet[sheet] ?? [] : []),
			});
			return;
		}

		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			headers,
			body: JSON.stringify({ success: true }),
		});
	});
}

async function mockEmailService(page: Page) {
	await page.route(EMAIL_SERVICE_ROUTE, async route => {
		const request = route.request();
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers });
			return;
		}

		const isAdminNotification = request.url().includes('/send-admin-notification');
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			headers,
			body: JSON.stringify(
				isAdminNotification
					? { sent: 1, recipients: ['qa.admin@example.com'] }
					: { sent: true, recipients: ['qa.outsider@example.com'] },
			),
		});
	});
}

test.describe('Client Portal Tests', () => {
	test.beforeEach(async ({ page }) => {
		await mockGoogleSheets(page);
		await mockEmailService(page);
	});

	test('TC-001 - client landing page shows FabLab introduction', async ({ page }) => {
		await goToClientPortal(page);
		await expect(page.getByRole('heading', { name: /Bring Your Ideas to Life/i })).toBeVisible();
		await expect(page.getByText(/Animo Labs Fabrication Laboratory offers 3D printing, NFC technology, and custom fabrication services/i)).toBeVisible();
		await expect(page.getByRole('img', { name: /FabLab 3D printing workspace/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /Request a Commission/i })).toBeVisible();
	});

	test('TC-002 - client landing page shows services, workshops, and approved testimonials from Sheets', async ({ page }) => {
		await goToClientPortal(page);
		await expect(page.getByRole('heading', { name: /Our Services/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /FDM 3D Printing/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Design Service/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Custom Keychains/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /NFC Keychains/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Upcoming Workshops/i })).toBeVisible();
		await expect(page.getByText(/Introduction to 3D Printing/i)).toBeVisible();
		await expect(page.getByRole('heading', { name: /What They Say/i })).toBeVisible();
		await expect(page.getByText(/Nico Alvarez/i)).toBeVisible();
		await expect(page.getByText(/FabLab made my thesis prototype a reality/i)).toBeVisible();
	});

	test('TC-003 - testimonial requires all inputs and submits a Pending record for admin approval', async ({ page }) => {
		await goToClientPortal(page);
		await page.getByRole('button', { name: /Submit a Testimonial/i }).click();
		await expect(page.getByRole('heading', { name: /Submit a Testimonial/i })).toBeVisible();

		const submitButton = page.getByRole('button', { name: /Submit for Approval/i });
		await expect(submitButton).toBeDisabled();
		await page.getByPlaceholder('Juan dela Cruz').fill('QA Testimonial Client');
		await page.getByPlaceholder("BS ME '26").fill('BSCS-ST');
		await expect(submitButton).toBeDisabled();
		await page.getByRole('button', { name: '4 stars' }).click();
		await page.getByPlaceholder(/Tell us about your experience/i).fill('The QA testimonial submission flow works correctly.');
		await expect(submitButton).toBeEnabled();

		const testimonialRequest = page.waitForRequest(request =>
			request.method() === 'POST' && request.url().includes('sheet=testimonials'),
		);
		await submitButton.click();
		const request = await testimonialRequest;
		const body = request.postDataJSON();

		expect(body).toMatchObject({
			sheet: 'testimonials',
			action: 'add',
			data: {
				name: 'QA Testimonial Client',
				program: 'BSCS-ST',
				text: 'The QA testimonial submission flow works correctly.',
				stars: 4,
				status: 'Pending',
			},
		});
		await expect(page.getByText(/testimonial is pending admin approval/i)).toBeVisible();
	});

	test('TC-004 - client can open commission request form while queue is available', async ({ page }) => {
		await goToClientPortal(page);
		await makeCapacityAvailable(page);
		await page.getByRole('button', { name: /Request a Commission/i }).click();
		await expect(page.getByRole('heading', { name: /Commission Request/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible();
		await expect(page.getByPlaceholder(/Juan dela Cruz/i)).toBeVisible();
		await expect(page.getByPlaceholder(/name@dlsu.edu.ph/i)).toBeVisible();
	});

	test('TC-005 - client type selection displays the correct student-specific fields', async ({ page }) => {
		await openCommissionForm(page);
		await page.locator('select').nth(0).selectOption('DLSU Student');
		await expect(page.getByPlaceholder(/12012345/i)).toBeVisible();
		await expect(page.getByPlaceholder(/BSCS-ST/i)).toBeVisible();
		await expect(page.locator('label').filter({ hasText: /^College/ })).toBeVisible();

		await page.locator('select').nth(0).selectOption('Non-DLSU Student');
		await expect(page.getByPlaceholder(/BSCS-ST/i)).toBeVisible();
		await expect(page.getByPlaceholder(/Ateneo de Manila University/i)).toBeVisible();
		await expect(page.getByPlaceholder(/12012345/i)).toHaveCount(0);
	});

	test('TC-006 - client type selection displays the correct faculty and outsider fields', async ({ page }) => {
		await openCommissionForm(page);
		await page.locator('select').nth(0).selectOption('Faculty');
		await expect(page.getByPlaceholder(/Software Technology/i)).toBeVisible();

		await page.locator('select').nth(0).selectOption('Outsider');
		await expect(page.getByPlaceholder(/Company \/ School \/ Organization/i)).toBeVisible();
		await expect(page.getByPlaceholder(/Software Technology/i)).toHaveCount(0);
	});

	test('TC-007 - valid outsider personal details allow navigation to service selection', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await expect(page.getByRole('heading', { name: /Service Selection/i })).toBeVisible();
	});

	test('TC-008 - client can complete a valid DLSU student commission request', async ({ page }) => {
		await openCommissionForm(page);
		await fillStudentPersonalDetails(page);
		await goToServiceSelection(page);
		await select3DPrintingWithFile(page);
		await fill3DPrintingDetails(page, { weight: '200' });
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		await page.getByRole('button', { name: /Next Step/i }).click();

		const reviewSection = page
			.getByRole('heading', { name: /Review Your Request/i })
			.locator('..');

		await expect(reviewSection).toBeVisible();
		await expect(reviewSection).toContainText('QA Student');
		await expect(reviewSection).toContainText('DLSU Student');
		await expect(reviewSection).toContainText('12345678');
		await expect(reviewSection).toContainText('BSCS-ST');
		await expect(reviewSection).toContainText('CCS');
		await expect(reviewSection).toContainText('3D Printing With File');
		await expect(reviewSection).toContainText('Academic / Thesis');
		await expect(reviewSection).toContainText('Single Color (PLA)');
		await expect(reviewSection).toContainText('200 g');

		await page.getByRole('button', { name: /Submit Request/i }).click();
		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-009 - personal details require name, email, contact number, client type, and role-specific data', async ({ page }) => {
		await openCommissionForm(page);
		const nextButton = page.getByRole('button', { name: /Next Step/i });
		await expect(nextButton).toBeDisabled();

		await page.getByPlaceholder('Juan dela Cruz').fill('QA Required Fields');
		await expect(nextButton).toBeDisabled();
		await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.required@example.com');
		await expect(nextButton).toBeDisabled();
		await page.getByPlaceholder('09123456789').fill('09123456789');
		await expect(nextButton).toBeDisabled();
		await page.locator('select').nth(0).selectOption('Outsider');
		await expect(nextButton).toBeDisabled();
		await page.getByPlaceholder(/Company \/ School \/ Organization/i).fill('QA Organization');
		await expect(nextButton).toBeEnabled();
	});

	test('TC-010 - invalid email shows an error and blocks the personal-details step', async ({ page }) => {
		await openCommissionForm(page);
		await page.getByPlaceholder('Juan dela Cruz').fill('Invalid Email User');
		await page.getByPlaceholder('name@dlsu.edu.ph').fill('not-an-email');
		await page.getByPlaceholder('09123456789').fill('09123456789');
		await page.locator('select').nth(0).selectOption('Outsider');
		await page.getByPlaceholder(/Company \/ School \/ Organization/i).fill('QA Org');

		await expect(page.getByText(/Please enter a valid email address/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();

		await page.getByPlaceholder('name@dlsu.edu.ph').fill('valid.user@example.com');
		await expect(page.getByText(/Please enter a valid email address/i)).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
	});

	test('TC-011 - contact number accepts digits only and requires exactly 11 digits', async ({ page }) => {
		await openCommissionForm(page);
		await page.getByPlaceholder('Juan dela Cruz').fill('Contact Validation User');
		await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.contact@example.com');
		await page.locator('select').nth(0).selectOption('Outsider');
		await page.getByPlaceholder(/Company \/ School \/ Organization/i).fill('QA Org');

		const contactInput = page.getByPlaceholder('09123456789');
		await contactInput.fill('09abc123');
		await expect(contactInput).toHaveValue('09123');
		await expect(page.getByText(/Contact number must be exactly 11 digits/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();

		await contactInput.fill('0912345678');
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();
		await contactInput.fill('09123456789');
		await expect(page.getByText(/Contact number must be exactly 11 digits/i)).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
	});

	test('TC-012 - DLSU student ID requires exactly 8 digits and program is required', async ({ page }) => {
		await openCommissionForm(page);
		await page.getByPlaceholder('Juan dela Cruz').fill('Student Validation User');
		await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.student.validation@dlsu.edu.ph');
		await page.getByPlaceholder('09123456789').fill('09123456789');
		await page.locator('select').nth(0).selectOption('DLSU Student');

		const idInput = page.getByPlaceholder(/12012345/i);
		await idInput.fill('12ab34');
		await expect(idInput).toHaveValue('1234');
		await expect(page.getByText(/ID number must be exactly 8 digits/i)).toBeVisible();
		await page.getByPlaceholder(/BSCS-ST/i).fill('BSCS-ST');
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();

		await idInput.fill('12345678');
		await expect(page.getByText(/ID number must be exactly 8 digits/i)).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		await page.getByPlaceholder(/BSCS-ST/i).fill('');
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();
	});

	test('TC-013 - client can return to personal details without losing entered values', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await page.getByRole('button', { name: /^Back$/i }).click();
		await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible();
		await expect(page.getByPlaceholder('Juan dela Cruz')).toHaveValue('QA Outsider');
		await expect(page.getByPlaceholder('name@dlsu.edu.ph')).toHaveValue('qa.outsider@example.com');
		await expect(page.getByPlaceholder('09123456789')).toHaveValue('09123456789');
	});

	test('TC-014 - client can return to service selection without losing the selected service', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');
		await page.getByRole('button', { name: /^Back$/i }).click();
		await expect(page.getByRole('heading', { name: /Service Selection/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /Modelling Only/i })).toHaveClass(/border-violet-600/);
	});

	test('TC-015 - client can cancel a request and return to the client portal', async ({ page }) => {
		await openCommissionForm(page);
		await page.getByRole('button', { name: /Cancel Request/i }).click();
		await expect(page.getByRole('button', { name: /Request a Commission/i })).toBeVisible();
		await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
	});

	test('TC-016 - client can complete a valid faculty commission request', async ({ page }) => {
		await openCommissionForm(page);
		await fillFacultyPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /Modelling Only/i, 'Research');
		await fillCommissionDetails(page, { driveLink: null });
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText('QA Faculty')).toBeVisible();
		await expect(page.getByText('Faculty', { exact: true })).toBeVisible();
		await expect(page.getByText('Software Technology')).toBeVisible();
		await expect(page.getByText(/Modelling Only/i)).toBeVisible();
		await expect(page.getByText(/Research/i)).toBeVisible();
		await expect(page.getByText(/Single Color \(PLA\)/i)).toBeVisible();
		await page.getByRole('button', { name: /Submit Request/i }).click();
		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-017 - client can complete a valid outsider commission request', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /Custom(?:ized)? Keychains/i, 'Personal Project');
		await fillCommissionDetails(page, { driveLink: null });
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText('QA Outsider', { exact: true })).toBeVisible();
		await expect(page.getByText('Outsider', { exact: true })).toBeVisible();
		await expect(page.getByText('QA Outsider Org', { exact: true })).toBeVisible();
		await expect(page.getByText(/Custom(?:ized)? Keychains/i)).toBeVisible();
		await expect(page.getByText(/Personal Project/i)).toBeVisible();
		await page.getByRole('button', { name: /Submit Request/i }).click();
		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-018 - client can return to the client portal after successful submission', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');
		await fillCommissionDetails(page, { driveLink: null });
		await page.getByRole('button', { name: /Next Step/i }).click();
		await page.getByRole('button', { name: /Submit Request/i }).click();
		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
		await page.getByRole('button', { name: /Return to Home/i }).click();
		await expect(page.getByRole('button', { name: /Request a Commission/i })).toBeVisible();
		await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
	});

	test('TC-019 - service selection requires one active service and excludes coming-soon services', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		const nextButton = page.getByRole('button', { name: /Next Step/i });
		const purposeSelect = page.locator('select').nth(0);

		await purposeSelect.selectOption('Academic / Thesis');
		await expect(purposeSelect).toHaveValue('Academic / Thesis');
		await expect(nextButton).toBeDisabled();

		const services = [
			/3D Printing With File/i,
			/3D Printing Without File/i,
			/Modelling Only/i,
			/Custom(?:ized)? Keychains/i,
			/NFC Keychains/i,
		];

		for (const service of services) {
			const serviceButton = page.getByRole('button', { name: service });
			await expect(serviceButton).toBeVisible();
			await serviceButton.click();
			await expect(nextButton).toBeEnabled();
		}

		await expect(page.getByText(/UV Printing/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /UV Printing/i })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Laser Cutting/i })).toHaveCount(0);
	});

	test('TC-020 - Other purpose requires details and 3D Printing W/O File does not require a Drive link', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await page.getByRole('button', { name: /3D Printing Without File/i }).click();
		await page.locator('select').nth(0).selectOption('Others');

		const nextButton = page.getByRole('button', { name: /Next Step/i });
		await expect(page.getByPlaceholder(/Type your purpose/i)).toBeVisible();
		await expect(page.getByText(/Please specify your purpose/i)).toBeVisible();
		await expect(nextButton).toBeDisabled();
		await page.getByPlaceholder(/Type your purpose/i).fill('Prototype for an external competition');
		await expect(nextButton).toBeEnabled();
		await nextButton.click();

		await fillCommissionDetails(page, {
			weight: '180',
			notes: 'QA test for no-upload flow.',
			driveLink: null,
		});
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		await page.getByRole('button', { name: /Next Step/i }).click();
		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText('3D Printing Without File (Modelling Needed)', { exact: true })).toBeVisible();
		await expect(page.getByText(/Prototype for an external competition/i)).toBeVisible();
	});

	test('TC-021 - commission details validate pickup date, custom color, weight range, and N/A weight', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /NFC Keychains/i, 'Organization Event');
		const nextButton = page.getByRole('button', { name: /Next Step/i });

		await expect(nextButton).toBeDisabled();
		await page.locator('select').nth(0).selectOption('Others');
		await expect(page.getByText(/Please specify your preferred color/i)).toBeVisible();
		await page.locator('input[type="date"]').fill(dateDaysFromNow(7));
		await expect(nextButton).toBeDisabled();
		await page.getByPlaceholder(/e.g. Gold/i).fill('Green');
		await expect(nextButton).toBeEnabled();

		const weightInput = page.locator('input[type="number"]');
		await weightInput.fill('0');
		await expect(nextButton).toBeDisabled();
		await weightInput.fill('1001');
		await expect(page.getByText(/Bulk Order/i)).toBeVisible();
		await expect(nextButton).toBeDisabled();
		await weightInput.fill('1000');
		await expect(nextButton).toBeEnabled();

		await page.getByLabel(/Not sure \/ N\/A/i).check();
		await expect(weightInput).toHaveCount(0);
		await expect(page.getByText(/Weight will be estimated by Resident Maker/i)).toBeVisible();
		await expect(nextButton).toBeEnabled();
		await nextButton.click();
		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText(/Green \(PLA\)/i)).toBeVisible();
		await expect(page.getByText('N/A', { exact: true })).toBeVisible();
	});

	test('TC-022 - Friday to Sunday submissions display the following-week processing notice', async ({ page }) => {
		await mockBrowserDate(page, '2026-07-03T10:00:00+08:00');
		await openCommissionForm(page);
		await expect(page.getByText(/Weekend Submission Notice/i)).toBeVisible();
		await expect(page.getByText(/Commissions submitted Friday to Sunday are processed starting the following week/i)).toBeVisible();
	});

	test('TC-023 - successful request shows confirmation and client-support instructions', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');
		await fillCommissionDetails(page, { driveLink: null });
		await page.getByRole('button', { name: /Next Step/i }).click();
		await page.getByRole('button', { name: /Submit Request/i }).click();

		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
		await expect(page.getByText(/commission request has been sent to our Resident Makers/i)).toBeVisible();
		await expect(page.getByText(/Confirmation email sent to qa\.outsider@example\.com/i)).toBeVisible();
		await expect(page.getByText(/Admin queue notified/i)).toBeVisible();
		await expect(page.getByText(/registered email for additional details and pricing/i)).toBeVisible();
		await expect(page.getByText(/domie\.jucutan@dlsu\.edu\.ph/i)).toBeVisible();
		await expect(page.getByText(/09209540688/i)).toBeVisible();
	});

	test('TC-024 - NFC Keychains request reaches review with selected purpose and material', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /NFC Keychains/i, 'Personal Project');
		await fillCommissionDetails(page, { color: 'Green', filament: 'PETG', weight: '250', driveLink: null });
		await page.getByRole('button', { name: /Next Step/i }).click();
		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText(/NFC Keychains/i)).toBeVisible();
		await expect(page.getByText(/Personal Project/i)).toBeVisible();
		await expect(page.getByText(/Green \(PETG\)/i)).toBeVisible();
		await expect(page.getByText(/250 g/i)).toBeVisible();
	});

	test('TC-025 - Monday to Thursday submissions do not display the weekend notice', async ({ page }) => {
		await mockBrowserDate(page, '2026-07-06T10:00:00+08:00');
		await openCommissionForm(page);
		await expect(page.getByText(/Weekend Submission Notice/i)).toHaveCount(0);
		await expect(page.getByText(/Commissions submitted Friday to Sunday are processed starting the following week/i)).toHaveCount(0);
	});

	test('TC-026 - 3D Printing W/File requires a valid Google Drive URL and saves it', async ({ page }) => {
		test.fail(true, 'Known validation discrepancy: the form currently checks only that the Drive-link field is non-empty, so plain text is accepted.');

		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await select3DPrintingWithFile(page);
		await page.locator('select').nth(0).selectOption('Single Color');
		await page.locator('select').nth(1).selectOption('PLA');
		await page.locator('input[type="date"]').fill(dateDaysFromNow(7));
		await page.locator('input[type="number"]').fill('200');
		await page.getByPlaceholder(/Dimensions/i).fill('QA checks the file-link workflow.');

		const driveInput = page.getByPlaceholder(/drive.google.com/i);
		const nextButton = page.getByRole('button', { name: /Next Step/i });
		await expect(page.getByText(/A Google Drive link is required for this service/i)).toBeVisible();
		await expect(nextButton).toBeDisabled();

		await driveInput.fill('not-a-google-drive-link');
		await expect.soft(nextButton).toBeDisabled();

		const driveLink = 'https://drive.google.com/drive/folders/qa-file-upload-test';
		await driveInput.fill(driveLink);
		await expect(nextButton).toBeEnabled();
		await nextButton.click();
		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText(driveLink, { exact: true })).toBeVisible();
	});

	test('TC-027 - submitting a request sends the saved data to Sheets and calls both email endpoints', async ({ page }) => {
		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);
		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');
		await fillCommissionDetails(page, { driveLink: null });
		await page.getByRole('button', { name: /Next Step/i }).click();

		const sheetsRequest = page.waitForRequest(request =>
			request.method() === 'POST' && request.url().includes('sheet=commission_reqs'),
		);
		const adminEmailRequest = page.waitForRequest(request =>
			request.method() === 'POST' && request.url().includes('/api/send-admin-notification'),
		);
		const clientEmailRequest = page.waitForRequest(request =>
			request.method() === 'POST' && request.url().includes('/api/send-client-queue-notification'),
		);

		await page.getByRole('button', { name: /Submit Request/i }).click();
		const [savedRequest, adminRequest, clientRequest] = await Promise.all([
			sheetsRequest,
			adminEmailRequest,
			clientEmailRequest,
		]);
		const savedBody = savedRequest.postDataJSON();
		const adminBody = adminRequest.postDataJSON();
		const clientBody = clientRequest.postDataJSON();

		expect(savedBody).toMatchObject({
			sheet: 'commission_reqs',
			action: 'add',
			data: {
				client: 'QA Outsider',
				clientEmail: 'qa.outsider@example.com',
				clientContactNumber: '09123456789',
				clientType: 'Outsider',
				affiliation: 'QA Outsider Org',
				service: 'Modelling Only',
				purpose: 'Personal Project',
			},
		});
		expect(savedBody.data.id).toMatch(/^COM-\d{3,}$/);

		expect(adminBody).toMatchObject({
			clientName: 'QA Outsider',
			clientEmail: 'qa.outsider@example.com',
			clientType: 'Outsider',
			service: 'Modelling Only',
		});
		expect(adminBody.commissionId).toBe(savedBody.data.id);
		expect(clientBody).toMatchObject({
			clientName: 'QA Outsider',
			clientEmail: 'qa.outsider@example.com',
			service: 'Modelling Only',
		});
		expect(clientBody.commissionId).toBe(savedBody.data.id);
		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-028 - client is blocked when there are 3 active commissions', async ({ page }) => {
		test.fail(true, 'Known requirement mismatch: the ClientPortal always displays AVAILABLE and does not block requests at 3 active commissions.');

		await page.unroute(GOOGLE_SCRIPT_ROUTE);
		await mockGoogleSheets(page, {
			commissions: [
				{ id: 'COM-001', status: 'In Progress' },
				{ id: 'COM-002', status: 'Pending' },
				{ id: 'COM-003', status: 'In Progress' },
			],
		});

		await goToClientPortal(page);
		await expect(page.getByText(/\(FULL\)/i)).toBeVisible();
		await page.getByRole('button', { name: /Request a Commission/i }).click();
		await expect(page.getByRole('heading', { name: /FabLab is Full/i })).toBeVisible();
		await expect(page.getByText(/maximum of 3 concurrent active commissions/i)).toBeVisible();
	});

	test('TC-029 - purpose of commission cannot remain Select before continuing', async ({ page }) => {
		test.fail(true, 'Known validation mismatch: a blank Purpose of Commission does not currently disable Next Step.');

		await openCommissionForm(page);
		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await page.getByRole('button', { name: /Modelling Only/i }).click();

		const purposeSelect = page.locator('select').nth(0);
		const nextButton = page.getByRole('button', { name: /Next Step/i });

		await expect(purposeSelect).toHaveValue('');
		await expect(nextButton).toBeDisabled();
		await expect(page.getByRole('heading', { name: /Service Selection/i })).toBeVisible();

		await purposeSelect.selectOption('Academic / Thesis');
		await expect(nextButton).toBeEnabled();

		await nextButton.click();
		await expect(page.getByRole('heading', { name: /Commission Details/i })).toBeVisible();
	});
});
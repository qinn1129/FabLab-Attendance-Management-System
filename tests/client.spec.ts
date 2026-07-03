import { test, expect, Page } from '@playwright/test';

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
	const clearDatabaseButton = page.getByRole('button', {
		name: /Clear Database/i,
	});

	if (await clearDatabaseButton.isVisible().catch(() => false)) {
		await clearDatabaseButton.click();
		await goBackToClientPortalAfterReload(page);
	}

	await expect(page.getByText(/0\s*\/\s*3 Active Commissions/i)).toBeVisible();
	await expect(page.getByText(/\(AVAILABLE\)/i)).toBeVisible();
}

async function makeCapacityFull(page: Page) {
	const restoreMockDataButton = page.getByRole('button', {
		name: /Restore Mock Data/i,
	});

	await expect(restoreMockDataButton).toBeVisible();
	await restoreMockDataButton.click();

	await goBackToClientPortalAfterReload(page);

	await expect(page.getByText(/3\s*\/\s*3 Active Commissions/i)).toBeVisible();
	await expect(page.getByText(/\(FULL\)/i)).toBeVisible();
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
					super(
						args[0],
						args[1],
						args[2],
						args[3] ?? 0,
						args[4] ?? 0,
						args[5] ?? 0,
						args[6] ?? 0,
					);
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
				return RealDate.UTC(
					year,
					monthIndex,
					date ?? 1,
					hours ?? 0,
					minutes ?? 0,
					seconds ?? 0,
					ms ?? 0,
				);
			}
		}

		window.Date = MockDate as DateConstructor;
	}, isoDate);
}

async function fillStudentPersonalDetails(page: Page) {
	await page.getByPlaceholder('Juan dela Cruz').fill('QA Student');
	await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.student@dlsu.edu.ph');

	await page.locator('select').nth(0).selectOption('Student');
	await page.getByPlaceholder(/12012345/i).fill('12345678');
	await page.getByPlaceholder(/BSCS-ST/i).fill('BSCS-ST');
	await page.locator('select').nth(1).selectOption('CCS');

	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
}

async function fillOutsiderPersonalDetails(page: Page, email = 'qa.outsider@example.com') {
	await page.getByPlaceholder('Juan dela Cruz').fill('QA Outsider');
	await page.getByPlaceholder('name@dlsu.edu.ph').fill(email);

	await page.locator('select').nth(0).selectOption('Outsider');

	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
}

async function fillFacultyPersonalDetails(page: Page) {
	await page.getByPlaceholder('Juan dela Cruz').fill('QA Faculty');
	await page.getByPlaceholder('name@dlsu.edu.ph').fill('qa.faculty@dlsu.edu.ph');

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
	await page.getByRole('button', { name: /3D Printing W\/File/i }).click();
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
		urgency?: string;
		weight?: string;
		notes?: string;
	} = {},
) {
	await page.locator('select').nth(0).selectOption(options.color ?? 'Black');
	await page.locator('select').nth(1).selectOption(options.filament ?? 'PLA');
	await page.locator('select').nth(2).selectOption(options.urgency ?? 'Standard (3-5 days)');

	await page.locator('input[type="number"]').fill(options.weight ?? '200');
	await page
		.getByPlaceholder(/Dimensions/i)
		.fill(options.notes ?? 'This is a QA test commission request.');

	await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
}

async function fill3DPrintingDetails(page: Page, options?: { weight?: string; uploadFile?: boolean }) {
	const weight = options?.weight ?? '200';
	const uploadFile = options?.uploadFile ?? true;

	await page.locator('select').nth(0).selectOption('Black');
	await page.locator('select').nth(1).selectOption('PLA');
	await page.locator('select').nth(2).selectOption('Standard (3-5 days)');

	await page.locator('input[type="number"]').fill(weight);
	await page.getByPlaceholder(/Dimensions/i).fill('This is a QA test commission request.');

	if (uploadFile) {
		await page.getByText(/Click to select a simulated mock file/i).click();
		await expect(page.getByText(/Uploaded: .+\.(stl|obj)/i)).toBeVisible();
	}
}

test.describe('Client Portal Tests', () => {
	test('TC-001 - client sees full capacity message when FabLab is full', async ({ page }) => {
		await goToClientPortal(page);
		await makeCapacityFull(page);

		await page.getByRole('button', { name: /Request a Commission/i }).click();

		await expect(page.getByRole('heading', { name: /FabLab is Full/i })).toBeVisible();
		await expect(page.getByText(/currently at full capacity/i)).toBeVisible();
		await expect(page.getByText(/maximum of 3 concurrent active commissions/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Return to Home/i })).toBeVisible();

		await expect(page.getByRole('heading', { name: /Personal Details/i })).toHaveCount(0);
	});

	test('TC-002 - client can return to client portal from full capacity page', async ({ page }) => {
		await goToClientPortal(page);
		await makeCapacityFull(page);

		await page.getByRole('button', { name: /Request a Commission/i }).click();

		await expect(page.getByRole('heading', { name: /FabLab is Full/i })).toBeVisible();

		await page.getByRole('button', { name: /Return to Home/i }).click();

		await expect(page.getByRole('button', { name: /Request a Commission/i })).toBeVisible();
		await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
		await expect(page.getByText(/\(FULL\)/i)).toBeVisible();
	});

	test('TC-003 - client can clear database to simulate available space', async ({ page }) => {
		await goToClientPortal(page);
		await makeCapacityFull(page);

		await expect(page.getByText(/\(FULL\)/i)).toBeVisible();

		await makeCapacityAvailable(page);

		await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
		await expect(page.getByText(/0\s*\/\s*3 Active Commissions/i)).toBeVisible();
		await expect(page.getByText(/\(AVAILABLE\)/i)).toBeVisible();
		await expect(page.getByText(/\(FULL\)/i)).toHaveCount(0);
	});

	test('TC-004 - client can open commission request form after space is available', async ({ page }) => {
		await goToClientPortal(page);

		await makeCapacityAvailable(page);

		await page.getByRole('button', { name: /Request a Commission/i }).click();

		await expect(page.getByRole('heading', { name: /Commission Request/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible();

		await expect(page.getByPlaceholder(/Juan dela Cruz/i)).toBeVisible();
		await expect(page.getByPlaceholder(/name@dlsu.edu.ph/i)).toBeVisible();
	});

	test('TC-005 - client form shows student fields when Student is selected', async ({ page }) => {
		await openCommissionForm(page);

		await page.locator('select').nth(0).selectOption('Student');

		await expect(page.getByPlaceholder(/12012345/i)).toBeVisible();
		await expect(page.getByPlaceholder(/BSCS-ST/i)).toBeVisible();
	});

	test('TC-006 - client form shows faculty fields when Faculty is selected', async ({ page }) => {
		await openCommissionForm(page);

		await page.locator('select').nth(0).selectOption('Faculty');

		await expect(page.getByPlaceholder(/Software Technology/i)).toBeVisible();
	});

	test('TC-007 - client can move from personal details to service selection', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await expect(page.getByRole('heading', { name: /Service Selection/i })).toBeVisible();
	});

	test('TC-008 - client can complete student commission request form', async ({ page }) => {
		await openCommissionForm(page);

		await fillStudentPersonalDetails(page);
		await goToServiceSelection(page);

		await select3DPrintingWithFile(page);

		await fill3DPrintingDetails(page, { weight: '200', uploadFile: true });

		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();

		await expect(page.getByText('QA Student')).toBeVisible();
		await expect(page.getByText('12345678')).toBeVisible();
		await expect(page.getByText(/BSCS-ST/i)).toBeVisible();
		await expect(page.getByText(/3D Printing W\/File/i)).toBeVisible();
		await expect(page.getByText(/Academic \/ Thesis/i)).toBeVisible();
		await expect(page.getByText(/Black/i)).toBeVisible();
		await expect(page.getByText(/PLA/i)).toBeVisible();
		await expect(page.getByText(/200/i)).toBeVisible();

		await page.getByRole('button', { name: /Submit Request/i }).click();

		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-009 - client cannot continue when personal details are empty', async ({ page }) => {
		await openCommissionForm(page);

		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();
	});

	test('TC-010 - client cannot continue when email format is invalid', async ({ page }) => {
		await openCommissionForm(page);

		await page.getByPlaceholder('Juan dela Cruz').fill('Invalid Email User');
		await page.getByPlaceholder('name@dlsu.edu.ph').fill('not-an-email');

		await page.locator('select').nth(0).selectOption('Outsider');

		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();
	});

	test('TC-011 - client cannot continue to confirmation when estimated weight is empty', async ({ page }) => {
		await openCommissionForm(page);

		await fillStudentPersonalDetails(page);
		await goToServiceSelection(page);

		await select3DPrintingWithFile(page);

		await fill3DPrintingDetails(page, { weight: '', uploadFile: true });

		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();
	});

	test('TC-012 - client cannot continue when required file is not uploaded for 3D Printing W/File', async ({ page }) => {
		await openCommissionForm(page);

		await fillStudentPersonalDetails(page);
		await goToServiceSelection(page);

		await select3DPrintingWithFile(page);

		await fill3DPrintingDetails(page, { weight: '200', uploadFile: false });

		await expect(page.getByText(/Uploading a file is required/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeDisabled();
	});

	test('TC-013 - client can go back from service selection to personal details', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await page.getByRole('button', { name: /^Back$/i }).click();

		await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible();
		await expect(page.getByPlaceholder('Juan dela Cruz')).toHaveValue('QA Outsider');
		await expect(page.getByPlaceholder('name@dlsu.edu.ph')).toHaveValue('qa.outsider@example.com');
	});

	test('TC-014 - client can go back from commission details to service selection', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');

		await page.getByRole('button', { name: /^Back$/i }).click();

		await expect(page.getByRole('heading', { name: /Service Selection/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /Modelling Only/i })).toBeVisible();
	});

	test('TC-015 - client can cancel request and return to client portal', async ({ page }) => {
		await openCommissionForm(page);

		await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible();

		await page.getByRole('button', { name: /Cancel Request/i }).click();

		await expect(page.getByRole('button', { name: /Request a Commission/i })).toBeVisible();
		await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
	});

	test('TC-016 - client can complete faculty commission request form', async ({ page }) => {
		await openCommissionForm(page);

		await fillFacultyPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /Modelling Only/i, 'Research');

		await fillCommissionDetails(page);
		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();

		await expect(page.getByText('QA Faculty')).toBeVisible();
		await expect(page.getByText('Faculty', { exact: true })).toBeVisible();
		await expect(page.getByText('Software Technology')).toBeVisible();
		await expect(page.getByText(/Modelling Only/i)).toBeVisible();
		await expect(page.getByText(/Research/i)).toBeVisible();
		await expect(page.getByText(/None \(Design Needed\)/i)).toBeVisible();

		await page.getByRole('button', { name: /Submit Request/i }).click();

		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-017 - client can complete outsider commission request form', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /Custom(?:ized)? Keychains/i, 'Personal Project');

		await fillCommissionDetails(page);
		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();

		await expect(page.getByText('QA Outsider')).toBeVisible();
		await expect(page.getByText('Outsider', { exact: true })).toBeVisible();
		await expect(page.getByText(/Custom(?:ized)? Keychains/i)).toBeVisible();
		await expect(page.getByText(/Personal Project/i)).toBeVisible();
		await expect(page.getByText(/None \(Design Needed\)/i)).toBeVisible();

		await page.getByRole('button', { name: /Submit Request/i }).click();

		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
	});

	test('TC-018 - client can return to client portal after successful submission', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');

		await fillCommissionDetails(page);
		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();

		await page.getByRole('button', { name: /Submit Request/i }).click();

		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();

		await page.getByRole('button', { name: /Return to Home/i }).click();

		await expect(page.getByRole('button', { name: /Request a Commission/i })).toBeVisible();
		await expect(page.getByText(/FabLab Capacity/i)).toBeVisible();
	});

	test('TC-019 - client can see and select all checked service options', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		const services = [
			/3D Printing W\/File/i,
			/3D Printing W\/O File/i,
			/Custom(?:ized)? Keychains/i,
			/NFC Keychains/i,
		];

		for (const service of services) {
			const serviceButton = page.getByRole('button', { name: service });

			await expect(serviceButton).toBeVisible();
			await serviceButton.click();

			await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();
		}
	});

	test('TC-020 - 3D Printing W/O File can continue without uploaded file', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /3D Printing W\/O File/i, 'Personal Project');

		await fillCommissionDetails(page, {
			weight: '180',
			notes: 'QA test for no-upload flow.',
		});

		await expect(page.getByText(/Uploading a file is required/i)).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Next Step/i })).toBeEnabled();

		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText(/3D Printing W\/O File/i)).toBeVisible();
		await expect(page.getByText(/Personal Project/i)).toBeVisible();
	});

	test('TC-021 - commission details save selected color and filament type', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /NFC Keychains/i, 'Organization Event');

		await fillCommissionDetails(page, {
			color: 'Green',
			filament: 'PETG',
			urgency: 'No rush',
			weight: '250',
			notes: 'QA checks color and filament values.',
		});

		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText(/NFC Keychains/i)).toBeVisible();
		await expect(page.getByText(/Organization Event/i)).toBeVisible();
		await expect(page.getByText(/Green PETG/i)).toBeVisible();
		await expect(page.getByText(/250 g/i)).toBeVisible();
		await expect(page.getByText(/No rush/i)).toBeVisible();
	});

	test('TC-022 - Friday to Sunday submissions display following-week processing disclaimer', async ({ page }) => {
		await mockBrowserDate(page, '2026-07-03T10:00:00+08:00'); // Friday

		await openCommissionForm(page);

		await expect(page.getByText(/Weekend Submission Notice/i)).toBeVisible();
		await expect(
			page.getByText(/Commissions submitted Friday to Sunday are processed starting the following week/i),
		).toBeVisible();
	});

	test('TC-023 - successful request shows confirmation screen and email instructions', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /Modelling Only/i, 'Personal Project');

		await fillCommissionDetails(page);

		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();

		await page.getByRole('button', { name: /Submit Request/i }).click();

		await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible();
		await expect(page.getByText(/commission request has been sent to our Resident Makers/i)).toBeVisible();

		await expect(page.getByText(/Confirmation email sent to qa\.outsider@example\.com/i)).toBeVisible();
		await expect(page.getByText(/Admin queue notified/i)).toBeVisible();

		await expect(page.getByText(/registered email for additional details and pricing/i)).toBeVisible();
		await expect(page.getByText(/domie\.jucutan@dlsu\.edu\.ph/i)).toBeVisible();
	});

	test('TC-024 - NFC Keychains request can reach review page', async ({ page }) => {
		await openCommissionForm(page);

		await fillOutsiderPersonalDetails(page);
		await goToServiceSelection(page);

		await selectServiceAndPurpose(page, /NFC Keychains/i, 'Personal Project');

		await fillCommissionDetails(page);

		await page.getByRole('button', { name: /Next Step/i }).click();

		await expect(page.getByRole('heading', { name: /Review Your Request/i })).toBeVisible();
		await expect(page.getByText(/NFC Keychains/i)).toBeVisible();
		await expect(page.getByText(/Personal Project/i)).toBeVisible();
	});

	test('TC-025 - Monday to Thursday submissions do not display weekend disclaimer', async ({ page }) => {
		await mockBrowserDate(page, '2026-07-06T10:00:00+08:00'); // Monday

		await openCommissionForm(page);

		await expect(page.getByText(/Weekend Submission Notice/i)).toHaveCount(0);
		await expect(
			page.getByText(/Commissions submitted Friday to Sunday are processed starting the following week/i),
		).toHaveCount(0);
	});
});
import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Workspace root detection (same pattern as spec-editor-persistence.spec.ts)
function getWorkspaceRoot(): string {
  const cwd = process.cwd();
  if (cwd.includes("apps/app")) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const FIXTURE_PATH = path.join(WORKSPACE_ROOT, "test/fixtures/projectA");
const CONTEXT_PATH = path.join(FIXTURE_PATH, ".automaker/context");
const TEST_IMAGE_SRC = path.join(WORKSPACE_ROOT, "apps/app/public/logo.png");

/**
 * Reset the context directory to empty state
 */
function resetContextDirectory(): void {
  if (fs.existsSync(CONTEXT_PATH)) {
    fs.rmSync(CONTEXT_PATH, { recursive: true });
  }
  fs.mkdirSync(CONTEXT_PATH, { recursive: true });
}

/**
 * Create a context file directly on disk (for test setup)
 */
function createContextFileOnDisk(filename: string, content: string): void {
  const filePath = path.join(CONTEXT_PATH, filename);
  fs.writeFileSync(filePath, content);
}

/**
 * Check if a context file exists on disk
 */
function contextFileExistsOnDisk(filename: string): boolean {
  const filePath = path.join(CONTEXT_PATH, filename);
  return fs.existsSync(filePath);
}

/**
 * Set up localStorage with a project pointing to our test fixture
 */
async function setupProjectWithFixture(page: Page, projectPath: string) {
  await page.addInitScript((pathArg: string) => {
    const mockProject = {
      id: "test-project-fixture",
      name: "projectA",
      path: pathArg,
      lastOpened: new Date().toISOString(),
    };

    const mockState = {
      state: {
        projects: [mockProject],
        currentProject: mockProject,
        currentView: "context",
        theme: "dark",
        sidebarOpen: true,
        apiKeys: { anthropic: "", google: "" },
        chatSessions: [],
        chatHistoryOpen: false,
        maxConcurrency: 3,
      },
      version: 0,
    };

    localStorage.setItem("automaker-storage", JSON.stringify(mockState));

    // Mark setup as complete
    const setupState = {
      state: {
        isFirstRun: false,
        setupComplete: true,
        currentStep: "complete",
        skipClaudeSetup: false,
      },
      version: 0,
    };
    localStorage.setItem("automaker-setup", JSON.stringify(setupState));
  }, projectPath);
}

/**
 * Navigate to context view after page load
 */
async function navigateToContextView(page: Page) {
  const contextNav = page.locator('[data-testid="nav-context"]');
  await contextNav.waitFor({ state: "visible", timeout: 10000 });
  await contextNav.click();
  await page.waitForSelector('[data-testid="context-view"]', { timeout: 10000 });
}

/**
 * Wait for file content panel to load (either editor, preview, or image)
 */
async function waitForFileContentToLoad(page: Page): Promise<void> {
  // Wait for either the editor, preview, or image to appear
  await page.waitForSelector(
    '[data-testid="context-editor"], [data-testid="markdown-preview"], [data-testid="image-preview"]',
    { timeout: 10000 }
  );
}

/**
 * Switch from preview mode to edit mode for markdown files
 * Markdown files open in preview mode by default, this helper switches to edit mode
 */
async function switchToEditMode(page: Page): Promise<void> {
  // First wait for content to load
  await waitForFileContentToLoad(page);

  const isPreview = await page
    .locator('[data-testid="markdown-preview"]')
    .isVisible()
    .catch(() => false);

  if (isPreview) {
    await page.locator('[data-testid="toggle-preview-mode"]').click();
    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });
  }
}

/**
 * Wait for a specific file to appear in the file list
 */
async function waitForContextFile(
  page: Page,
  filename: string,
  timeout: number = 10000
): Promise<void> {
  const locator = page.locator(`[data-testid="context-file-${filename}"]`);
  await locator.waitFor({ state: "visible", timeout });
}

/**
 * Click a file in the list and wait for it to be selected (toolbar visible)
 * Uses JavaScript click to ensure React event handler fires
 */
async function selectContextFile(
  page: Page,
  filename: string,
  timeout: number = 10000
): Promise<void> {
  const fileButton = page.locator(`[data-testid="context-file-${filename}"]`);
  await fileButton.waitFor({ state: "visible", timeout });

  // Small delay to ensure React has finished rendering the file list
  await page.waitForTimeout(200);

  // Use JavaScript click to ensure React onClick handler fires
  await fileButton.evaluate((el) => (el as HTMLButtonElement).click());

  // Wait for the file to be selected (toolbar with delete button becomes visible)
  // Use poll to handle async file loading
  await expect(page.locator('[data-testid="delete-context-file"]')).toBeVisible({
    timeout,
  });
}

/**
 * Simulate drag and drop of a file onto an element
 */
async function simulateFileDrop(
  page: Page,
  targetSelector: string,
  fileName: string,
  fileContent: string,
  mimeType: string = "text/plain"
): Promise<void> {
  await page.evaluate(
    ({ selector, content, name, mime }) => {
      const target = document.querySelector(selector);
      if (!target) throw new Error(`Element not found: ${selector}`);

      const file = new File([content], name, { type: mime });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      // Dispatch drag events
      target.dispatchEvent(
        new DragEvent("dragover", {
          dataTransfer,
          bubbles: true,
        })
      );
      target.dispatchEvent(
        new DragEvent("drop", {
          dataTransfer,
          bubbles: true,
        })
      );
    },
    { selector: targetSelector, content: fileContent, name: fileName, mime: mimeType }
  );
}

// Configure all tests to run serially to prevent interference with shared context directory
test.describe.configure({ mode: "serial" });

// ============================================================================
// Test Suite 1: Context View - File Management
// ============================================================================
test.describe("Context View - File Management", () => {

  test.beforeEach(async () => {
    resetContextDirectory();
  });

  test.afterEach(async () => {
    resetContextDirectory();
  });

  test("should create a new MD context file", async ({ page }) => {
    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Click Add File button
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    // Select text type (should be default)
    await page.locator('[data-testid="add-text-type"]').click();

    // Enter filename
    await page
      .locator('[data-testid="new-file-name"]')
      .fill("test-context.md");

    // Enter content
    const testContent = "# Test Context\n\nThis is test content";
    await page.locator('[data-testid="new-file-content"]').fill(testContent);

    // Click confirm
    await page.locator('[data-testid="confirm-add-file"]').click();

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // Wait for file list to refresh (file should appear)
    await waitForContextFile(page, "test-context.md", 10000);

    // Verify file appears in list
    const fileButton = page.locator(
      '[data-testid="context-file-test-context.md"]'
    );
    await expect(fileButton).toBeVisible();

    // Click on the file and wait for it to be selected
    await selectContextFile(page, "test-context.md");

    // Wait for content to load
    await waitForFileContentToLoad(page);

    // Switch to edit mode if in preview mode (markdown files default to preview)
    await switchToEditMode(page);

    // Wait for editor to be visible
    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    // Verify content in editor
    const editorContent = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(editorContent).toBe(testContent);
  });

  test("should edit an existing MD context file", async ({ page }) => {
    // Create a test file on disk first
    const originalContent = "# Original Content\n\nThis will be edited.";
    createContextFileOnDisk("edit-test.md", originalContent);

    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Click on the existing file and wait for it to be selected
    await selectContextFile(page, "edit-test.md");

    // Wait for file content to load
    await waitForFileContentToLoad(page);

    // Switch to edit mode (markdown files open in preview mode by default)
    await switchToEditMode(page);

    // Wait for editor
    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    // Modify content
    const newContent = "# Modified Content\n\nThis has been edited.";
    await page.locator('[data-testid="context-editor"]').fill(newContent);

    // Click save
    await page.locator('[data-testid="save-context-file"]').click();

    // Wait for save to complete
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="save-context-file"]')
          ?.textContent?.includes("Saved"),
      { timeout: 5000 }
    );

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Navigate back to context view
    await navigateToContextView(page);

    // Wait for file to appear after reload and select it
    await selectContextFile(page, "edit-test.md");

    // Wait for content to load
    await waitForFileContentToLoad(page);

    // Switch to edit mode (markdown files open in preview mode)
    await switchToEditMode(page);

    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    // Verify content persisted
    const persistedContent = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(persistedContent).toBe(newContent);
  });

  test("should remove an MD context file", async ({ page }) => {
    // Create a test file on disk first
    createContextFileOnDisk("delete-test.md", "# Delete Me");

    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Click on the file to select it
    const fileButton = page.locator(
      '[data-testid="context-file-delete-test.md"]'
    );
    await fileButton.waitFor({ state: "visible", timeout: 5000 });
    await fileButton.click();

    // Click delete button
    await page.locator('[data-testid="delete-context-file"]').click();

    // Wait for delete dialog
    await page.waitForSelector('[data-testid="delete-context-dialog"]', {
      timeout: 5000,
    });

    // Confirm deletion
    await page.locator('[data-testid="confirm-delete-file"]').click();

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="delete-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file is removed from list
    await expect(
      page.locator('[data-testid="context-file-delete-test.md"]')
    ).not.toBeVisible();

    // Verify file is removed from disk
    expect(contextFileExistsOnDisk("delete-test.md")).toBe(false);
  });

  test("should upload an image context file", async ({ page }) => {
    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Click Add File button
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    // Select image type
    await page.locator('[data-testid="add-image-type"]').click();

    // Enter filename
    await page.locator('[data-testid="new-file-name"]').fill("test-image.png");

    // Upload image using file input
    await page.setInputFiles(
      '[data-testid="image-upload-input"]',
      TEST_IMAGE_SRC
    );

    // Wait for image preview to appear (indicates upload success)
    await page.waitForTimeout(500);

    // Click confirm
    await page.locator('[data-testid="confirm-add-file"]').click();

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file appears in list
    const fileButton = page.locator(
      '[data-testid="context-file-test-image.png"]'
    );
    await expect(fileButton).toBeVisible();

    // Click on the image to view it
    await fileButton.click();

    // Verify image preview is displayed
    await page.waitForSelector('[data-testid="image-preview"]', {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test("should remove an image context file", async ({ page }) => {
    // Create a test image file on disk as base64 data URL (matching app's storage format)
    const imageContent = fs.readFileSync(TEST_IMAGE_SRC);
    const base64DataUrl = `data:image/png;base64,${imageContent.toString("base64")}`;
    fs.writeFileSync(path.join(CONTEXT_PATH, "delete-image.png"), base64DataUrl);

    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Wait for the image file and select it
    await selectContextFile(page, "delete-image.png");

    // Wait for file content (image preview) to load
    await waitForFileContentToLoad(page);

    // Click delete button
    await page.locator('[data-testid="delete-context-file"]').click();

    // Wait for delete dialog
    await page.waitForSelector('[data-testid="delete-context-dialog"]', {
      timeout: 5000,
    });

    // Confirm deletion
    await page.locator('[data-testid="confirm-delete-file"]').click();

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="delete-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file is removed from list
    await expect(
      page.locator('[data-testid="context-file-delete-image.png"]')
    ).not.toBeVisible();
  });

  test("should toggle markdown preview mode", async ({ page }) => {
    // Create a markdown file with content
    const mdContent =
      "# Heading\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2";
    createContextFileOnDisk("preview-test.md", mdContent);

    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Click on the markdown file
    const fileButton = page.locator(
      '[data-testid="context-file-preview-test.md"]'
    );
    await fileButton.waitFor({ state: "visible", timeout: 5000 });
    await fileButton.click();

    // Wait for editor to appear (default mode for md files is preview based on component code)
    await page.waitForTimeout(500);

    // Check if preview button is visible (indicates it's a markdown file)
    const previewToggle = page.locator('[data-testid="toggle-preview-mode"]');
    await expect(previewToggle).toBeVisible();

    // Check current mode - if we see markdown-preview, we're in preview mode
    const isInPreviewMode = await page
      .locator('[data-testid="markdown-preview"]')
      .isVisible()
      .catch(() => false);

    if (isInPreviewMode) {
      // Click to switch to edit mode
      await previewToggle.click();
      await page.waitForSelector('[data-testid="context-editor"]', {
        timeout: 5000,
      });

      // Verify editor is shown
      await expect(
        page.locator('[data-testid="context-editor"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="markdown-preview"]')
      ).not.toBeVisible();

      // Click to switch back to preview mode
      await previewToggle.click();
      await page.waitForSelector('[data-testid="markdown-preview"]', {
        timeout: 5000,
      });

      // Verify preview is shown
      await expect(
        page.locator('[data-testid="markdown-preview"]')
      ).toBeVisible();
    } else {
      // We're in edit mode, click to switch to preview
      await previewToggle.click();
      await page.waitForSelector('[data-testid="markdown-preview"]', {
        timeout: 5000,
      });

      // Verify preview is shown
      await expect(
        page.locator('[data-testid="markdown-preview"]')
      ).toBeVisible();

      // Click to switch back to edit mode
      await previewToggle.click();
      await page.waitForSelector('[data-testid="context-editor"]', {
        timeout: 5000,
      });

      // Verify editor is shown
      await expect(
        page.locator('[data-testid="context-editor"]')
      ).toBeVisible();
    }
  });
});

// ============================================================================
// Test Suite 2: Context View - Drag and Drop
// ============================================================================
test.describe("Context View - Drag and Drop", () => {
  test.beforeEach(async () => {
    resetContextDirectory();
  });

  test.afterEach(async () => {
    resetContextDirectory();
  });

  test("should handle drag and drop of MD file onto textarea in add dialog", async ({
    page,
  }) => {
    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Open add file dialog
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    // Ensure text type is selected
    await page.locator('[data-testid="add-text-type"]').click();

    // Simulate drag and drop of a .md file onto the textarea
    const droppedContent = "# Dropped Content\n\nThis was dragged and dropped.";
    await simulateFileDrop(
      page,
      '[data-testid="new-file-content"]',
      "dropped-file.md",
      droppedContent
    );

    // Wait for content to be populated
    await page.waitForTimeout(500);

    // Verify content is populated in textarea
    const textareaContent = await page
      .locator('[data-testid="new-file-content"]')
      .inputValue();
    expect(textareaContent).toBe(droppedContent);

    // Verify filename is auto-filled
    const filenameValue = await page
      .locator('[data-testid="new-file-name"]')
      .inputValue();
    expect(filenameValue).toBe("dropped-file.md");

    // Confirm and create the file
    await page.locator('[data-testid="confirm-add-file"]').click();

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file was created
    await expect(
      page.locator('[data-testid="context-file-dropped-file.md"]')
    ).toBeVisible();
  });

  test("should handle drag and drop of file onto main view", async ({
    page,
  }) => {
    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Wait for the context view to be fully loaded
    await page.waitForSelector('[data-testid="context-file-list"]', {
      timeout: 5000,
    });

    // Simulate drag and drop onto the drop zone
    const droppedContent = "This is a text file dropped onto the main view.";
    await simulateFileDrop(
      page,
      '[data-testid="context-drop-zone"]',
      "main-drop.txt",
      droppedContent
    );

    // Wait for file to appear in the list (drag-drop triggers file creation)
    await waitForContextFile(page, "main-drop.txt", 15000);

    // Verify file appears in the file list
    const fileButton = page.locator(
      '[data-testid="context-file-main-drop.txt"]'
    );
    await expect(fileButton).toBeVisible();

    // Select file and verify content
    await fileButton.click();
    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    const editorContent = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(editorContent).toBe(droppedContent);
  });
});

// ============================================================================
// Test Suite 3: Context View - Edge Cases
// ============================================================================
test.describe("Context View - Edge Cases", () => {
  test.beforeEach(async () => {
    resetContextDirectory();
  });

  test.afterEach(async () => {
    resetContextDirectory();
  });

  test("should handle duplicate filename (overwrite behavior)", async ({
    page,
  }) => {
    // Create an existing file
    createContextFileOnDisk("test.md", "# Original Content");

    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Verify the original file exists
    await expect(
      page.locator('[data-testid="context-file-test.md"]')
    ).toBeVisible();

    // Try to create another file with the same name
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    await page.locator('[data-testid="add-text-type"]').click();
    await page.locator('[data-testid="new-file-name"]').fill("test.md");
    await page
      .locator('[data-testid="new-file-content"]')
      .fill("# New Content - Overwritten");

    await page.locator('[data-testid="confirm-add-file"]').click();

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // File should still exist (was overwritten)
    await expect(
      page.locator('[data-testid="context-file-test.md"]')
    ).toBeVisible();

    // Select the file and verify the new content
    await page.locator('[data-testid="context-file-test.md"]').click();

    // Wait for content to load
    await page.waitForTimeout(500);

    // Switch to edit mode (markdown files open in preview mode)
    await switchToEditMode(page);

    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    const editorContent = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(editorContent).toBe("# New Content - Overwritten");
  });

  test("should handle special characters in filename", async ({ page }) => {
    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Test file with parentheses
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    await page.locator('[data-testid="add-text-type"]').click();
    await page.locator('[data-testid="new-file-name"]').fill("context (1).md");
    await page
      .locator('[data-testid="new-file-content"]')
      .fill("Content with parentheses in filename");

    await page.locator('[data-testid="confirm-add-file"]').click();
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file is created - use CSS escape for special characters
    await expect(
      page.locator('[data-testid="context-file-context (1).md"]')
    ).toBeVisible();

    // Test file with hyphens and underscores
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    await page.locator('[data-testid="add-text-type"]').click();
    await page
      .locator('[data-testid="new-file-name"]')
      .fill("test-file_v2.md");
    await page
      .locator('[data-testid="new-file-content"]')
      .fill("Content with hyphens and underscores");

    await page.locator('[data-testid="confirm-add-file"]').click();
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file is created
    await expect(
      page.locator('[data-testid="context-file-test-file_v2.md"]')
    ).toBeVisible();

    // Verify both files are accessible
    await page.locator('[data-testid="context-file-test-file_v2.md"]').click();

    // Wait for content to load
    await page.waitForTimeout(500);

    // Switch to edit mode (markdown files open in preview mode)
    await switchToEditMode(page);

    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    const content = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(content).toBe("Content with hyphens and underscores");
  });

  test("should handle empty content", async ({ page }) => {
    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Create file with empty content
    await page.locator('[data-testid="add-context-file"]').click();
    await page.waitForSelector('[data-testid="add-context-dialog"]', {
      timeout: 5000,
    });

    await page.locator('[data-testid="add-text-type"]').click();
    await page.locator('[data-testid="new-file-name"]').fill("empty-file.md");
    // Don't fill any content - leave it empty

    await page.locator('[data-testid="confirm-add-file"]').click();
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="add-context-dialog"]'),
      { timeout: 5000 }
    );

    // Verify file is created
    await expect(
      page.locator('[data-testid="context-file-empty-file.md"]')
    ).toBeVisible();

    // Select file and verify editor shows empty content
    await page.locator('[data-testid="context-file-empty-file.md"]').click();

    // Wait for content to load
    await page.waitForTimeout(500);

    // Switch to edit mode (markdown files open in preview mode)
    await switchToEditMode(page);

    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    const editorContent = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(editorContent).toBe("");

    // Verify save works with empty content
    // The save button should be disabled when there are no changes
    // Let's add some content first, then clear it and save
    await page.locator('[data-testid="context-editor"]').fill("temporary");
    await page.locator('[data-testid="context-editor"]').fill("");

    // Save should work
    await page.locator('[data-testid="save-context-file"]').click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="save-context-file"]')
          ?.textContent?.includes("Saved"),
      { timeout: 5000 }
    );
  });

  test("should verify persistence across page refresh", async ({ page }) => {
    // Create a file directly on disk to ensure it persists across refreshes
    const testContent = "# Persistence Test\n\nThis content should persist.";
    createContextFileOnDisk("persist-test.md", testContent);

    await setupProjectWithFixture(page, FIXTURE_PATH);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await navigateToContextView(page);

    // Verify file exists before refresh
    await waitForContextFile(page, "persist-test.md", 10000);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Navigate back to context view
    await navigateToContextView(page);

    // Select the file after refresh (uses robust clicking mechanism)
    await selectContextFile(page, "persist-test.md");

    // Wait for file content to load
    await waitForFileContentToLoad(page);

    // Switch to edit mode (markdown files open in preview mode)
    await switchToEditMode(page);

    await page.waitForSelector('[data-testid="context-editor"]', {
      timeout: 5000,
    });

    const persistedContent = await page
      .locator('[data-testid="context-editor"]')
      .inputValue();
    expect(persistedContent).toBe(testContent);
  });
});

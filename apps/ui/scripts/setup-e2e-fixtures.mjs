#!/usr/bin/env node

/**
 * Setup script for E2E test fixtures
 * Creates the necessary test fixture directories and files before running Playwright tests
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve workspace root (apps/app/scripts -> workspace root)
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");
const FIXTURE_PATH = path.join(WORKSPACE_ROOT, "test/fixtures/projectA");
const SPEC_FILE_PATH = path.join(FIXTURE_PATH, ".automaker/app_spec.txt");

const SPEC_CONTENT = `<app_spec>
  <name>Test Project A</name>
  <description>A test fixture project for Playwright testing</description>
  <tech_stack>
    <item>TypeScript</item>
    <item>React</item>
  </tech_stack>
</app_spec>
`;

function setupFixtures() {
  console.log("Setting up E2E test fixtures...");
  console.log(`Workspace root: ${WORKSPACE_ROOT}`);
  console.log(`Fixture path: ${FIXTURE_PATH}`);

  // Create fixture directory
  const specDir = path.dirname(SPEC_FILE_PATH);
  if (!fs.existsSync(specDir)) {
    fs.mkdirSync(specDir, { recursive: true });
    console.log(`Created directory: ${specDir}`);
  }

  // Create app_spec.txt
  fs.writeFileSync(SPEC_FILE_PATH, SPEC_CONTENT);
  console.log(`Created fixture file: ${SPEC_FILE_PATH}`);

  console.log("E2E test fixtures setup complete!");
}

setupFixtures();

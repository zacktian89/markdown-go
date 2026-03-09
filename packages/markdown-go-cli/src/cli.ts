#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runInstallSkillCommand } from "./install.js";
import { printPreviewUsage, runPreviewCommand } from "./preview.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = __dirname;
const packageRoot = path.resolve(distDir, "..");
const packageJsonPath = path.join(packageRoot, "package.json");
const packageJson = fs.existsSync(packageJsonPath)
  ? JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  : {};
const packageVersion = packageJson.version ?? "0.0.0";
const packageName = packageJson.name ?? "@zacktian/markdown-go";

function printTopLevelUsage() {
  console.log(`markdown-go v${packageVersion}

Usage:
  markdown-go <markdown-file>
  markdown-go "<markdown-string>" --is-string
  markdown-go install-skill [options]

Commands:
  install-skill  Install the markdown-go skill into supported AI coding tools

Global Options:
  -h, --help     Show this help message
  -v, --version  Print CLI version`);
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const [command, ...restArgs] = rawArgs;

  if (!command) {
    printPreviewUsage(packageVersion);
    process.exitCode = 1;
    return;
  }

  if (command === "-v" || command === "--version") {
    console.log(packageVersion);
    return;
  }

  if (command === "-h" || command === "--help") {
    printTopLevelUsage();
    return;
  }

  if (command === "install-skill") {
    await runInstallSkillCommand({
      args: restArgs,
      packageName,
      packageRoot,
      packageVersion
    });
    return;
  }

  await runPreviewCommand({
    args: rawArgs,
    packageVersion,
    packageRoot
  });
}

main().catch((error) => {
  console.error("Fatal running markdown-go:", error);
  process.exitCode = 1;
});

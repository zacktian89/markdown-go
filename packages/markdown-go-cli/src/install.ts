import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";

type InstallContext = {
  args: string[];
  packageName: string;
  packageRoot: string;
  packageVersion: string;
};

type SupportedTool = "codex" | "claude" | "cursor" | "antigravity";

type ToolTarget = {
  installRootCandidates: string[];
  label: string;
  markers: string[];
  name: SupportedTool;
};

const supportedTools: SupportedTool[] = ["codex", "claude", "cursor", "antigravity"];

function getHomeDir() {
  return os.homedir();
}

function getToolTargets(): Record<SupportedTool, ToolTarget> {
  const homeDir = getHomeDir();
  const appData = process.env.APPDATA ?? path.join(homeDir, "AppData", "Roaming");
  const localAppData = process.env.LOCALAPPDATA ?? path.join(homeDir, "AppData", "Local");
  const libraryDir = path.join(homeDir, "Library");

  return {
    codex: {
      name: "codex",
      label: "Codex",
      installRootCandidates: [process.env.CODEX_HOME ?? path.join(homeDir, ".codex")],
      markers: [process.env.CODEX_HOME ?? path.join(homeDir, ".codex")]
    },
    claude: {
      name: "claude",
      label: "Claude Code",
      installRootCandidates: [path.join(homeDir, ".claude")],
      markers: [path.join(homeDir, ".claude"), path.join(appData, "Claude")]
    },
    cursor: {
      name: "cursor",
      label: "Cursor",
      installRootCandidates: [path.join(homeDir, ".cursor")],
      markers: [
        path.join(homeDir, ".cursor"),
        path.join(appData, "Cursor"),
        path.join(localAppData, "Programs", "Cursor"),
        path.join(libraryDir, "Application Support", "Cursor"),
        "/Applications/Cursor.app"
      ]
    },
    antigravity: {
      name: "antigravity",
      label: "Antigravity",
      installRootCandidates: [path.join(homeDir, ".agents"), path.join(homeDir, ".agent")],
      markers: [path.join(homeDir, ".agents"), path.join(homeDir, ".agent")]
    }
  };
}

function npmExecutable() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function printInstallUsage(packageVersion: string) {
  console.log(`markdown-go v${packageVersion}

Usage:
  markdown-go install-skill [options]

Options:
  --tool <name>  Tool to install into: auto, all, codex, claude, cursor, antigravity
  --force        Overwrite an existing markdown-go skill directory
  --dry-run      Print the actions without writing files or installing npm packages
  -h, --help     Show this help message`);
}

function assertNodeVersion() {
  const majorVersion = Number(process.versions.node.split(".")[0] ?? "0");
  if (majorVersion < 18) {
    throw new Error(`markdown-go install-skill requires Node.js 18+ (current: ${process.versions.node}).`);
  }
}

function compareMajorVersions(expectedVersion: string, actualVersion: string) {
  return expectedVersion.split(".")[0] === actualVersion.split(".")[0];
}

function resolveTemplateDir(packageRoot: string) {
  const directPath = path.join(packageRoot, "assets", "skills", "markdown-go");
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const workspaceFallback = path.resolve(packageRoot, "..", "..", "skills", "markdown-go");
  if (fs.existsSync(workspaceFallback)) {
    return workspaceFallback;
  }

  throw new Error("Could not locate the bundled markdown-go skill template.");
}

function renderSkillTemplate(templateDir: string, commandToRun: string) {
  const skillPath = path.join(templateDir, "SKILL.md");
  const template = fs.readFileSync(skillPath, "utf-8");
  return template.replaceAll("{{MARKDOWN_GO_COMMAND}}", commandToRun);
}

function resolveSkillInstallDir(target: ToolTarget) {
  const existingRoot = target.installRootCandidates.find((candidate) => fs.existsSync(candidate));
  const rootDir = existingRoot ?? target.installRootCandidates[0];
  return path.join(rootDir, "skills", "markdown-go");
}

function isDetectedTool(target: ToolTarget) {
  return target.markers.some((marker) => marker && fs.existsSync(marker));
}

function normalizeToolSelection(values: string[] | undefined) {
  const explicitSelections = (values ?? [])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (explicitSelections.length === 0) {
    return { mode: "auto" as const, tools: [] as SupportedTool[] };
  }

  if (explicitSelections.includes("all")) {
    return { mode: "all" as const, tools: supportedTools };
  }

  if (explicitSelections.includes("auto")) {
    return { mode: "auto" as const, tools: [] as SupportedTool[] };
  }

  const invalidSelections = explicitSelections.filter((value) => !supportedTools.includes(value as SupportedTool));
  if (invalidSelections.length > 0) {
    throw new Error(`Unsupported tool selection: ${invalidSelections.join(", ")}`);
  }

  return {
    mode: "explicit" as const,
    tools: explicitSelections as SupportedTool[]
  };
}

function quoteWindowsArg(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function runCommand(command: string, args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const stdio: any = options?.stdio === "inherit" ? "inherit" : ["ignore", "pipe", "pipe"];
    let child: ReturnType<typeof spawn>;

    if (process.platform === "win32") {
      child = spawn(
        process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
        ["/d", "/c", command, ...args],
        {
          env: process.env,
          shell: false,
          stdio
        }
      );
    } else {
      child = spawn(command, args, {
        env: process.env,
        shell: false,
        stdio
      });
    }

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code: number | null) => {
      resolve({
        code: code ?? 1,
        stderr: stderr.trim(),
        stdout: stdout.trim()
      });
    });
  });
}

async function ensureNpmAvailable() {
  const result = await runCommand(npmExecutable(), ["--version"]);
  if (!result.stdout) {
    throw new Error(result.stderr || "npm is required for install-skill but was not found.");
  }
  return result.stdout.split(/\r?\n/)[0] ?? result.stdout;
}

async function getGlobalNodeModulesRoot() {
  const result = await runCommand(npmExecutable(), ["root", "-g"]);
  if (!result.stdout) {
    throw new Error(result.stderr || "Could not determine npm global root.");
  }
  return result.stdout.split(/\r?\n/)[0] ?? result.stdout;
}

function buildCliInvocation(cliEntryPath: string) {
  return `node "${cliEntryPath}"`;
}

async function ensureCliInstall(context: InstallContext, dryRun: boolean) {
  const globalRootBeforeInstall = dryRun ? null : await getGlobalNodeModulesRoot();
  const expectedCliEntryBeforeInstall = globalRootBeforeInstall
    ? path.join(globalRootBeforeInstall, context.packageName, "dist", "cli.js")
    : null;
  const currentCliEntry = path.resolve(process.argv[1] ?? "");
  const alreadyInstalled = expectedCliEntryBeforeInstall
    ? fs.existsSync(expectedCliEntryBeforeInstall) && path.resolve(expectedCliEntryBeforeInstall) === currentCliEntry
    : false;

  if (dryRun) {
    const simulatedCliEntry = expectedCliEntryBeforeInstall
      ?? path.join(getHomeDir(), ".npm-global", "node_modules", context.packageName, "dist", "cli.js");
    return {
      cliEntryPath: simulatedCliEntry,
      installed: !alreadyInstalled
    };
  }

  if (!alreadyInstalled) {
    console.log(`Installing ${context.packageName}@^${context.packageVersion.split(".")[0]} globally...`);
    const installResult = await runCommand(
      npmExecutable(),
      ["install", "-g", `${context.packageName}@^${context.packageVersion.split(".")[0]}`],
      { stdio: "inherit" }
    );

    if (installResult.code !== 0) {
      throw new Error("Failed to install the markdown-go CLI globally.");
    }
  } else {
    console.log("Reusing the existing global markdown-go CLI installation.");
  }

  const globalRoot = await getGlobalNodeModulesRoot();
  const cliEntryPath = path.join(globalRoot, context.packageName, "dist", "cli.js");
  if (!fs.existsSync(cliEntryPath)) {
    throw new Error(`The installed CLI entrypoint was not found at ${cliEntryPath}.`);
  }

  const versionCheck = await runCommand("node", [cliEntryPath, "--version"]);
  if (versionCheck.code !== 0) {
    throw new Error(versionCheck.stderr || "The installed markdown-go CLI could not be executed.");
  }

  if (!compareMajorVersions(context.packageVersion, versionCheck.stdout)) {
    throw new Error(`Installed CLI version ${versionCheck.stdout} is incompatible with expected major ${context.packageVersion.split(".")[0]}.`);
  }

  return {
    cliEntryPath,
    installed: !alreadyInstalled
  };
}

function installSkillIntoTarget(options: {
  dryRun: boolean;
  force: boolean;
  renderedSkill: string;
  target: ToolTarget;
  templateDir: string;
}) {
  const skillInstallDir = resolveSkillInstallDir(options.target);

  if (fs.existsSync(skillInstallDir)) {
    if (!options.force) {
      return {
        label: options.target.label,
        skillInstallDir,
        status: "skipped" as const
      };
    }

    if (!options.dryRun) {
      fs.rmSync(skillInstallDir, { recursive: true, force: true });
    }
  }

  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(skillInstallDir), { recursive: true });
    fs.cpSync(options.templateDir, skillInstallDir, { recursive: true });
    fs.writeFileSync(path.join(skillInstallDir, "SKILL.md"), options.renderedSkill, "utf-8");
  }

  return {
    label: options.target.label,
    skillInstallDir,
    status: "installed" as const
  };
}

export async function runInstallSkillCommand(context: InstallContext) {
  const { values } = parseArgs({
    args: context.args,
    options: {
      "dry-run": { type: "boolean" },
      force: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      tool: { type: "string", multiple: true }
    },
    strict: true,
    allowPositionals: false
  });

  if (values.help) {
    printInstallUsage(context.packageVersion);
    return;
  }

  assertNodeVersion();
  const npmVersion = await ensureNpmAvailable();
  const templateDir = resolveTemplateDir(context.packageRoot);
  const dryRun = Boolean(values["dry-run"]);
  const toolSelection = normalizeToolSelection(values.tool);
  const targets = getToolTargets();

  let selectedTargets: ToolTarget[] = [];
  if (toolSelection.mode === "auto") {
    selectedTargets = Object.values(targets).filter(isDetectedTool);
    if (selectedTargets.length === 0) {
      throw new Error("No supported tool environment was detected. Re-run with --tool codex|claude|cursor|antigravity|all.");
    }
  } else if (toolSelection.mode === "all") {
    selectedTargets = supportedTools.map((tool) => targets[tool]);
  } else {
    selectedTargets = toolSelection.tools.map((tool) => targets[tool]);
  }

  console.log(`Detected Node.js ${process.versions.node} and npm ${npmVersion}.`);
  console.log(`Installing markdown-go skill into: ${selectedTargets.map((target) => target.label).join(", ")}`);

  const { cliEntryPath, installed } = await ensureCliInstall(context, dryRun);
  const renderedSkill = renderSkillTemplate(templateDir, buildCliInvocation(cliEntryPath));
  const results = selectedTargets.map((target) => installSkillIntoTarget({
    dryRun,
    force: Boolean(values.force),
    renderedSkill,
    target,
    templateDir
  }));

  for (const result of results) {
    if (result.status === "installed") {
      console.log(`${dryRun ? "Would install" : "Installed"} skill for ${result.label}: ${result.skillInstallDir}`);
    } else {
      console.log(`Skipped ${result.label}: ${result.skillInstallDir} already exists (use --force to overwrite).`);
    }
  }

  if (installed) {
    console.log(`${dryRun ? "Would pin" : "Pinned"} CLI runtime: ${cliEntryPath}`);
  }

  console.log(dryRun ? "Dry run complete." : "Install complete. Restart the target tools to pick up the new skill.");
}




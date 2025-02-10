import chalk from "chalk";
import ora, { type Ora } from "ora";
import * as path from "path";
import fs from "node:fs/promises";
import OpenAI from "openai";
import { $, type ShellPromise } from "bun";
import { parseArgs } from "util";

const {
  values: { model, benchmark },
} = parseArgs({
  args: Bun.argv,
  options: {
    model: {
      type: "string",
      default: "google/gemini-2.0-flash-001",
    },
    benchmark: {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;
  if (obj1 === null || obj2 === null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(
    (key) => keys2.includes(key) && deepEqual(obj1[key], obj2[key]),
  );
}

export interface Task {
  id: string;
  language: string;
  extension: string;
  tests: {
    input: string;
    expectedOutput: string;
    ext: TestcaseExt;
  }[];
  prompt: string;
  dir: string;
}

type TestcaseExt = "json" | "txt";

export interface TaskResult {
  passed: boolean;
  error?: string;
  warnings?: string[];
  score?: number;
}

export async function loadTasks(): Promise<Task[]> {
  const tasksDir = "./tasks";
  const taskDirs = await fs.readdir(tasksDir);
  const tasks: Task[] = [];

  for (const taskDir of taskDirs) {
    const fullTaskDir = path.join(tasksDir, taskDir);
    if (!(await fs.stat(fullTaskDir)).isDirectory()) {
      continue;
    }

    const id = taskDir;
    const language = taskDir.split("_")[1];

    const testsDir = path.join(fullTaskDir, "tests");
    const tests: { input: string; expectedOutput: string; ext: TestcaseExt }[] =
      [];

    if (
      await fs
        .stat(testsDir)
        .then((stat) => stat.isDirectory())
        .catch(() => false)
    ) {
      const testCaseDirs = await fs.readdir(testsDir);

      for (const testCaseDir of testCaseDirs) {
        const fullTestCaseDir = path.join(testsDir, testCaseDir);
        if (!(await fs.stat(fullTestCaseDir)).isDirectory()) {
          continue;
        }

        const [_, input] = await loadFileContent(
          path.join(fullTestCaseDir, "input"),
        );
        const [ext, expectedOutput] = await loadFileContent(
          path.join(fullTestCaseDir, "expected_output"),
        );
        tests.push({ input, expectedOutput, ext });
      }
    } else {
      const [_, input] = await loadFileContent(path.join(fullTaskDir, "input"));
      const [ext, expectedOutput] = await loadFileContent(
        path.join(fullTaskDir, "expected_output"),
      );
      tests.push({ input, expectedOutput, ext });
    }

    const prompt = await Bun.file(path.join(fullTaskDir, "prompt.md")).text();

    let extension = "";
    switch (language) {
      case "rust":
        extension = "rs";
        break;
      case "c":
        extension = "c";
        break;
      case "zig":
        extension = "zig";
        break;
      case "python":
        extension = "py";
        break;
      case "typescript":
        extension = "ts";
        break;
    }

    tasks.push({
      id,
      language,
      extension,
      tests,
      prompt,
      dir: path.join(fullTaskDir, "output"),
    });
  }

  return tasks.sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

async function loadFileContent(
  filePath: string,
): Promise<[TestcaseExt, string]> {
  const extensions = ["json", "txt"] as const;
  for (const ext of extensions) {
    const fullPath = filePath + "." + ext;
    try {
      if (
        await fs
          .stat(fullPath)
          .then((stat) => stat.isFile())
          .catch(() => false)
      ) {
        return [ext, await fs.readFile(fullPath, "utf-8")];
      }
    } catch (error) {
      // File doesn't exist, try next extension
    }
  }
  throw new Error(`No input or expected_output file found for ${filePath}`);
}

export async function runTask(
  task: Task,
  generated: LLMResponse,
): Promise<TaskResult> {
  const solutionFile =
    task.language === "rust" ? `src/main.rs` : `solution.${task.extension}`;

  const generatedCode = generated.code
    .replace(/```[\s\S]*?\n/g, "")
    .replace(/```/g, "");

  await Bun.write(path.join(task.dir, solutionFile), generatedCode, {
    createPath: true,
  });

  let buildResult: { warnings?: string[]; error?: string } = {};

  try {
    await installDependencies(task, generated);
    if (["c", "rust", "zig"].includes(task.language)) {
      buildResult = await buildCode(task, solutionFile, generated);
      if (buildResult.error) {
        return {
          passed: false,
          error: `Build failed: ${buildResult.error}`,
        };
      }
    }

    let allPassed = true;
    const allWarnings: string[] = [...(buildResult.warnings || [])];

    for (const testCase of task.tests) {
      const { stdout, stderr, exitCode } = await executeCode(
        task,
        solutionFile,
        testCase.input,
      );

      if (stderr) {
        allWarnings.push(...parseWarnings(task.language, stderr));
      }

      if (exitCode !== 0) {
        allPassed = false;
      }
      if (testCase.ext === "json") {
        const expected = JSON.parse(testCase.expectedOutput);
        const actual = JSON.parse(stdout.trim());
        allPassed = deepEqual(expected, actual);
      } else if (stdout.trim() !== testCase.expectedOutput.trim()) {
        allPassed = false;
      }
    }

    return {
      passed: allPassed,
      warnings: allWarnings,
    };
  } catch (error: any) {
    return { passed: false, error: error.message };
  } finally {
    await cleanup(task);
  }
}

async function installDependencies(
  task: Task,
  generated: LLMResponse,
): Promise<void> {
  if (generated.dependencies && generated.dependencies.length > 0) {
    switch (task.language) {
      case "python":
        const requirementsTxt = generated.dependencies.join("\n");
        await $`uv venv`.quiet().cwd(task.dir);
        await Bun.write(
          path.join(task.dir, "requirements.txt"),
          requirementsTxt,
        );
        let install = await $`uv pip install -r requirements.txt`
          .quiet()
          .cwd(task.dir)
          .env({ ...process.env, VIRTUAL_ENV: ".venv" });
        if (install.exitCode !== 0) {
          throw new Error("Dependency Installation Failed:" + install.stderr);
        }
        break;
      case "typescript":
        const packageJsonContent = {
          dependencies: generated.dependencies.reduce(
            (acc: any, dep: string) => {
              const [name, version] = dep.split("@");
              acc[name] = version || "latest";
              return acc;
            },
            {},
          ),
        };
        await Bun.write(
          path.join(task.dir, "package.json"),
          JSON.stringify(packageJsonContent, null, 2),
        );
        const bunInstall = await $`bun install`.quiet().cwd(task.dir);
        if (bunInstall.exitCode !== 0) {
          throw new Error(
            "Dependency Installation Failed:" + bunInstall.stderr,
          );
        }
        break;
    }
  }
  if (task.language === "rust") {
    const cargoTomlContent = `
[package]
name = "${task.id.replace(/[^a-zA-Z0-9_]/g, "_")}"  # Ensure valid package name
version = "0.1.0"
edition = "2021"

[dependencies]
${generated.dependencies.join("\n")}
`;
    const srcDir = path.join(task.dir, "src");
    await fs.mkdir(srcDir, { recursive: true });
    await Bun.write(path.join(task.dir, "Cargo.toml"), cargoTomlContent);
  }
}

function parseWarnings(language: string, stderr: string): string[] {
  const warnings: string[] = [];
  const lines = stderr.split("\n");

  switch (language) {
    case "c":
      // GCC/Clang warning format:  `filename:line:column: warning: message`
      const cRegex = /.*:\d+:\d+:\s+warning:\s+(.*)/;
      for (const line of lines) {
        const match = line.match(cRegex);
        if (match) {
          warnings.push(match[1].trim());
        }
      }
      break;
    case "rust":
      // Rustc warning format: `warning: message` (usually with --> file:line:col)
      const rustRegex = /warning:\s+(.*)/;
      for (const line of lines) {
        const match = line.match(rustRegex);
        if (match) {
          warnings.push(match[1].trim());
        }
      }
      break;
    case "zig":
      // Zig warning format:  `filename:line:column: warning: message`
      const zigRegex = /.*:\d+:\d+:\s+warning:\s+(.*)/;
      for (const line of lines) {
        const match = line.match(zigRegex);
        if (match) {
          warnings.push(match[1].trim());
        }
      }
      break;
  }

  return warnings;
}

async function buildCode(
  task: Task,
  solutionFile: string,
  generated: LLMResponse,
): Promise<{ warnings?: string[]; error?: string }> {
  try {
    let build: ShellPromise;

    switch (task.language) {
      case "c":
        const cFlags = generated.compile_flags || [];
        build = $`clang ${solutionFile} -o ${solutionFile.replace(".c", "")} ${cFlags.join(" ")} -Wall -Wextra`;
        break;
      case "rust":
        build = $`cargo build --release`;
        break;
      case "zig":
        build = $`zig build-exe ${solutionFile} -O ReleaseFast`;
        break;
      default:
        return {
          error: `Unsupported language for compilation: ${task.language}`,
        };
    }

    const { stderr, exitCode } = await build.quiet().cwd(task.dir);
    if (exitCode !== 0) {
      return { error: stderr.toString() };
    }

    const warnings = parseWarnings(task.language, stderr.toString());
    if (exitCode !== 0) {
      return { error: stderr.toString(), warnings };
    }
    return { warnings };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function executeCode(
  task: Task,
  solutionFile: string,
  testInput: string,
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  let command: ShellPromise;

  switch (task.language) {
    case "typescript":
      command = $`echo ${testInput} | bun run ${solutionFile}`;
      break;
    case "python":
      command = $`echo ${testInput} | .venv/bin/python ${solutionFile}`;
      break;
    case "c":
      command = $`echo ${testInput} | ./${path.basename(solutionFile, ".c")}`;
      break;
    case "rust":
      command = $`echo ${testInput} | target/release/${task.id}`;
      break;
    case "zig":
      command = $`echo ${testInput} | ./${path.basename(solutionFile, ".zig")}`;
      break;
    default:
      throw new Error(`Unsupported language for execution: ${task.language}`);
  }

  const { stdout, stderr, exitCode } = await command.quiet().cwd(task.dir);

  return {
    stdout: stdout.toString(),
    stderr: stderr.toString(),
    exitCode,
  };
}

async function cleanup(task: Task): Promise<void> {
  try {
    await fs.rm(task.dir, { recursive: true, force: true });
  } catch (error) {
    if (!benchmark) console.error(`Error during cleanup: ${error}`);
  }
}

export function generateReport(results: { [key: string]: TaskResult }) {
  if (!benchmark) console.log(chalk.bold("\n--- Benchmark Results ---"));
  for (const [taskId, result] of Object.entries(results)) {
    const status = result.passed ? chalk.green("PASSED") : chalk.red("FAILED");
    const error = result.error ? `Error: ${result.error}` : "";
    const warnings = result.warnings?.length
      ? `\n${chalk.yellow("Warnings:")}\n${result.warnings.map((w) => `  - ${w}`).join("\n")}`
      : "";
    if (!benchmark) console.log(`- ${taskId}: ${status} ${error} ${warnings}`);
  }

  const passedCount = Object.values(results).filter((r) => r.passed).length;
  const totalCount = Object.keys(results).length;
  const passRate = (passedCount / totalCount) * 100;
  if (!benchmark)
    console.log(
      chalk.bold(
        `\nPass Rate: ${passRate.toFixed(2)}% (${passedCount}/${totalCount})`,
      ),
    );
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: Bun.env.OPENROUTER_API_KEY,
});

type LLMResponse = {
  code: string;
  dependencies: string[];
  compile_flags: string[];
};

export async function queryLLM(
  task: Task,
  model: string,
): Promise<LLMResponse | undefined> {
  try {
    const chatCompletion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a coding assistant who generates code based on the task and follows every instruction. The user will pass the input through STDIN. Output the code, dependencies and compile flags (only for C) separated by '---===---'. Do NOT include code fences (\`\`\`).
          Example output (Python):
          import util
          print("hello")
          ---===---
          util
          argparse
          ---===---`,
        },
        {
          role: "user",
          content: task.prompt,
        },
      ],
    });

    if (!chatCompletion) {
      return undefined;
    }

    let generated_response = chatCompletion.choices[0].message.content;
    if (!generated_response) {
      return undefined;
    }
    generated_response = generated_response
      .replace(/```[\s\S]*?\n/g, "")
      .replace(/```/g, "");

    // console.log(chalk.grey(JSON.stringify(generated_response, null, 2)));

    const [code, dependenciesStr, compileFlagsStr] =
      generated_response.split("---===---");
    const dependencies = dependenciesStr
      ? dependenciesStr.split("\n").filter(Boolean)
      : [];
    const compile_flags = compileFlagsStr
      ? compileFlagsStr.split(/\s+/).filter(Boolean)
      : [];

    return { code, dependencies, compile_flags };
  } catch (error) {
    throw error;
  }
}

async function main() {
  // @ts-expect-error
  let spinner: Ora = null;
  if (!benchmark) spinner = ora("Loading tasks...").start();
  const startTime = performance.now();
  let executionTime = 0;
  const tasks = await loadTasks();
  if (!benchmark) spinner.succeed(chalk.green(`Loaded ${tasks.length} tasks.`));

  if (!benchmark)
    console.log(chalk.grey("Model chosen:"), chalk.bgGreen(model));

  const results: { [key: string]: any } = {};

  for (const task of tasks) {
    if (!benchmark)
      spinner.start(chalk.blue(`Running task: ${task.id} (${task.language})`));

    try {
      const generatedCode = await queryLLM(task, model);

      if (!generatedCode) {
        if (!benchmark)
          spinner.fail(
            chalk.red(`LLM failed to generate code for task: ${task.id}`),
          );
        results[task.id] = { passed: false, error: "LLM failure" };
        continue;
      }

      const { passed, error } = await runTask(task, generatedCode);
      executionTime = performance.now() - startTime;

      if (passed) {
        if (!benchmark)
          spinner.succeed(
            chalk.green(
              `Task ${task.id} passed! Time: ${executionTime.toFixed(2)}ms`,
            ),
          );
      } else {
        if (!benchmark) spinner.fail(chalk.red(`Task ${task.id}`));
      }

      results[task.id] = { passed, executionTime, error };
    } catch (err: any) {
      if (!benchmark)
        spinner.fail(
          chalk.red(`Error running task ${task.id}: ${err.message}`),
        );
      results[task.id] = { passed: false, error: err.message };
    }
  }

  if (!benchmark) {
    generateReport(results);
  } else {
    const passedCount = Object.values(results).filter((r) => r.passed).length;
    console.log(`${passedCount}:${executionTime}`);
  }
}

main();

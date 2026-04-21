import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

async function listJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listJsFiles(full)));
    } else if (entry.isFile() && full.endsWith(".js")) {
      out.push(full);
    }
  }
  return out;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function main() {
  const srcFiles = await listJsFiles(path.resolve("src"));
  for (const file of srcFiles) {
    await run("node", ["--check", file]);
  }
  await run("node", [path.resolve("scripts/save-migration.test.mjs")]);
  await run("node", [path.resolve("scripts/smoke-runtime.test.mjs")]);
  console.log("quality gates passed");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

import { spawnSync } from "node:child_process"

function runStep(command: string, args: string[], title: string) {
  console.log(`\n=== ${title} ===`)
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  })

  if (result.error) {
    throw new Error(`${title} failed: ${result.error.message}`)
  }

  if (result.status !== 0) {
    throw new Error(`${title} failed with exit code ${result.status}`)
  }
}

function runNpmScript(scriptName: string, title: string) {
  const npmExecPath = process.env.npm_execpath
  if (!npmExecPath) {
    throw new Error("npm_execpath is not available in environment")
  }

  runStep(process.execPath, [npmExecPath, "run", scriptName], title)
}

async function main() {
  console.log("ProPangkat backend/database recovery started...")

  runNpmScript("db:generate", "Generate Prisma Client")
  runNpmScript("db:reset", "Reset and apply migrations")
  runNpmScript("db:seed", "Seed baseline master data")
  runNpmScript("db:sample", "Seed sample transactional data")
  runNpmScript("db:health", "Run DB health check")

  console.log("\nRecovery completed successfully.")
  console.log("Next: run npm run start:devops for backend + runtime monitor.")
}

main().catch((err) => {
  console.error("Recovery failed:", err.message || err)
  process.exit(1)
})

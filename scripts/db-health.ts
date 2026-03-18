import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type CountMap = {
  users: number
  unitKerja: number
  proposals: number
  proposalDocuments: number
  timelines: number
  documentRequirements: number
  activityLogs: number
  notifications: number
}

async function getCounts(): Promise<CountMap> {
  const [
    users,
    unitKerja,
    proposals,
    proposalDocuments,
    timelines,
    documentRequirements,
    activityLogs,
    notifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.unitKerja.count(),
    prisma.promotionProposal.count(),
    prisma.proposalDocument.count(),
    prisma.timeline.count(),
    prisma.documentRequirement.count(),
    prisma.activityLog.count(),
    prisma.notification.count(),
  ])

  return {
    users,
    unitKerja,
    proposals,
    proposalDocuments,
    timelines,
    documentRequirements,
    activityLogs,
    notifications,
  }
}

async function runIntegrityChecks() {
  const [
    proposalsWithoutDocs,
    inactiveTimelines,
    usersWithoutUnit,
  ] = await Promise.all([
    prisma.promotionProposal.count({ where: { documents: { none: {} } } }),
    prisma.timeline.count({ where: { isActive: false } }),
    prisma.user.count({ where: { role: "PEGAWAI", unitKerjaId: null } }),
  ])

  return {
    proposalsWithoutDocs,
    inactiveTimelines,
    usersWithoutUnit,
  }
}

async function main() {
  console.log("=== ProPangkat DB Health Check ===")

  const dbVersionResult = await prisma.$queryRaw<Array<{ version: string }>>`
    SELECT version()
  `
  const dbVersion = dbVersionResult[0]?.version || "unknown"

  console.log(`Database connected: ${dbVersion}`)

  const counts = await getCounts()
  console.table(counts)

  const checks = await runIntegrityChecks()
  console.table(checks)

  const criticalIssues: string[] = []

  if (counts.users === 0) criticalIssues.push("No users found")
  if (counts.documentRequirements === 0) criticalIssues.push("No document requirements found")
  if (counts.timelines === 0) criticalIssues.push("No timeline data found")
  if (checks.usersWithoutUnit > 0) {
    criticalIssues.push(`Pegawai without unitKerja relation: ${checks.usersWithoutUnit}`)
  }

  if (criticalIssues.length > 0) {
    console.error("Health check failed:")
    for (const issue of criticalIssues) {
      console.error(`- ${issue}`)
    }
    process.exitCode = 1
    return
  }

  console.log("Health check passed.")
}

main()
  .catch((err) => {
    console.error("Health check error:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

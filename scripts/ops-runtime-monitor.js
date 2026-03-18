const http = require("http")
const net = require("net")
const os = require("os")
const fs = require("fs")
const { spawn } = require("child_process")

const APP_PORT_REQUESTED = Number(process.env.PORT || 3000)
const MONITOR_PORT_REQUESTED = Number(process.env.MONITOR_PORT || 3030)
const START_MODE = (process.env.START_MODE || "prod").toLowerCase()
const KEEP_ALIVE = process.env.MONITOR_KEEP_ALIVE === "true"
const MAX_LOGS = 3000
const DASHBOARD_WIDTH = 104

const NEXT_CLI = require.resolve("next/dist/bin/next")

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  blue: "\x1b[94m",
  magenta: "\x1b[95m",
  green: "\x1b[92m",
  yellow: "\x1b[93m",
  red: "\x1b[91m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
}

const runtime = {
  appPort: APP_PORT_REQUESTED,
  monitorPort: MONITOR_PORT_REQUESTED,
  networkIp: null,
}

const state = {
  startedAt: Date.now(),
  app: {
    pid: null,
    status: "starting",
    mode: START_MODE,
    restarts: 0,
    lastExitCode: null,
  },
  cpuPercent: 0,
  mem: {
    total: 0,
    free: 0,
    used: 0,
    usedPercent: 0,
  },
  disk: {
    total: 0,
    free: 0,
    used: 0,
    usedPercent: 0,
  },
  logs: [],
}

let nonTtyDashboardPrinted = false

function color(text, ansi) {
  return `${ansi}${text}${ANSI.reset}`
}

function stripAnsi(input) {
  return String(input).replace(/\u001b\[[0-9;]*m/g, "")
}

function fmtBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exp)
  return `${value.toFixed(1)} ${units[exp]}`
}

function pad(input, width) {
  const text = String(input)
  const plain = stripAnsi(text)
  if (plain.length >= width) return text
  return text + " ".repeat(width - plain.length)
}

function truncate(input, width) {
  const text = String(input)
  const plain = stripAnsi(text)
  if (plain.length <= width) return text
  return plain.slice(0, Math.max(0, width - 3)) + "..."
}

function bar(percent, width, ansiColor) {
  const ratio = Math.max(0, Math.min(100, Number(percent || 0)))
  const fill = Math.round((ratio / 100) * width)
  const raw = "#".repeat(fill) + "-".repeat(Math.max(0, width - fill))
  return color(raw, ansiColor)
}

function pushLog(level, message) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message: stripAnsi(String(message)),
  }

  state.logs.push(entry)
  if (state.logs.length > MAX_LOGS) {
    state.logs.splice(0, state.logs.length - MAX_LOGS)
  }
}

function parseLines(streamName, chunk) {
  const text = chunk.toString("utf8")
  const lines = text.split(/\r?\n/).filter(Boolean)
  for (const line of lines) {
    pushLog(streamName, line)
  }
}

function getCpuSnapshot() {
  const cpus = os.cpus()
  let idle = 0
  let total = 0

  for (const cpu of cpus) {
    const times = cpu.times
    idle += times.idle
    total += times.user + times.nice + times.sys + times.irq + times.idle
  }

  return { idle, total }
}

let lastCpu = getCpuSnapshot()

async function updateMetrics() {
  const currentCpu = getCpuSnapshot()
  const idleDiff = currentCpu.idle - lastCpu.idle
  const totalDiff = currentCpu.total - lastCpu.total
  state.cpuPercent = totalDiff > 0 ? Number((((totalDiff - idleDiff) / totalDiff) * 100).toFixed(2)) : 0
  lastCpu = currentCpu

  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  state.mem = {
    total: totalMem,
    free: freeMem,
    used: usedMem,
    usedPercent: Number(((usedMem / totalMem) * 100).toFixed(2)),
  }

  try {
    const stat = await fs.promises.statfs(process.cwd())
    const total = Number(stat.blocks) * Number(stat.bsize)
    const free = Number(stat.bfree) * Number(stat.bsize)
    const used = total - free
    state.disk = {
      total,
      free,
      used,
      usedPercent: total > 0 ? Number(((used / total) * 100).toFixed(2)) : 0,
    }
  } catch (err) {
    pushLog("warn", `Disk metrics unavailable: ${err.message || err}`)
  }
}

function getPrimaryIPv4() {
  const interfaces = os.networkInterfaces()
  for (const key of Object.keys(interfaces)) {
    const list = interfaces[key] || []
    for (const item of list) {
      if (item && item.family === "IPv4" && !item.internal) {
        return item.address
      }
    }
  }
  return null
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}h ${m}m ${s}s`
}

function makeBox(title, lines, width = DASHBOARD_WIDTH) {
  const top = `+${"-".repeat(width - 2)}+`
  const titleText = ` ${title} `
  const header = `|${pad(titleText, width - 2)}|`
  const body = lines
    .map((line) => `|${pad(truncate(line, width - 2), width - 2)}|`)
    .join("\n")
  return `${top}\n${header}\n${top}\n${body}\n${top}`
}

function renderCliDashboard() {
  const uptimeSec = Math.floor((Date.now() - state.startedAt) / 1000)
  const appUptime = formatDuration(uptimeSec)
  const hostUptime = formatDuration(os.uptime())
  const modeText = state.app.mode === "dev" ? color("DEVELOPMENT", ANSI.yellow) : color("PRODUCTION", ANSI.green)
  const statusColor = state.app.status === "running" ? ANSI.green : state.app.status === "starting" ? ANSI.yellow : ANSI.red
  const statusText = color(state.app.status.toUpperCase(), statusColor)

  const localBase = `http://localhost:${runtime.appPort}`
  const networkBase = runtime.networkIp ? `http://${runtime.networkIp}:${runtime.appPort}` : "N/A"
  const monitorBase = `http://localhost:${runtime.monitorPort}`

  const asciiTitle = [
    color(" ____            ____                        _              _   ", ANSI.blue),
    color("|  _ \\ _ __ ___ |  _ \\ __ _ _ __   __ _  __| | __ _ _ __ | |_ ", ANSI.cyan),
    color("| |_) | '__/ _ \\| |_) / _` | '_ \\ / _` |/ _` |/ _` | '_ \\| __|", ANSI.magenta),
    color("|  __/| | | (_) |  __/ (_| | | | | (_| | (_| | (_| | | | | |_ ", ANSI.yellow),
    color("|_|   |_|  \\___/|_|   \\__,_|_| |_|\\__, |\\__,_|\\__,_|_| |_|\\__|", ANSI.green),
    color("                                     |___/                        ", ANSI.green),
    color("Versi Tahun 2026 - Smart Promotion Management Platform", ANSI.white),
  ]

  const urlsBox = makeBox(
    color("URL ENDPOINTS", ANSI.cyan),
    [
      `${color("Local", ANSI.white)}          : ${color(localBase, ANSI.green)}`,
      `${color("Network", ANSI.white)}        : ${color(networkBase, ANSI.green)}`,
      `${color("API Swagger UI", ANSI.white)} : ${color(localBase + "/api-docs", ANSI.green)}`,
      `${color("Database Web UI", ANSI.white)}: ${color(localBase + "/database-ui", ANSI.green)}`,
      `${color("Runtime Monitor", ANSI.white)}: ${color(monitorBase, ANSI.green)}`,
      `${color("API Base", ANSI.white)}      : ${color(localBase + "/api", ANSI.green)}`,
    ]
  )

  const statusBox = makeBox(
    color("SERVER STATUS (LIVE)", ANSI.cyan),
    [
      `${color("Mode", ANSI.white)}: ${modeText}    ${color("Status", ANSI.white)}: ${statusText}    ${color("PID", ANSI.white)}: ${state.app.pid || "-"}`,
      `${color("CPU", ANSI.white)} : ${pad(state.cpuPercent.toFixed(2) + "%", 7)} ${bar(state.cpuPercent, 26, ANSI.red)}`,
      `${color("RAM", ANSI.white)} : ${pad(state.mem.usedPercent.toFixed(2) + "%", 7)} ${bar(state.mem.usedPercent, 26, ANSI.yellow)} ${fmtBytes(state.mem.used)}/${fmtBytes(state.mem.total)}`,
      `${color("Disk", ANSI.white)}: ${pad(state.disk.usedPercent.toFixed(2) + "%", 7)} ${bar(state.disk.usedPercent, 26, ANSI.magenta)} ${fmtBytes(state.disk.used)}/${fmtBytes(state.disk.total)}`,
      `${color("App Uptime", ANSI.white)}: ${appUptime}    ${color("Host Uptime", ANSI.white)}: ${hostUptime}`,
      `${color("Updated", ANSI.white)}: ${new Date().toLocaleString("id-ID")}`,
    ]
  )

  const logs = state.logs.slice(-4).map((l) => {
    const levelColor = l.level.includes("err") ? ANSI.red : l.level.includes("warn") ? ANSI.yellow : ANSI.gray
    const msg = truncate(l.message, DASHBOARD_WIDTH - 34)
    return `${color(`[${l.level.toUpperCase()}]`, levelColor)} ${l.ts} ${msg}`
  })

  const logsBox = makeBox(color("LAST SERVER LOGS", ANSI.cyan), logs.length ? logs : [color("(no logs yet)", ANSI.gray)])

  const output = [
    ...asciiTitle,
    "",
    urlsBox,
    "",
    statusBox,
    "",
    logsBox,
  ].join("\n")

  if (process.stdout.isTTY) {
    process.stdout.write("\x1b[H\x1b[2J")
    process.stdout.write("\x1b[?25l")
    process.stdout.write(output)
  } else {
    if (!nonTtyDashboardPrinted) {
      nonTtyDashboardPrinted = true
      process.stdout.write(`${output}\n`)
      process.stdout.write("Live terminal dashboard requires TTY; web monitor remains available.\n")
    }
  }
}

function monitorHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ProPangkat Ops Monitor</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; }
  .card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 14px; }
  .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
  .value { margin-top: 4px; font-size: 22px; font-weight: 700; }
  .muted { color: #94a3b8; font-size: 12px; }
  pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.5; }
  .logs { max-height: 560px; overflow: auto; }
  .ok { color: #22c55e; }
  .warn { color: #f59e0b; }
  .err { color: #ef4444; }
</style>
</head>
<body>
  <div class="wrap">
    <h1 style="margin:0 0 8px;">ProPangkat Runtime Monitor</h1>
    <p class="muted" style="margin:0 0 16px;">CPU, RAM, Disk, status aplikasi, dan live server logs.</p>

    <section class="grid" id="metrics"></section>

    <section class="card" style="margin-top:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong>Server Logs</strong>
        <span class="muted">Auto refresh 2s</span>
      </div>
      <div class="logs"><pre id="logPanel">Loading logs...</pre></div>
    </section>
  </div>

<script>
const metricsEl = document.getElementById("metrics")
const logPanel = document.getElementById("logPanel")

function card(label, value, extra) {
  return '<div class="card"><div class="label">' + label + '</div><div class="value">' + value + '</div><div class="muted">' + (extra || '') + '</div></div>'
}

async function refresh() {
  try {
    const [m, l] = await Promise.all([
      fetch('/api/metrics').then(r => r.json()),
      fetch('/api/logs?limit=250').then(r => r.json()),
    ])

    const appStateClass = m.app.status === 'running' ? 'ok' : (m.app.status === 'starting' ? 'warn' : 'err')

    metricsEl.innerHTML = [
      card('App Status', '<span class="' + appStateClass + '">' + m.app.status + '</span>', 'PID: ' + (m.app.pid || '-') + ' | Mode: ' + m.app.mode),
      card('CPU Usage', String(m.cpuPercent) + '%', 'System total usage'),
      card('RAM Usage', String(m.memory.usedPercent) + '%', m.memory.usedHuman + ' / ' + m.memory.totalHuman),
      card('Disk Usage', String(m.disk.usedPercent) + '%', m.disk.usedHuman + ' / ' + m.disk.totalHuman),
      card('Host Uptime', m.hostUptime, 'Platform: ' + m.platform),
      card('App Uptime', m.appUptime, 'Restarts: ' + m.app.restarts),
    ].join('')

    const lines = (l.logs || []).map(x => '[' + x.ts + '] [' + x.level.toUpperCase() + '] ' + x.message)
    logPanel.textContent = lines.join('\n') || 'No logs yet'
    logPanel.parentElement.scrollTop = logPanel.parentElement.scrollHeight
  } catch (err) {
    logPanel.textContent = 'Failed loading monitor data: ' + (err.message || err)
  }
}

refresh()
setInterval(refresh, 2000)
</script>
</body>
</html>`
}

function buildUrls() {
  const localBase = `http://localhost:${runtime.appPort}`
  const networkBase = runtime.networkIp ? `http://${runtime.networkIp}:${runtime.appPort}` : null
  const monitorBase = `http://localhost:${runtime.monitorPort}`

  return {
    localBase,
    networkBase,
    monitorBase,
    swagger: `${localBase}/api-docs`,
    databaseUI: `${localBase}/database-ui`,
    apiBase: `${localBase}/api`,
  }
}

const monitorServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${runtime.monitorPort}`)

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(monitorHtml())
    return
  }

  if (url.pathname === "/api/metrics") {
    const hostUptime = formatDuration(os.uptime())
    const appUptime = formatDuration((Date.now() - state.startedAt) / 1000)

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(
      JSON.stringify({
        success: true,
        platform: `${os.platform()} ${os.arch()}`,
        hostUptime,
        appUptime,
        cpuPercent: state.cpuPercent,
        memory: {
          ...state.mem,
          totalHuman: fmtBytes(state.mem.total),
          freeHuman: fmtBytes(state.mem.free),
          usedHuman: fmtBytes(state.mem.used),
        },
        disk: {
          ...state.disk,
          totalHuman: fmtBytes(state.disk.total),
          freeHuman: fmtBytes(state.disk.free),
          usedHuman: fmtBytes(state.disk.used),
        },
        app: state.app,
      })
    )
    return
  }

  if (url.pathname === "/api/logs") {
    const limit = Math.max(1, Math.min(2000, Number(url.searchParams.get("limit") || 200)))
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify({ success: true, logs: state.logs.slice(-limit) }))
    return
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify({ success: false, message: "Not found" }))
})

function startNextApp() {
  const args = START_MODE === "dev" ? ["dev", "-p", String(runtime.appPort)] : ["start", "-p", String(runtime.appPort)]

  state.app.status = "starting"
  pushLog("info", `Starting Next.js with mode=${START_MODE} port=${runtime.appPort}`)

  const appProcess = spawn(process.execPath, [NEXT_CLI, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  })

  state.app.pid = appProcess.pid

  appProcess.stdout.on("data", (chunk) => parseLines("stdout", chunk))
  appProcess.stderr.on("data", (chunk) => parseLines("stderr", chunk))

  appProcess.on("spawn", () => {
    state.app.status = "running"
    pushLog("info", `App process started with PID ${appProcess.pid}`)
  })

  appProcess.on("exit", (code, signal) => {
    state.app.status = "stopped"
    state.app.lastExitCode = code
    state.app.pid = null
    pushLog("error", `App process exited code=${code} signal=${signal || "none"}`)

    if (!KEEP_ALIVE) {
      cleanupTerminal()
      setTimeout(() => process.exit(code || 0), 300)
    }
  })

  return appProcess
}

function cleanupTerminal() {
  if (process.stdout.isTTY) {
    process.stdout.write("\x1b[0m\x1b[?25h\n")
  }
}

function setupShutdown(appProcess) {
  const shutdown = (signal) => {
    pushLog("warn", `Received ${signal}, shutting down monitor...`)

    try {
      if (appProcess && !appProcess.killed) {
        appProcess.kill("SIGTERM")
      }
    } catch (err) {
      pushLog("error", `Failed stopping app process: ${err.message || err}`)
    }

    monitorServer.close(() => {
      cleanupTerminal()
      process.exit(0)
    })

    setTimeout(() => {
      cleanupTerminal()
      process.exit(0)
    }, 1000)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

function reservePort(preferredPort) {
  return new Promise((resolve) => {
    const tester = net.createServer()
    tester.unref()

    tester.once("error", () => {
      resolve(reservePort(preferredPort + 1))
    })

    tester.once("listening", () => {
      const address = tester.address()
      const port = typeof address === "object" && address ? address.port : preferredPort
      tester.close(() => resolve(port))
    })

    tester.listen(preferredPort, "0.0.0.0")
  })
}

async function main() {
  runtime.appPort = await reservePort(APP_PORT_REQUESTED)
  runtime.monitorPort = await reservePort(MONITOR_PORT_REQUESTED)
  runtime.networkIp = getPrimaryIPv4()

  await updateMetrics()

  monitorServer.listen(runtime.monitorPort, () => {
    pushLog("info", `Monitor Web UI running at http://localhost:${runtime.monitorPort}`)
    const urls = buildUrls()
    pushLog("info", `Local URL: ${urls.localBase}`)
    if (urls.networkBase) pushLog("info", `Network URL: ${urls.networkBase}`)
    pushLog("info", `Swagger URL: ${urls.swagger}`)
    pushLog("info", `Database UI URL: ${urls.databaseUI}`)
    pushLog("info", `Runtime Monitor URL: ${urls.monitorBase}`)
    pushLog("info", `API Base URL: ${urls.apiBase}`)
  })

  const appProcess = startNextApp()
  setupShutdown(appProcess)

  renderCliDashboard()
  setInterval(async () => {
    await updateMetrics()
    if (process.stdout.isTTY) {
      renderCliDashboard()
    }
  }, 1000)
}

main().catch((err) => {
  pushLog("error", `Fatal monitor error: ${err.message || err}`)
  cleanupTerminal()
  process.exit(1)
})

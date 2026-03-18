# Runtime Monitor Guide

## Tujuan
Menyediakan mode operasional terpadu untuk menjalankan aplikasi beserta observability dasar (CPU, RAM, Disk, status proses, dan live server logs).

## Command
- Production monitor: npm run start
- Development monitor: npm run start:devops

## Endpoint dan UI
- App: http://localhost:3000
- Monitor UI: http://localhost:3030
- Monitor API metrics: GET /api/metrics
- Monitor API logs: GET /api/logs?limit=250

## Informasi yang Ditampilkan
- CPU usage host
- RAM usage host
- Disk usage pada volume project
- Status proses Next.js (running/stopped)
- PID aplikasi
- Uptime host dan uptime monitor
- Live logs stdout/stderr dari server aplikasi

## Implementasi Teknis
- Script monitor: scripts/ops-runtime-monitor.js
- npm scripts:
  - start -> node scripts/ops-runtime-monitor.js
  - start:app -> next start
  - start:devops -> set START_MODE=dev&& node scripts/ops-runtime-monitor.js

## Catatan Operasional
- Gunakan npm run build sebelum npm run start agar mode production berjalan benar.
- Jika port monitor bentrok, ubah MONITOR_PORT environment variable.
- Jika port aplikasi bentrok, ubah PORT environment variable.

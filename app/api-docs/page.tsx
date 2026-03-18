"use client"

import dynamic from "next/dynamic"

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">API Documentation</h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Swagger UI untuk eksplorasi endpoint ProPangkat. Spesifikasi diambil dari <code>/openapi.json</code>.
        </p>

        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
        <SwaggerUI url="/openapi.json" docExpansion="list" defaultModelsExpandDepth={-1} />
      </div>
    </main>
  )
}

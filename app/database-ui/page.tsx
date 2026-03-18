"use client"

import { useEffect, useMemo, useState } from "react"

type TableColumn = {
  name: string
  type: string
  nullable: boolean
}

type TableInfo = {
  table: string
  rowCount: number
  columns: TableColumn[]
}

type DbExplorerResponse = {
  success: boolean
  database: string
  tables: TableInfo[]
  generatedAt: string
}

export default function DatabaseUiPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DbExplorerResponse | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/database-explorer", { cache: "no-store" })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = (await res.json()) as DbExplorerResponse
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const filteredTables = useMemo(() => {
    const list = data?.tables ?? []
    if (!query.trim()) return list
    return list.filter((t) => t.table.toLowerCase().includes(query.toLowerCase()))
  }, [data, query])

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Database Web UI</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Ringkasan struktur tabel dan jumlah baris dari database ProPangkat.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Database</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{data?.database ?? "-"}</p>
            </div>
            <div className="rounded-lg border p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Tabel</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{data?.tables?.length ?? 0}</p>
            </div>
            <div className="rounded-lg border p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Generated At</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {data?.generatedAt ? new Date(data.generatedAt).toLocaleString("id-ID") : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Cari Tabel</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="contoh: user, promotionproposal"
            className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {loading && <p className="text-sm text-slate-600 dark:text-slate-300">Memuat data database...</p>}
        {error && <p className="text-sm text-red-600">Gagal memuat data: {error}</p>}

        {!loading && !error && (
          <div className="grid gap-4">
            {filteredTables.map((table) => (
              <article key={table.table} className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{table.table}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {table.rowCount} rows
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b dark:border-slate-700">
                        <th className="px-2 py-2 text-left font-semibold">Column</th>
                        <th className="px-2 py-2 text-left font-semibold">Type</th>
                        <th className="px-2 py-2 text-left font-semibold">Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((col) => (
                        <tr key={`${table.table}-${col.name}`} className="border-b dark:border-slate-800">
                          <td className="px-2 py-2">{col.name}</td>
                          <td className="px-2 py-2">{col.type}</td>
                          <td className="px-2 py-2">{col.nullable ? "YES" : "NO"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

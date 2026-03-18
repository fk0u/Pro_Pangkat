"use client"

import Link from "next/link"
import { AlertTriangle, RefreshCw, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConnectionRefusedPage() {
	return (
		<main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
			<Card className="w-full max-w-xl border-red-200 dark:border-red-900/50">
				<CardHeader className="text-center space-y-3">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300">
						<ServerCrash className="h-7 w-7" />
					</div>
					<CardTitle className="text-2xl">Koneksi Server Ditolak</CardTitle>
					<CardDescription>
						Aplikasi sudah berjalan, tetapi server backend menolak koneksi. Silakan cek layanan database dan API.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
						<div className="flex items-start gap-2">
							<AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
							<p>
								Pastikan PostgreSQL aktif, variabel environment database benar, dan migrasi Prisma sudah sinkron.
							</p>
						</div>
					</div>

					<div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
						<p>1. Jalankan ulang server aplikasi.</p>
						<p>2. Verifikasi koneksi database pada konfigurasi environment.</p>
						<p>3. Cek log server untuk pesan error terbaru.</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-2">
						<Button onClick={() => window.location.reload()} className="sm:flex-1">
							<RefreshCw className="mr-2 h-4 w-4" />
							Coba Lagi
						</Button>
						<Button asChild variant="outline" className="sm:flex-1">
							<Link href="/">Kembali ke Beranda</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	)
}

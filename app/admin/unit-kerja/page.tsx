import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">D:\PaidProject\propangkat-nextjs\app\admin\unit-kerja\page.tsx</CardTitle>
          <CardDescription>
            Halaman ini sudah siap secara struktur dan bisa langsung diisi fitur sesuai kebutuhan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Placeholder ini dibuat agar build aplikasi stabil dan seluruh route valid.
          </p>
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}


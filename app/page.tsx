"use client"

import { useEffect, useState } from "react"
import HomePageClient from "@/components/home-page-client"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-slate-100 dark:bg-slate-900" />
  }

  return <HomePageClient />
}

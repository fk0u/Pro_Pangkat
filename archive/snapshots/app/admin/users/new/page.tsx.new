"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewUserPage() {
  const router = useRouter()
  
  // Redirect to the main users page where we now use modals
  useEffect(() => {
    router.push("/admin/users")
  }, [router])

  return null
}

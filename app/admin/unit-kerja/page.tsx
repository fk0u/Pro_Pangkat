'use client'

// import { useSession } from 'next-auth/react'
// import { redirect } from 'next/navigation'
import UnitKerjaManagement from '@/components/unit-kerja-management'

export default function AdminUnitKerjaPage() {
  // const { data: session, status } = useSession()

  // TODO: Implement proper authentication
  // if (status === 'loading') {
  //   return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  // }

  // if (!session || session.user.role !== 'ADMIN') {
  //   redirect('/login')
  // }

  return (
    <div className="container mx-auto p-6">
      <UnitKerjaManagement />
    </div>
  )
}

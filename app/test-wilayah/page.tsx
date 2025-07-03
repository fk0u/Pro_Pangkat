'use client'

import { useState, useEffect } from 'react'

interface WilayahMaster {
  id: string
  kode: string
  nama: string
  namaLengkap: string
  ibukota: string
  koordinat: string | null
  luasWilayah: number | null
  jumlahKecamatan: number | null
  isActive: boolean
}

interface UnitKerja {
  id: string
  nama: string
  npsn: string | null
  jenjang: string
  alamat: string | null
  kecamatan: string | null
  status: string
  kepalaSekolah: string | null
  phone: string | null
  email: string | null
  website: string | null
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
  wilayahNama: string
  jumlahPegawai: number
  createdAt: string
  updatedAt: string
}

export default function TestWilayahPage() {
  const [wilayahList, setWilayahList] = useState<WilayahMaster[]>([])
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch wilayah master
        const wilayahResponse = await fetch('/api/wilayah-master')
        if (wilayahResponse.ok) {
          const wilayahData = await wilayahResponse.json()
          setWilayahList(wilayahData.data || [])
        }

        // Fetch unit kerja
        const unitKerjaResponse = await fetch('/api/unit-kerja')
        if (unitKerjaResponse.ok) {
          const unitKerjaData = await unitKerjaResponse.json()
          setUnitKerjaList(unitKerjaData.data || [])
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold">Error</div>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Relasi Wilayah Master</h1>
        
        {/* Wilayah Master Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wilayah Master ({wilayahList.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wilayahList.map((wilayah) => (
              <div key={wilayah.id} className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-900">{wilayah.nama}</h3>
                <p className="text-sm text-blue-700">{wilayah.namaLengkap}</p>
                <div className="mt-2 text-xs text-blue-600">
                  <p>Kode: {wilayah.kode}</p>
                  <p>Ibukota: {wilayah.ibukota}</p>
                  {wilayah.luasWilayah && <p>Luas: {wilayah.luasWilayah.toLocaleString()} km²</p>}
                  {wilayah.jumlahKecamatan && <p>Kecamatan: {wilayah.jumlahKecamatan}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Kerja Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Unit Kerja dengan Relasi ({unitKerjaList.length})</h2>
          
          {/* Summary by Wilayah */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Distribusi per Wilayah</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {wilayahList.map((wilayah) => {
                const count = unitKerjaList.filter(unit => 
                  unit.wilayahRelasi?.id === wilayah.id || 
                  unit.wilayah === wilayah.kode
                ).length
                return (
                  <div key={wilayah.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{wilayah.nama}</div>
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-gray-500">unit kerja</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Unit Kerja Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Unit Kerja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenjang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wilayah (Enum)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wilayah (Relasi)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pegawai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unitKerjaList.slice(0, 50).map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{unit.nama}</div>
                      {unit.npsn && <div className="text-sm text-gray-500">NPSN: {unit.npsn}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.jenjang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {unit.wilayah || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.wilayahRelasi ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {unit.wilayahRelasi.nama}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Tidak ada relasi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.jumlahPegawai}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        unit.status === 'AKTIF' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unitKerjaList.length > 50 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Menampilkan 50 dari {unitKerjaList.length} unit kerja
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

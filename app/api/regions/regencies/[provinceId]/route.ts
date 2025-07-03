import { NextResponse } from "next/server"
import { fetchRegencies } from "@/lib/indonesian-regions"

export async function GET(request: Request, { params }: { params: { provinceId: string } }) {
  try {
    const regencies = await fetchRegencies(params.provinceId)
    return NextResponse.json({ success: true, data: regencies })
  } catch (error) {
    console.error("Error fetching regencies:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch regencies" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { fetchProvinces } from "@/lib/indonesian-regions"

export async function GET() {
  try {
    const provinces = await fetchProvinces()
    return NextResponse.json({ success: true, data: provinces })
  } catch (error) {
    console.error("Error fetching provinces:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch provinces" }, { status: 500 })
  }
}

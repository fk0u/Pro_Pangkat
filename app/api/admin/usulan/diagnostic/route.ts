import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// This is a debugging utility endpoint to check what's wrong with the usulan API
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ message: "Not logged in" }, { status: 401 });
    }

    // Get the current user role
    const userRole = session.user?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ message: "Not authorized, role: " + userRole }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    // Return the diagnostic information
    return NextResponse.json({ 
      message: "Diagnostic information",
      user: {
        id: session.user?.id,
        role: session.user?.role,
        isLoggedIn: session.isLoggedIn
      },
      params: {
        status,
        search,
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    return NextResponse.json({ 
      message: "Error in diagnostic endpoint", 
      error: String(error) 
    }, { status: 500 });
  }
}

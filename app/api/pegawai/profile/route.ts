import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  email: z.string().email("Email tidak valid").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(), // Alias for address
  jabatan: z.string().optional().nullable(),
  jenisJabatan: z.string().optional().nullable(),
  unitKerja: z.string().optional().nullable(),
  unitKerjaId: z.string().optional().nullable(),
  golongan: z.string().optional().nullable(),
  tmtGolongan: z.string().optional().nullable(),
  tmtJabatan: z.string().optional().nullable(),
  wilayahId: z.string().optional().nullable(),
  nip: z.string().optional().nullable(),
}).strict(false) // Allow extra fields to pass through

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        unitKerja: true,
        unitKerjaId: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("Profile update request body:", body);
    
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Profile validation failed:", parsed.error.errors);
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.errors }, { status: 400 })
    }

    // Process date fields like tmtJabatan
    const updateData = { ...parsed.data };
    
    if (updateData.tmtJabatan && typeof updateData.tmtJabatan === 'string') {
      try {
        // Convert string date to Date object
        updateData.tmtJabatan = new Date(updateData.tmtJabatan);
      } catch (e) {
        console.error("Failed to parse tmtJabatan date:", e);
      }
    }
    
    // Handle address/alamat field (some forms use address, others use alamat)
    if (updateData.alamat && !updateData.address) {
      updateData.address = updateData.alamat;
    }
    
    // IMPORTANT: Fix the unitKerja field
    // Store unitKerja name in a separate variable and remove it from updateData
    const unitKerjaNama = updateData.unitKerja;
    delete updateData.unitKerja;  // Remove unitKerja from update data
    
    // If unitKerja is provided, we need to handle it differently
    if (unitKerjaNama) {
      try {
        // Try to find the unit kerja by name
        const unitKerja = await prisma.unitKerja.findFirst({
          where: { nama: unitKerjaNama }
        });
        
        if (unitKerja) {
          // If found, update the unitKerjaId
          updateData.unitKerjaId = unitKerja.id;
        } else {
          console.log(`Unit kerja with name "${unitKerjaNama}" not found, skipping unitKerja update`);
        }
      } catch (error) {
        console.error("Error finding unit kerja:", error);
      }
    }

    console.log("Processed update data:", updateData);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        golongan: true,
        tmtGolongan: true,
        tmtJabatan: true,
        jabatan: true,
        jenisJabatan: true,
        unitKerja: true,
        unitKerjaId: true,
        wilayah: true,
        profilePictureUrl: true,
      },
    })

    console.log("Profile updated successfully:", updatedUser);

    // Log the profile update action
    try {
      await prisma.activityLog.create({
        data: {
          action: "UPDATE_PROFILE",
          details: { userId: session.user.id, fields: Object.keys(updateData) },
          userId: session.user.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log profile update:", logError);
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    
    // Provide more detailed error message
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      detail: "Failed to update profile. Please check the data you provided."
    }, { status: 500 })
  }
}

import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    // Get all settings
    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        category: "asc"
      }
    })

    // Convert to a more usable format grouped by category
    const groupedSettings = settings.reduce<Record<string, Record<string, string>>>((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {}
      }
      acc[setting.category][setting.key] = setting.value
      return acc
    }, {})

    return createSuccessResponse(groupedSettings)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch settings"
    console.error("Error fetching settings:", error)
    return createErrorResponse(errorMessage)
  }
})

export const PUT = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const body = await req.json()
    const { settings } = body

    if (!settings || typeof settings !== "object") {
      return createErrorResponse("Invalid settings data", 400)
    }

    // Process each category and its settings
    const updatedSettings = []
    for (const [category, categorySettings] of Object.entries(settings)) {
      if (typeof categorySettings === 'object' && categorySettings !== null) {
        for (const [key, value] of Object.entries(categorySettings)) {
          // Upsert the setting
          const updatedSetting = await prisma.systemSetting.upsert({
            where: {
              category_key: {
                category,
                key
              }
            },
            update: {
              value: String(value)
            },
            create: {
              category,
              key,
              value: String(value)
            }
          })

          updatedSettings.push(updatedSetting)
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "UPDATE_SETTINGS",
        details: {
          settingsUpdated: Object.keys(settings).join(", ")
        },
        userId: user.id
      }
    })

    return createSuccessResponse(updatedSettings, "Settings updated successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update settings"
    console.error("Error updating settings:", error)
    return createErrorResponse(errorMessage)
  }
})

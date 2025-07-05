import { prisma } from "@/lib/prisma"
import { Session } from "@/lib/auth"

/**
 * Logs user activity in the system
 * 
 * @param action The type of action performed (e.g., 'LOGIN', 'CREATE_PROPOSAL', etc.)
 * @param details Additional details about the action (can include any relevant information)
 * @param session The user session object containing user information
 * @param userId Optional user ID (if different from the session user)
 * @returns The created activity log record
 */
export async function logActivity(
  action: string, 
  details: Record<string, any>, 
  session: Session | null,
  userId?: string
) {
  try {
    // Get the user ID from the session or from the provided userId
    const userIdToUse = userId || (session?.user?.id || null)
    
    if (!userIdToUse && action !== 'SYSTEM') {
      console.warn('Activity log created without user ID:', { action, details })
    }
    
    // Create the activity log entry
    const log = await prisma.activityLog.create({
      data: {
        action,
        details,
        userId: userIdToUse
      }
    })
    
    return log
  } catch (error) {
    console.error('Error creating activity log:', error)
    // Don't throw errors from logging - we don't want to break functionality
    // if logging fails
    return null
  }
}

/**
 * Log system-level activities (not tied to a user)
 * 
 * @param action The type of action performed
 * @param details Additional details about the action
 * @returns The created activity log record
 */
export async function logSystemActivity(action: string, details: Record<string, any>) {
  return logActivity('SYSTEM_' + action, details, null)
}

/**
 * Helper function to log login activity
 * 
 * @param userId User ID
 * @param success Whether login was successful
 * @param metadata Additional metadata about the login
 * @returns The created activity log record
 */
export async function logLogin(userId: string, success: boolean, metadata: Record<string, any>) {
  return logActivity(
    success ? 'LOGIN' : 'LOGIN_FAILED',
    {
      ...metadata,
      success,
      timestamp: new Date().toISOString()
    },
    null,
    userId
  )
}

/**
 * Helper function to log logout activity
 * 
 * @param userId User ID
 * @param metadata Additional metadata about the logout
 * @returns The created activity log record
 */
export async function logLogout(userId: string, metadata: Record<string, any>) {
  return logActivity(
    'LOGOUT',
    {
      ...metadata,
      timestamp: new Date().toISOString()
    },
    null,
    userId
  )
}

/**
 * Helper function to log proposal related activities
 * 
 * @param action The specific action (CREATE, UPDATE, DELETE, APPROVE, REJECT)
 * @param proposalId The ID of the proposal
 * @param session The user session
 * @param metadata Additional metadata
 * @returns The created activity log record
 */
export async function logProposalActivity(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT',
  proposalId: string,
  session: Session,
  metadata: Record<string, any>
) {
  return logActivity(
    `${action}_PROPOSAL`,
    {
      ...metadata,
      proposalId,
      userRole: session.user?.role,
      timestamp: new Date().toISOString()
    },
    session
  )
}

/**
 * Helper function to log timeline related activities
 * 
 * @param action The specific action (CREATE, UPDATE, DELETE)
 * @param timelineId The ID of the timeline
 * @param session The user session
 * @param metadata Additional metadata
 * @returns The created activity log record
 */
export async function logTimelineActivity(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  timelineId: string,
  session: Session,
  metadata: Record<string, any>
) {
  return logActivity(
    `${action}_TIMELINE`,
    {
      ...metadata,
      timelineId,
      userRole: session.user?.role,
      timestamp: new Date().toISOString()
    },
    session
  )
}

/**
 * Helper function to log document related activities
 * 
 * @param action The specific action (UPLOAD, DELETE, VIEW)
 * @param documentId The ID of the document
 * @param session The user session
 * @param metadata Additional metadata
 * @returns The created activity log record
 */
export async function logDocumentActivity(
  action: 'UPLOAD' | 'DELETE' | 'VIEW',
  documentId: string,
  session: Session,
  metadata: Record<string, any>
) {
  return logActivity(
    `${action}_DOCUMENT`,
    {
      ...metadata,
      documentId,
      userRole: session.user?.role,
      timestamp: new Date().toISOString()
    },
    session
  )
}

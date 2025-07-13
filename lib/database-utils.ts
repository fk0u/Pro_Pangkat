import { PrismaClient, StatusDokumen } from "@prisma/client"

interface DatabaseField {
  name: string;
  type: string;
}

let fieldExistsCache: Record<string, boolean> = {};

/**
 * Check if a field exists in a database table
 */
async function fieldExists(tableName: string, fieldName: string): Promise<boolean> {
  const cacheKey = `${tableName}.${fieldName}`;
  
  // Check cache first
  if (fieldExistsCache[cacheKey] !== undefined) {
    return fieldExistsCache[cacheKey];
  }
  
  const prisma = new PrismaClient();
  
  try {
    // Use Prisma's internal $queryRaw to check if the field exists
    const result = await prisma.$queryRaw<DatabaseField[]>`
      SELECT column_name as name, data_type as type
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND column_name = ${fieldName};
    `;
    
    const exists = result.length > 0;
    
    // Cache the result
    fieldExistsCache[cacheKey] = exists;
    
    return exists;
  } catch (error) {
    console.error(`Error checking if field ${fieldName} exists in table ${tableName}:`, error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a conditional update object that only includes a field if it exists in the database
 */
export async function createConditionalUpdate(tableName: string, data: Record<string, any>): Promise<Record<string, any>> {
  const updatedData: Record<string, any> = {};
  
  // Process each field in the data object
  for (const [key, value] of Object.entries(data)) {
    // Always include fields that are part of the core schema
    if (await fieldExists(tableName, key)) {
      updatedData[key] = value;
    } else {
      console.log(`Field ${key} does not exist in table ${tableName}, skipping`);
    }
  }
  
  return updatedData;
}

/**
 * Check if verifiedAt field exists in ProposalDocument table
 */
export async function hasVerifiedAtField(): Promise<boolean> {
  return await fieldExists('ProposalDocument', 'verifiedAt');
}

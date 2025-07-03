/**
 * Safe utility functions to prevent "Cannot convert undefined or null to object" errors
 */

export function safeObjectKeys(obj: any): string[] {
  if (!obj || typeof obj !== 'object') {
    return []
  }
  try {
    return Object.keys(obj)
  } catch (error) {
    console.warn('Error getting object keys:', error)
    return []
  }
}

export function safeObjectValues(obj: any): any[] {
  if (!obj || typeof obj !== 'object') {
    return []
  }
  try {
    return Object.values(obj)
  } catch (error) {
    console.warn('Error getting object values:', error)
    return []
  }
}

export function safeObjectEntries(obj: any): [string, any][] {
  if (!obj || typeof obj !== 'object') {
    return []
  }
  try {
    return Object.entries(obj)
  } catch (error) {
    console.warn('Error getting object entries:', error)
    return []
  }
}

export function safeMapToArray<T, R>(
  data: T[] | null | undefined,
  mapFn: (item: T, index: number) => R
): R[] {
  if (!Array.isArray(data)) {
    return []
  }
  try {
    return data.map(mapFn)
  } catch (error) {
    console.warn('Error mapping array:', error)
    return []
  }
}

export function safeFilter<T>(
  data: T[] | null | undefined,
  filterFn: (item: T, index: number) => boolean
): T[] {
  if (!Array.isArray(data)) {
    return []
  }
  try {
    return data.filter(filterFn)
  } catch (error) {
    console.warn('Error filtering array:', error)
    return []
  }
}

export function safeReduce<T, R>(
  data: T[] | null | undefined,
  reduceFn: (acc: R, item: T, index: number) => R,
  initialValue: R
): R {
  if (!Array.isArray(data)) {
    return initialValue
  }
  try {
    return data.reduce(reduceFn, initialValue)
  } catch (error) {
    console.warn('Error reducing array:', error)
    return initialValue
  }
}

export function safeAccess<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }
  
  try {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue
      }
      current = current[key]
    }
    
    return current !== undefined ? current : defaultValue
  } catch (error) {
    console.warn('Error accessing object path:', error)
    return defaultValue
  }
}

export function isValidArray(data: any): data is any[] {
  return Array.isArray(data) && data !== null && data !== undefined
}

export function isValidObject(data: any): data is object {
  return data !== null && data !== undefined && typeof data === 'object' && !Array.isArray(data)
}

export function ensureArray<T>(data: T[] | T | null | undefined): T[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data !== null && data !== undefined) {
    return [data]
  }
  return []
}

export function ensureString(data: any, defaultValue = ''): string {
  if (typeof data === 'string') {
    return data
  }
  if (data !== null && data !== undefined) {
    return String(data)
  }
  return defaultValue
}

export function ensureNumber(data: any, defaultValue = 0): number {
  if (typeof data === 'number' && !isNaN(data)) {
    return data
  }
  const parsed = parseFloat(data)
  if (!isNaN(parsed)) {
    return parsed
  }
  return defaultValue
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return "Tanggal tidak valid"
  }
}

/**
 * Format tanggal dan waktu ke format Indonesia
 */
export function formatDateTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    return "Tanggal tidak valid"
  }
}

/**
 * Format tanggal relatif (misalnya: "2 hari yang lalu")
 */
export function formatRelativeDate(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "Baru saja"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan yang lalu`
    return `${Math.floor(diffInSeconds / 31536000)} tahun yang lalu`
  } catch (error) {
    return "Tanggal tidak valid"
  }
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago", "3 days ago")
 * Similar to formatRelativeDate but takes a Date object
 * @param date The date to format
 * @returns A string representing the relative time
 */
export function formatRelativeTime(date: Date): string {
  try {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "Baru saja"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan yang lalu`
    return `${Math.floor(diffInSeconds / 31536000)} tahun yang lalu`
  } catch (error) {
    return "Tanggal tidak valid"
  }
}

/**
 * Format ukuran file
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Byte"
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i]
}

/**
 * Cek apakah tanggal valid
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

import { Redis } from '@upstash/redis'

/**
 * Enterprise Redis Client dengan Fallback Memory
 *
 * Mengizinkan aplikasi tetap berjalan di local dev environment
 * tanpa harus setup Redis. Pada production (ketika UPSTASH_REDIS_REST_URL di-set),
 * akan otomatis menggunakan Upstash Redis via REST API (Serverless compatible).
 */

class MockRedis {
  constructor() {
    console.warn("?? WARNING: Using MockRedis fallback. Ensure UPSTASH_REDIS_REST_URL is configured for production environments!");
  }
  private store = new Map<string, { value: any, expiresAt?: number }>()

  private cleanup() {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.store.delete(key)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.cleanup()
    const item = this.store.get(key)
    return item ? (item.value as T) : null
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    this.cleanup()
    let expiresAt = undefined
    if (options?.ex) {
      expiresAt = Date.now() + (options.ex * 1000)
    }
    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async del(key: string): Promise<number> {
    this.cleanup()
    const existed = this.store.has(key)
    this.store.delete(key)
    return existed ? 1 : 0
  }

  async incr(key: string): Promise<number> {
    this.cleanup()
    const item = this.store.get(key)
    const nextVal = item ? Number(item.value) + 1 : 1
    this.store.set(key, { value: nextVal, expiresAt: item?.expiresAt })
    return nextVal
  }
}

// Inisialisasi klien Redis yang sebenarnya jika Environment terisi
const hasRedisConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = hasRedisConfig 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : new MockRedis() as unknown as Redis

export const isUsingMockRedis = !hasRedisConfig


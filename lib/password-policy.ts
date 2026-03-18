export type PasswordPolicyResult = {
  valid: boolean
  errors: string[]
}

type PasswordPolicyOptions = {
  minLength?: number
  disallowValues?: string[]
}

export function validatePasswordPolicy(password: string, options?: PasswordPolicyOptions): PasswordPolicyResult {
  const errors: string[] = []
  const minLength = options?.minLength ?? 10

  if (password.length < minLength) {
    errors.push(`Password minimal ${minLength} karakter`)
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus memiliki minimal 1 huruf besar")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password harus memiliki minimal 1 huruf kecil")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password harus memiliki minimal 1 angka")
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password harus memiliki minimal 1 karakter khusus")
  }

  const disallowValues = options?.disallowValues || []
  for (const value of disallowValues) {
    if (!value) continue
    if (password.toLowerCase().includes(value.toLowerCase())) {
      errors.push("Password terlalu mudah ditebak")
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

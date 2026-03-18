"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useCaptcha } from "@/hooks/use-captcha"
import Image from "next/image"

interface CaptchaProps {
  onValidate: (isValid: boolean) => void
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onHashChange?: (hash: string | null) => void
}

export function EnhancedCaptcha({ onValidate, value, onChange, disabled = false, onHashChange }: CaptchaProps) {
  const {
    image,
    hash,
    loading,
    error,
    isValid,
    generateCaptcha,
    updateValue
  } = useCaptcha();

  // Update parent component with validation status
  useEffect(() => {
    onValidate(isValid);
  }, [isValid, onValidate]);

  // Update parent with hash when it changes
  useEffect(() => {
    if (onHashChange) {
      onHashChange(hash);
    }
  }, [hash, onHashChange]);

  // Keep local and hook state in sync
  useEffect(() => {
    updateValue(value);
    // Use the onChange prop to keep the parent component's state in sync
    // This ensures two-way binding between this component and its parent
  }, [value, updateValue, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="relative h-[50px] w-[150px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
            {image ? (
              <Image
                src={image}
                alt="CAPTCHA"
                fill
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
              />
            ) : (
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateCaptcha}
            disabled={loading || disabled}
            className="p-2 h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  )
}

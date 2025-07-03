"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface CaptchaProps {
  onValidate: (isValid: boolean) => void
  value: string
  onChange: (value: string) => void
}

export function Captcha({ onValidate, value, onChange }: CaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captchaText, setCaptchaText] = useState("")

  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    return result
  }

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // Draw text
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const x = 30 + i * 25
      const y = 25 + Math.random() * 10 - 5
      const rotation = (Math.random() - 0.5) * 0.4

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`
      ctx.fillText(char, 0, 0)
      ctx.restore()
    }

    // Add noise dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 60%)`
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  const refreshCaptcha = () => {
    const newText = generateCaptcha()
    drawCaptcha(newText)
    onChange("")
    onValidate(false)
  }

  useEffect(() => {
    const text = generateCaptcha()
    drawCaptcha(text)
  }, [])

  useEffect(() => {
    const isValid = value.toUpperCase() === captchaText.toUpperCase() && value.length === 5
    onValidate(isValid)
  }, [value, captchaText, onValidate])

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <canvas
          ref={canvasRef}
          width={150}
          height={50}
          className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
        />
        <Button type="button" variant="outline" size="sm" onClick={refreshCaptcha} className="p-2 h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

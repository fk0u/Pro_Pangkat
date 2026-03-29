import { createCanvas } from "canvas"

export function generateCaptchaImage(text: string) {
  const width = 200
  const height = 50
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Background
  ctx.fillStyle = "#f0f0f0"
  ctx.fillRect(0, 0, width, height)

  // Text
  ctx.font = "30px Arial"
  ctx.fillStyle = "#333"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Add some distortion
  for (let i = 0; i < text.length; i++) {
    const x = width / (text.length + 1) * (i + 1)
    const y = height / 2 + (Math.random() - 0.5) * 10
    const angle = (Math.random() - 0.5) * 0.5
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillText(text[i], 0, 0)
    ctx.restore()
  }

  // Add some noise
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`
    ctx.fillRect(x, y, 1, 1)
  }

  return canvas.toDataURL()
}

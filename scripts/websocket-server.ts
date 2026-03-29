import { WebSocketServer } from "ws"
import { prisma } from "../lib/prisma"

const wss = new WebSocketServer({ port: 8080 })

wss.on("connection", (ws) => {
  console.log("Client connected")

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`)
  })

  ws.on("close", () => {
    console.log("Client disconnected")
  })
})

export async function broadcastNotification(notification: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(notification))
    }
  })
}

prisma.$use(async (params, next) => {
  const result = await next(params)
  if (params.model === "Notification" && params.action === "create") {
    broadcastNotification(result)
  }
  return result
})

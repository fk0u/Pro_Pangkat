"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function TwoFactorSetupPage() {
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const generateQrCode = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/auth/2fa/setup")
        const data = await response.json()
        if (response.ok) {
          setQrCode(data.qrCodeUrl)
          setSecret(data.secret)
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to generate QR code.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    generateQrCode()
  }, [toast])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token: verificationCode }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "2FA has been successfully enabled.",
        })
        // Optionally redirect the user
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid verification code.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Setup Two-Factor Authentication</CardTitle>
            <CardDescription>Scan the QR code with your authenticator app.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {qrCode && <Image src={qrCode} alt="QR Code" width={200} height={200} />}
                <p className="mt-4 text-sm text-gray-500">Or enter this code manually:</p>
                <p className="mt-2 text-lg font-semibold">{secret}</p>
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-6 mt-6">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter code from your app"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md"
                  disabled={isVerifying}
                />
              </div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={isVerifying}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Enable 2FA"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

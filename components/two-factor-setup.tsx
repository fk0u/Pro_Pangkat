"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2 } from "lucide-react";

export function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/generate", { method: "POST" });
      const data = await response.json();
      
      if (response.ok) {
        setQrCode(data.qrCodeUrl);
        setSecret(data.secret);
      } else {
        throw new Error(data.message || "Failed to generate 2FA");
      }
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Gagal membuat setup 2FA. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Kode tidak valid",
        description: "Masukkan 6 digit kode verifikasi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });
      
      if (response.ok) {
        setIsSetupComplete(true);
        toast({
          title: "Berhasil",
          description: "Two-factor authentication telah aktif.",
        });
      } else {
        throw new Error("Kode verifikasi tidak valid");
      }
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Verifikasi gagal. Pastikan kode Anda benar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetupComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keamanan Akun (2FA)</CardTitle>
          <CardDescription>Status Keamanan Akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-green-600 font-medium text-center">
              Two-Factor Authentication Aktif
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keamanan Akun (2FA)</CardTitle>
        <CardDescription>Tingkatkan keamanan akun dengan Autentikasi 2 Langkah</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!qrCode ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Generate QR code untuk di-scan melalui aplikasi Authenticator (Google Authenticator atau Authy).
            </p>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Muat QR Code 2FA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center">
            <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mb-2" />
              <p className="text-xs text-muted-foreground">Secret: <span className="font-mono bg-muted px-1">{secret}</span></p>
            </div>
            
            <div className="w-full space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Scan barcode di atas, kemudian masukkan 6 digit token dari aplikasi
              </p>
              
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={isLoading}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verifikasi & Aktifkan"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
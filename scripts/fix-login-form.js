const fs = require('fs');

let code = fs.readFileSync('components/compact-login-form.tsx', 'utf8');

// 1. Add state variables
code = code.replace(
  'const [isLoading, setIsLoading] = useState(false)',
  'const [isLoading, setIsLoading] = useState(false)\n  const [require2FA, setRequire2FA] = useState(false)\n  const [otpToken, setOtpToken] = useState("")\n  const [isVerifying2FA, setIsVerifying2FA] = useState(false)'
);

// 2. Add API response handling for require2FA
code = code.replace(
  'throw new Error(data.message || "Login gagal" + (data.details ? `: ${JSON.stringify(data.details)}` : ""))\n      }\n\n      // Success',
  'throw new Error(data.message || "Login gagal" + (data.details ? `: ${JSON.stringify(data.details)}` : ""))\n      }\n\n      if (data.require2FA) {\n        setRequire2FA(true)\n        setIsLoading(false)\n        return\n      }\n\n      // Success'
);

// 3. Add handleVerify2FA method
const verifyMethod = `
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) return;

    setIsVerifying2FA(true);
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: otpToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kode OTP tidak valid');
      }

      toast({
        title: 'Verifikasi Berhasil',
        description: \`Selamat datang, \${data.user?.name || ''}\`,
      });

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedNip', nip);
        localStorage.setItem('userType', userType);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedNip');
        localStorage.removeItem('userType');
      }

      if (data.user?.mustChangePassword) {
        setCurrentUser(data.user);
        setShowChangePasswordModal(true);
      } else {
        redirectToUserDashboard(data.user.role || 'PEGAWAI');
      }
    } catch (error: any) {
      toast({
        title: 'Verifikasi Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const redirectToUserDashboard`;

code = code.replace('  const redirectToUserDashboard', verifyMethod);

// 4. Wrap form rendering in conditionally require2FA
const replacementForm = `
        {require2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🔒 Verifikasi 2-Langkah</h3>
              <p className="text-sm text-gray-500 max-w-[260px] mx-auto">Buka aplikasi Authenticator Anda dan masukkan kode 6-digit.</p>
            </motion.div>
            <div className="relative mt-4 mb-6">
              <div className="flex justify-center">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  disabled={isVerifying2FA}
                  className="h-14 w-full md:w-3/4 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 px-4 py-2 text-center text-3xl font-extrabold tracking-[0.5em] transition-all duration-300 focus:bg-white dark:focus:bg-gray-700 focus:border-sky-400 placeholder:text-gray-300"
                  maxLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isVerifying2FA || otpToken.length !== 6}
              className={\`w-full h-12 rounded-full text-white font-medium text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2 bg-gradient-to-r \${getUserTypeColor()}\`}
            >
              {isVerifying2FA ? <Loader2 className="h-6 w-6 animate-spin" /> : <span>Verifikasi <ArrowRight className="ml-2 h-5 w-5 inline" /></span>}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-sm text-gray-500 hover:text-gray-700" onClick={() => setRequire2FA(false)}>
              Batal
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
`;

code = code.replace('<form onSubmit={handleSubmit} className="space-y-4">', replacementForm);

const lastFormIndex = code.lastIndexOf('</form>');
if (lastFormIndex !== -1) {
  code = code.substring(0, lastFormIndex + 7) + '\n        )}' + code.substring(lastFormIndex + 7);
}

fs.writeFileSync('components/compact-login-form.tsx', code);
console.log('Done replacement script!');

import { CompactLoginForm } from "@/components/compact-login-form";

export const metadata = {
  title: "Login | ProPangkat"
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <CompactLoginForm redirectTo="/dashboard" />
    </div>
  );
}

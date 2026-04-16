"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@coolex.com", color: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" },
  { label: "Engineer", email: "engineer@coolex.com", color: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" },
  { label: "Dealer", email: "dealer@coolex.com", color: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200" },
];

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const emailVal = watch("email");
  const passwordVal = watch("password");

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    const success = await login(data.email, data.password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Try admin@coolex.com / engineer@coolex.com / dealer@coolex.com");
    }
  };

  const handleDemo = async (email: string) => {
    setDemoLoading(email);
    const success = await login(email, "demo");
    if (success) router.push("/dashboard");
    setDemoLoading(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coolex-logo.png"
              alt="COOLEX"
              className="h-36 w-auto mix-blend-multiply"
            />
          </div>
          <h1 className="text-gray-900 text-xl font-semibold mt-3">Unified Selector</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to access the equipment selection platform</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0">
          <CardContent className="pt-6 pb-6 px-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@coolex.com"
                  autoComplete="email"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : !emailVal ? "bg-red-50" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className={errors.password ? "border-destructive pr-10" : !passwordVal ? "bg-red-50 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <Label htmlFor="rememberMe" className="font-normal text-muted-foreground text-sm">
                  Remember me for 30 days
                </Label>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-[#0057B8] hover:bg-[#0057B8]/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-[#0057B8] hover:underline font-medium">
                  Request access
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* One-click demo access */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center space-y-3 shadow-sm">
          <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">Quick Demo Access</div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(({ label, email, color }) => (
              <button
                key={email}
                onClick={() => handleDemo(email)}
                disabled={demoLoading !== null}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${color} disabled:opacity-60`}
              >
                {demoLoading === email ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="text-base">{label === "Admin" ? "🛡️" : label === "Engineer" ? "🔧" : "🏪"}</span>
                )}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

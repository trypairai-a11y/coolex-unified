"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  company: z.string().min(2, "Company name is required"),
  phone: z.string().min(8, "Phone number is required"),
  role: z.enum(["dealer", "engineer"]),
  country: z.string().min(2, "Country is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const w = watch();

  const onSubmit = async (_data: RegisterFormData) => {
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002D5C] via-[#0057B8] to-[#00A3E0] p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold">Request Submitted</h2>
            <p className="text-muted-foreground text-sm">
              Your access request has been submitted to the COOLEX admin team. You will receive an email once your account is approved.
            </p>
            <Link href="/login">
              <Button className="w-full bg-[#0057B8] hover:bg-[#0057B8]/90">Return to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002D5C] via-[#0057B8] to-[#00A3E0] p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white rounded-xl p-2.5 shadow-lg">
              <div className="w-9 h-9 bg-[#0057B8] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CX</span>
              </div>
            </div>
            <div className="text-white text-left">
              <div className="text-xl font-bold">COOLEX</div>
              <div className="text-white/70 text-xs">Unified Selector - Access Request</div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Request Account Access</CardTitle>
            <CardDescription>Dealers self-register below. Engineers and Admins are invitation-only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Full Name</Label>
                  <Input placeholder="Ahmed Al-Rashidi" {...register("fullName")} className={!w.fullName ? "bg-red-50" : ""} />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Work Email</Label>
                  <Input type="email" placeholder="you@company.com" {...register("email")} className={!w.email ? "bg-red-50" : ""} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Company / Organization</Label>
                  <Input placeholder="Al-Rashidi HVAC Trading" {...register("company")} className={!w.company ? "bg-red-50" : ""} />
                  {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input placeholder="+965 2XXX XXXX" {...register("phone")} className={!w.phone ? "bg-red-50" : ""} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input placeholder="Kuwait" {...register("country")} className={!w.country ? "bg-red-50" : ""} />
                  {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Role</Label>
                  <Select onValueChange={(v) => { setSelectedRole(v); setValue("role", v as "dealer" | "engineer"); }}>
                    <SelectTrigger className={!selectedRole ? "bg-red-50" : ""}>
                      <SelectValue placeholder="Select your role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dealer">Dealer / Distributor</SelectItem>
                      <SelectItem value="engineer">Engineer (invite-only)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                  {selectedRole === "engineer" && (
                    <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      Engineer accounts require an invitation from a COOLEX administrator.
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Minimum 8 characters" {...register("password")} className={!w.password ? "bg-red-50" : ""} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="Re-enter password" {...register("confirmPassword")} className={!w.confirmPassword ? "bg-red-50" : ""} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#0057B8] hover:bg-[#0057B8]/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Access Request
              </Button>
            </form>
            <div className="mt-4 pt-3 border-t text-center">
              <Link href="/login" className="text-xs text-muted-foreground hover:text-[#0057B8] inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

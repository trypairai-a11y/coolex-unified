"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Building2, Copy, Check } from "lucide-react";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { ProjectInfoFormData } from "@/types/selection";
import { COUNTRIES } from "@/lib/mock-data/countries";

function generateProjectId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRJ-${yy}${mm}-${rand}`;
}

const projectInfoSchema = z.object({
  projectName: z.string().min(2, "Project name is required"),
  country: z.string().min(1, "Country is required"),
  clientName: z.string().optional(),
  unitReference: z.string().optional().default(""),
  unitTag: z.string().optional(),
  quantity: z.coerce.number().optional().default(1),
  salesEngineer: z.string().optional(),
});

type FormData = z.infer<typeof projectInfoSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1.5 font-medium">
      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
      {message}
    </p>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  filled?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, filled, error, children, hint }: FieldProps) {
  const showRed = required && !filled;
  return (
    <div className={showRed ? "[&_input]:border-red-400 [&_select]:border-red-400 [&_input]:bg-red-50/50 [&_select]:bg-red-50/50 [&_input:focus]:bg-white [&_select:focus]:bg-white [&_input:focus]:border-[#0057B8] [&_select:focus]:border-[#0057B8]" : ""}>
      <label className="block mb-1.5">
        <span className={`text-[10px] font-semibold tracking-[0.1em] uppercase ${showRed ? "text-red-500" : "text-[#6B7A99]"}`}>
          {label}
          {required && <span className={`${showRed ? "text-red-500" : "text-[#0057B8]"} ml-0.5`}>*</span>}
        </span>
        {hint && <span className="ml-2 text-[10px] text-[#9BA8C0] normal-case tracking-normal">{hint}</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

interface SectionCardProps {
  num: string;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SectionCard({ num, icon: Icon, title, description, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0F4FB]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EBF3FF] text-[#0057B8] shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold tracking-[0.12em] text-[#0057B8] uppercase">{num}</span>
            <h3 className="text-sm font-semibold text-[#0D1626] leading-tight">{title}</h3>
          </div>
          <p className="text-xs text-[#8894AB] mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-5">
        {children}
      </div>
    </div>
  );
}

const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full h-[42px] px-3.5 rounded-lg border border-[#DDE3EF] bg-[#FAFBFF] text-sm text-[#0D1626] placeholder:text-[#B0BAD1]
        transition-all duration-150
        focus:outline-none focus:border-[#0057B8] focus:bg-white focus:ring-3 focus:ring-[#0057B8]/10
        hover:border-[#B8C4DA] ${className}`}
      {...props}
    />
  )
);
StyledInput.displayName = "StyledInput";

export function ProjectInfoForm() {
  const { projectInfo, setProjectInfo } = useSelectionStore();

  const projectId = useMemo(
    () => projectInfo?.projectId || generateProjectId(),
    [projectInfo?.projectId]
  );

  const [copied, setCopied] = useState(false);
  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [projectId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(projectInfoSchema) as any,
    defaultValues: projectInfo ?? {
      projectName: "",
      country: "",
      clientName: "",
      salesEngineer: "",
    },
  });

  const projectName = watch("projectName");
  const country = watch("country");

  const onSubmit = (data: FormData) => {
    setProjectInfo({ ...data, projectId } as ProjectInfoFormData);
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <h2 className="text-[22px] font-bold text-[#0D1626] leading-tight tracking-[-0.01em]">Project Information</h2>
        <p className="text-sm text-[#8894AB] mt-0.5">Enter the project and unit details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <SectionCard num="01" icon={Building2} title="Project Details" description="Identify the project and client">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div className="md:col-span-2">
              <Field label="Project ID" hint="(auto-generated)">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[42px] px-3.5 rounded-lg border border-[#DDE3EF] bg-[#F0F4FB] text-sm font-mono font-medium text-[#4A5578] flex items-center tracking-wide">
                    {projectId}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-lg border border-[#DDE3EF] bg-[#FAFBFF] text-[#6B7A99] hover:bg-[#EBF3FF] hover:text-[#0057B8] hover:border-[#B8C4DA] transition-all duration-150"
                    title="Copy Project ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Project Name" required filled={!!projectName} error={errors.projectName?.message}>
                <StyledInput placeholder="e.g. Al Hamra Village Phase 3" {...register("projectName")} />
              </Field>
            </div>
            <Field label="Country" required filled={!!country} error={errors.country?.message}>
              <select
                {...register("country")}
                className="w-full h-[42px] px-3.5 rounded-lg border border-[#DDE3EF] bg-[#FAFBFF] text-sm text-[#0D1626]
                  transition-all duration-150 appearance-none
                  focus:outline-none focus:border-[#0057B8] focus:bg-white focus:ring-3 focus:ring-[#0057B8]/10
                  hover:border-[#B8C4DA]
                  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7A99%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
                  bg-no-repeat bg-[right_12px_center]"
              >
                <option value="" className="text-[#B0BAD1]">Select country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Client Name" error={errors.clientName?.message}>
              <StyledInput placeholder="e.g. Gulf Bank K.S.C.P." {...register("clientName")} />
            </Field>
            <Field label="Sales Engineer" error={errors.salesEngineer?.message}>
              <StyledInput placeholder="e.g. Ahmed Al-Rashidi" {...register("salesEngineer")} />
            </Field>
          </div>
        </SectionCard>

        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-[#9BA8C0]">
            Fields marked <span className="text-red-500 font-semibold">*</span> are required
          </p>
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-11 px-7 rounded-xl font-semibold text-sm text-white
              bg-[#0057B8] hover:bg-[#004EA6] active:bg-[#003E88]
              shadow-[0_2px_8px_rgba(0,87,184,0.35)] hover:shadow-[0_4px_16px_rgba(0,87,184,0.45)]
              transition-all duration-150 focus:outline-none focus:ring-3 focus:ring-[#0057B8]/30"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
}

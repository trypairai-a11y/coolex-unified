"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Building2, Tag, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { ProjectInfoFormData } from "@/types/selection";

const schema = z.object({
  projectName: z.string().min(2, "Project name is required"),
  clientName: z.string().optional(),
  unitReference: z.string().optional(),
  unitTag: z.string().optional(),
  unitSelection: z.string().optional(),
  quantity: z.coerce.number().min(1).max(999).optional(),
  submittedFor: z.string().optional(),
  country: z.string().optional(),
  salesEngineer: z.string().optional(),
});

type SchemaData = z.infer<typeof schema>;

const COUNTRIES = ["Kuwait", "Saudi Arabia", "UAE", "Qatar", "Bahrain", "Oman", "Iraq", "Jordan", "Egypt", "Lebanon"];

const SUBMITTED_FOR_OPTIONS = [
  "End User",
  "Mechanical Contractor",
  "General Contractor",
  "Facilities Management",
  "Consultant",
  "Government",
];

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
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div>
      <label className="block mb-1.5">
        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#6B7A99]">
          {label}
          {required && <span className="text-[#0057B8] ml-0.5">*</span>}
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SchemaData>({
    resolver: zodResolver(schema) as any,
    defaultValues: projectInfo ?? {
      projectName: "",
      clientName: "",
      unitReference: "",
      unitTag: "",
      unitSelection: "",
      quantity: 1,
      submittedFor: "",
      country: "Kuwait",
      salesEngineer: "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    setProjectInfo(data as ProjectInfoFormData);
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
              <Field label="Project Name" required error={errors.projectName?.message}>
                <StyledInput placeholder="e.g. Al Hamra Village Phase 3" {...register("projectName")} />
              </Field>
            </div>
            <Field label="Client Name" hint="(optional)" error={errors.clientName?.message}>
              <StyledInput placeholder="e.g. Gulf Bank K.S.C.P." {...register("clientName")} />
            </Field>
            <Field label="Sales Engineer" hint="(optional)" error={errors.salesEngineer?.message}>
              <StyledInput placeholder="e.g. Ahmed Al-Rashidi" {...register("salesEngineer")} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard num="02" icon={Tag} title="Unit Identification" description="Tag and reference for this equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Unit Reference" hint="(optional)" error={errors.unitReference?.message}>
              <StyledInput placeholder="e.g. Lobby AHU" {...register("unitReference")} />
            </Field>
            <Field label="Unit Tag" hint="(optional)" error={errors.unitTag?.message}>
              <StyledInput placeholder="e.g. AHU-01" {...register("unitTag")} />
            </Field>
            <Field label="Unit Selection" hint="(optional)" error={errors.unitSelection?.message}>
              <StyledInput placeholder="e.g. Main Lobby Cooling Unit" {...register("unitSelection")} />
            </Field>
            <Field label="Quantity" hint="(optional)" error={errors.quantity?.message}>
              <StyledInput type="number" placeholder="1" min={1} max={999} {...register("quantity")} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard num="03" icon={FileText} title="Submission Details" description="Who this submittal is prepared for">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Submitted For" hint="(optional)" error={errors.submittedFor?.message}>
              <Select defaultValue={projectInfo?.submittedFor} onValueChange={(v) => setValue("submittedFor", v)}>
                <SelectTrigger className="h-[42px] rounded-lg border-[#DDE3EF] bg-[#FAFBFF] text-sm text-[#0D1626]
                  focus:ring-3 focus:ring-[#0057B8]/10 focus:border-[#0057B8] hover:border-[#B8C4DA]
                  data-[placeholder]:text-[#B0BAD1] transition-all duration-150">
                  <SelectValue placeholder="Select recipient type..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDE3EF] shadow-lg">
                  {SUBMITTED_FOR_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v} className="text-sm cursor-pointer">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Country" hint="(optional)" error={errors.country?.message}>
              <Select defaultValue={projectInfo?.country ?? "Kuwait"} onValueChange={(v) => setValue("country", v)}>
                <SelectTrigger className="h-[42px] rounded-lg border-[#DDE3EF] bg-[#FAFBFF] text-sm text-[#0D1626]
                  focus:ring-3 focus:ring-[#0057B8]/10 focus:border-[#0057B8] hover:border-[#B8C4DA]
                  data-[placeholder]:text-[#B0BAD1] transition-all duration-150">
                  <SelectValue placeholder="Select country..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDE3EF] shadow-lg">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm cursor-pointer">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-[#9BA8C0]">
            Fields marked <span className="text-[#0057B8] font-semibold">*</span> are required
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

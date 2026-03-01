"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { ProjectInfoFormData } from "@/types/selection";

const schema = z.object({
  projectName: z.string().min(2, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  unitReference: z.string().min(1, "Unit reference is required"),
  unitTag: z.string().min(1, "Unit tag is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").max(999),
  submittedFor: z.string().min(1, "Submitted for is required"),
  country: z.string().min(2, "Country is required"),
  salesEngineer: z.string().min(2, "Sales engineer name is required"),
});

type SchemaData = z.infer<typeof schema>;

const COUNTRIES = ["Kuwait", "Saudi Arabia", "UAE", "Qatar", "Bahrain", "Oman", "Iraq", "Jordan", "Egypt", "Lebanon"];

export function ProjectInfoForm() {
  const { projectInfo, setProjectInfo, navigateBack, selectedSeries } = useSelectionStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SchemaData>({
    resolver: zodResolver(schema) as any,
    defaultValues: projectInfo ?? {
      projectName: "",
      clientName: "",
      unitReference: "",
      unitTag: `${selectedSeries?.modelPrefix ?? "UNIT"}-01`,
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
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(2)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Project Information</h2>
          <p className="text-muted-foreground text-sm">Enter the project and unit details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Project Name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Al Hamra Village Phase 3" {...register("projectName")} />
            {errors.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Client Name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Gulf Bank K.S.C.P." {...register("clientName")} />
            {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Unit Reference <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Lobby AHU" {...register("unitReference")} />
            {errors.unitReference && <p className="text-xs text-destructive">{errors.unitReference.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Unit Tag <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. AHU-01" {...register("unitTag")} />
            {errors.unitTag && <p className="text-xs text-destructive">{errors.unitTag.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Quantity <span className="text-destructive">*</span></Label>
            <Input type="number" min={1} max={999} {...register("quantity")} />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Submitted For <span className="text-destructive">*</span></Label>
            <Select defaultValue={projectInfo?.submittedFor} onValueChange={(v) => setValue("submittedFor", v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {["End User", "Mechanical Contractor", "General Contractor", "Facilities Management", "Consultant", "Government"].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.submittedFor && <p className="text-xs text-destructive">{errors.submittedFor.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Country <span className="text-destructive">*</span></Label>
            <Select defaultValue={projectInfo?.country ?? "Kuwait"} onValueChange={(v) => setValue("country", v)}>
              <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Sales Engineer <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Ahmed Al-Rashidi" {...register("salesEngineer")} />
            {errors.salesEngineer && <p className="text-xs text-destructive">{errors.salesEngineer.message}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-[#0057B8] hover:bg-[#0057B8]/90">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  );
}

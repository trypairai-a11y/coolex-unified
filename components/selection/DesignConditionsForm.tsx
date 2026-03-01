"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useAuthStore } from "@/lib/stores/auth-store";

const standardSchema = z.object({
  requiredCoolingCapacityBtuh: z.coerce.number().min(6000, "Minimum 6,000 Btu/h").max(6000000),
  powerSupply: z.string().min(1, "Power supply is required"),
  ambientTempF: z.coerce.number().min(59).max(140),
  enteringDBF: z.coerce.number().min(32).max(120),
  enteringWBF: z.coerce.number().min(32).max(100),
  espInWG: z.coerce.number().min(0).max(4),
  electricHeaterKW: z.coerce.number().min(0).max(200),
  altitudeFt: z.coerce.number().min(0).max(15000),
  refrigerant: z.string().optional(),
  // Chiller fields (optional)
  enteringWaterTempF: z.coerce.number().min(32).max(100).optional(),
  leavingWaterTempF: z.coerce.number().min(32).max(95).optional(),
  waterFlowRateGPM: z.coerce.number().min(0).optional(),
  glycolPercent: z.coerce.number().min(0).max(50).optional(),
});

type FormData = z.infer<typeof standardSchema>;

function FieldWithTooltip({ label, tooltip, required, children }: { label: string; tooltip: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-xs">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      {children}
    </div>
  );
}

export function DesignConditionsForm() {
  const { selectedSeries, designConditions, setDesignConditions, navigateBack } = useSelectionStore();
  useAuthStore(); // available for future role-based field gating
  const isChiller = selectedSeries?.isChiller ?? false;
  const isCCU = selectedSeries?.isCCU ?? false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(standardSchema) as any,
    defaultValues: (designConditions as FormData) ?? {
      requiredCoolingCapacityBtuh: 120000,
      powerSupply: "380V/3Ph/60Hz",
      ambientTempF: 115,
      enteringDBF: 80,
      enteringWBF: 67,
      espInWG: 0.5,
      electricHeaterKW: 0,
      altitudeFt: 0,
      ...(isChiller ? { enteringWaterTempF: 54, leavingWaterTempF: 44, waterFlowRateGPM: 24, glycolPercent: 0 } : {}),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    setDesignConditions(data);
  };

  const POWER_SUPPLIES = ["220V/1Ph/60Hz", "380V/3Ph/60Hz", "415V/3Ph/50Hz", "460V/3Ph/60Hz", "480V/3Ph/60Hz"];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(3)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Design Conditions</h2>
          <p className="text-muted-foreground text-sm">
            {selectedSeries?.name} — {selectedSeries?.tonRangeLabel}
            {isChiller && " · Chiller inputs required"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Capacity */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Capacity Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldWithTooltip
              label="Required Cooling Capacity (Btu/h)"
              tooltip="Total cooling capacity required at the design conditions. Used to rank model matches."
              required
            >
              <Input
                type="number"
                placeholder="120,000"
                {...register("requiredCoolingCapacityBtuh")}
                className={errors.requiredCoolingCapacityBtuh ? "border-destructive" : ""}
              />
              {errors.requiredCoolingCapacityBtuh && (
                <p className="text-xs text-destructive">{errors.requiredCoolingCapacityBtuh.message}</p>
              )}
            </FieldWithTooltip>

            <div className="space-y-1.5">
              <Label>Power Supply <span className="text-destructive">*</span></Label>
              <Select defaultValue="380V/3Ph/60Hz" onValueChange={(v) => setValue("powerSupply", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POWER_SUPPLIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Environmental */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Environmental Conditions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldWithTooltip
              label="Outdoor Ambient Temp (°F)"
              tooltip="Design outdoor ambient dry-bulb temperature. Gulf climate: typically 110–125°F."
              required
            >
              <Input type="number" {...register("ambientTempF")} />
              {errors.ambientTempF && <p className="text-xs text-destructive">{errors.ambientTempF.message}</p>}
            </FieldWithTooltip>

            <FieldWithTooltip
              label="Altitude (ft)"
              tooltip="Installation altitude above sea level. Affects capacity and fan performance."
            >
              <Input type="number" {...register("altitudeFt")} />
            </FieldWithTooltip>
          </div>
        </div>

        {/* Evaporator (not CCU) */}
        {!isCCU && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Evaporator Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithTooltip
                label="Entering Dry Bulb (°F)"
                tooltip="Room dry-bulb temperature at the evaporator inlet."
                required
              >
                <Input type="number" {...register("enteringDBF")} />
                {errors.enteringDBF && <p className="text-xs text-destructive">{errors.enteringDBF.message}</p>}
              </FieldWithTooltip>

              <FieldWithTooltip
                label="Entering Wet Bulb (°F)"
                tooltip="Room wet-bulb temperature at the evaporator inlet. Used to calculate latent load."
                required
              >
                <Input type="number" {...register("enteringWBF")} />
                {errors.enteringWBF && <p className="text-xs text-destructive">{errors.enteringWBF.message}</p>}
              </FieldWithTooltip>

              <FieldWithTooltip
                label="External Static Pressure (in. WG)"
                tooltip="Total external static pressure for the duct system. Typical: 0.3–1.5 in. WG."
              >
                <Input type="number" step="0.05" {...register("espInWG")} />
              </FieldWithTooltip>

              <div className="space-y-1.5">
                <Label>Electric Heater (kW)</Label>
                <Input type="number" step="0.5" {...register("electricHeaterKW")} />
              </div>
            </div>
          </div>
        )}

        {/* Chiller-specific */}
        {isChiller && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Hydronic / Chiller Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithTooltip label="Entering Water Temp (°F)" tooltip="Chilled water return temperature entering the evaporator.">
                <Input type="number" {...register("enteringWaterTempF")} />
              </FieldWithTooltip>
              <FieldWithTooltip label="Leaving Water Temp (°F)" tooltip="Chilled water supply temperature leaving the evaporator.">
                <Input type="number" {...register("leavingWaterTempF")} />
              </FieldWithTooltip>
              <FieldWithTooltip label="Water Flow Rate (GPM)" tooltip="Chilled water flow rate through the evaporator.">
                <Input type="number" {...register("waterFlowRateGPM")} />
              </FieldWithTooltip>
              <FieldWithTooltip label="Glycol (%)" tooltip="Ethylene or propylene glycol concentration for freeze protection.">
                <Input type="number" {...register("glycolPercent")} />
              </FieldWithTooltip>
            </div>
          </div>
        )}

        {/* Dual refrigerant */}
        {selectedSeries?.hasDualRefrigerant && (
          <div className="space-y-1.5">
            <Label>Refrigerant</Label>
            <Select onValueChange={(v) => setValue("refrigerant", v)}>
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select refrigerant..." /></SelectTrigger>
              <SelectContent>
                {selectedSeries.refrigerants.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-[#0057B8] hover:bg-[#0057B8]/90">
            Find Models <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  );
}

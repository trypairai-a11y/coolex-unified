"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Info, Thermometer, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { SelectionBasis } from "@/types/selection";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUnitStore } from "@/lib/stores/unit-store";
import { round, toDisplay, toImperial, unitLabel } from "@/lib/utils/unit-conversions";
import { UnitToggle } from "@/components/selection/UnitToggle";

const standardSchema = z.object({
  requiredCoolingCapacityBtuh: z.coerce.number().min(0).max(100000000).optional(),
  requiredAirflowCFM: z.coerce.number().min(0).max(10000000).optional(),
  powerSupply: z.string().min(1, "Power supply is required"),
  enteringDBF: z.coerce.number(),
  enteringWBF: z.coerce.number(),
  espInWG: z.coerce.number().min(0),
  altitudeFt: z.coerce.number().min(0),
  ambientTempF: z.coerce.number().optional(),
  refrigerant: z.string().optional(),
  freshAirPercent: z.coerce.number().min(0).max(100).optional(),
  freshAirDBF: z.coerce.number().optional(),
  freshAirWBF: z.coerce.number().optional(),
  // Chiller fields (optional)
  enteringWaterTempF: z.coerce.number().optional(),
  leavingWaterTempF: z.coerce.number().optional(),
  waterFlowRateGPM: z.coerce.number().min(0).optional(),
  // CCU-only
  saturatedSuctionTempF: z.coerce.number().optional(),
});

type FormData = z.infer<typeof standardSchema>;

function FieldWithTooltip({ label, tooltip, required, filled, children }: { label: string; tooltip: string; required?: boolean; filled?: boolean; children: React.ReactNode }) {
  const showRed = required && !filled;
  return (
    <div className={`space-y-1.5 ${showRed ? "[&_input]:bg-red-50 [&_select]:bg-red-50 [&_input:focus]:bg-white [&_select:focus]:bg-white" : ""}`}>
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

const BASIS_OPTIONS: { value: SelectionBasis; label: string; sublabel: string; description: string; icon: React.ElementType }[] = [
  {
    value: "capacity",
    label: "Capacity",
    sublabel: "TR \u00b7 BTU/h \u00b7 kW",
    description: "Select by required cooling or heating output",
    icon: Thermometer,
  },
  {
    value: "airflow",
    label: "Airflow",
    sublabel: "CFM \u00b7 m\u00b3/h",
    description: "Select by required air volume delivery",
    icon: Wind,
  },
];

// Fields that need conversion when switching unit systems
const CONVERTIBLE_FIELDS = [
  'requiredCoolingCapacityBtuh',
  'requiredAirflowCFM',
  'enteringDBF',
  'enteringWBF',
  'altitudeFt',
  'ambientTempF',
  'espInWG',
  'enteringWaterTempF',
  'leavingWaterTempF',
  'waterFlowRateGPM',
  'freshAirDBF',
  'freshAirWBF',
  'saturatedSuctionTempF',
] as const;


export function DesignConditionsForm() {
  const { selectedSeries, designConditions, setDesignConditions, navigateBack, selectionBasis, setSelectionBasis, projectInfo, updateProjectInfo } = useSelectionStore();
  useAuthStore();
  const { unitSystem } = useUnitStore();
  const prevUnitRef = useRef(unitSystem);
  const isChiller = selectedSeries?.isChiller ?? false;
  const isCCU = selectedSeries?.isCCU ?? false;
  const isFanCoil = selectedSeries?.groupId === 'fan-coil';
  const isSplit = selectedSeries?.groupId === 'split';
  const isCRAC = selectedSeries?.groupId === 'crac';
  const isTHAC = selectedSeries?.id === 'thac';
  const isDHAC = selectedSeries?.id === 'dhac';
  const is50HzOnly = isCCU || isTHAC || isDHAC;

  // Chillers and condensing units are always selected by capacity — never expose the airflow basis.
  useEffect(() => {
    if ((isChiller || isCCU) && selectionBasis !== 'capacity') {
      setSelectionBasis('capacity');
    }
  }, [isChiller, isCCU, selectionBasis, setSelectionBasis]);

  // Default values - always stored in Imperial internally
  const imperialDefaults: FormData = {
    requiredCoolingCapacityBtuh: 120000,
    requiredAirflowCFM: 4000,
    powerSupply: is50HzOnly || projectInfo?.country !== 'Saudi Arabia' ? "400-415V/3Ph/50Hz" : "380-400V/3Ph/60Hz",
    enteringDBF: 80,
    enteringWBF: 67,
    espInWG: 0.5,
    altitudeFt: 0,
    ambientTempF: 95,
    ...(isChiller ? { enteringWaterTempF: 54, leavingWaterTempF: 44, waterFlowRateGPM: 24 } : {}),
    ...(isFanCoil ? { enteringWaterTempF: 54, leavingWaterTempF: 44, waterFlowRateGPM: 24 } : {}),
    ...(isCCU ? { saturatedSuctionTempF: 45 } : {}),
  };

  // Merge saved conditions (imperial) with defaults
  const savedImperial = (designConditions as FormData) ?? imperialDefaults;

  // Convert to display units for initial form values
  const displayDefaults = { ...savedImperial };
  for (const field of CONVERTIBLE_FIELDS) {
    if (displayDefaults[field] != null) {
      displayDefaults[field] = toDisplay(displayDefaults[field] as number, field, unitSystem);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(standardSchema) as any,
    defaultValues: displayDefaults,
  });

  const wAirflow = watch("requiredAirflowCFM");
  const wCapacity = watch("requiredCoolingCapacityBtuh");
  const wDB = watch("enteringDBF");
  const wWB = watch("enteringWBF");
  const wEWT = watch("enteringWaterTempF");
  const wLWT = watch("leavingWaterTempF");
  const wGPM = watch("waterFlowRateGPM");

  // Chillers: user enters EWT (required) and EITHER LWT or GPM. The other is
  // auto-calculated via GPM = 24 × TR / ΔT (water-side balance, °F + GPM).
  // `chillerAnchor` records which field the user typed into so the opposite
  // one is the derived value.
  const [chillerAnchor, setChillerAnchor] = useState<"lwt" | "gpm">("lwt");

  // Tonnage sync (chillers only): 1 TR = 12,000 Btu/h = 3.51685 kW.
  // Local string state lets the user type partial numbers (e.g. "10.") without
  // the derived sync overwriting the decimal while they're typing.
  const KW_PER_TR = 3.51685;
  const [tonsInput, setTonsInput] = useState<string>(() => {
    const initialCap = displayDefaults.requiredCoolingCapacityBtuh;
    if (initialCap == null) return "";
    const tr = unitSystem === "imperial" ? initialCap / 12000 : initialCap / KW_PER_TR;
    return String(round(tr, 2));
  });

  useEffect(() => {
    if (wCapacity == null || (wCapacity as unknown as string) === "") return;
    const capNum = Number(wCapacity);
    if (isNaN(capNum)) return;
    const tr = unitSystem === "imperial" ? capNum / 12000 : capNum / KW_PER_TR;
    const inputNum = parseFloat(tonsInput);
    if (isNaN(inputNum) || Math.abs(inputNum - tr) > 0.01) {
      setTonsInput(String(round(tr, 2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wCapacity, unitSystem]);

  const handleTonsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTonsInput(raw);
    if (raw === "") return;
    const tr = parseFloat(raw);
    if (isNaN(tr)) return;
    const newCap = unitSystem === "imperial" ? tr * 12000 : tr * KW_PER_TR;
    setValue(
      "requiredCoolingCapacityBtuh",
      round(newCap, unitSystem === "imperial" ? 0 : 2) as never,
      { shouldDirty: true, shouldValidate: true }
    );
  };

  // Chiller water-side auto-calc — GPM derived from LWT
  useEffect(() => {
    if (!isChiller) return;
    if (chillerAnchor !== "lwt") return;
    if (wEWT == null || wLWT == null || wCapacity == null) return;
    const ewtNum = Number(wEWT);
    const lwtNum = Number(wLWT);
    const capNum = Number(wCapacity);
    if (isNaN(ewtNum) || isNaN(lwtNum) || isNaN(capNum)) return;
    const ewtF = toImperial(ewtNum, "enteringWaterTempF", unitSystem);
    const lwtF = toImperial(lwtNum, "leavingWaterTempF", unitSystem);
    const capBtuh = toImperial(capNum, "requiredCoolingCapacityBtuh", unitSystem);
    const dT = ewtF - lwtF;
    if (dT <= 0 || capBtuh <= 0) return;
    const tr = capBtuh / 12000;
    const gpm = (24 * tr) / dT;
    if (!isFinite(gpm)) return;
    const next = toDisplay(round(gpm, 2), "waterFlowRateGPM", unitSystem);
    const current = Number(getValues("waterFlowRateGPM") ?? NaN);
    if (isNaN(current) || Math.abs(current - next) > 0.01) {
      setValue("waterFlowRateGPM", next as never, { shouldDirty: true });
    }
  }, [isChiller, chillerAnchor, wEWT, wLWT, wCapacity, unitSystem, getValues, setValue]);

  // Chiller water-side auto-calc — LWT derived from GPM
  useEffect(() => {
    if (!isChiller) return;
    if (chillerAnchor !== "gpm") return;
    if (wEWT == null || wGPM == null || wCapacity == null) return;
    const ewtNum = Number(wEWT);
    const gpmNum = Number(wGPM);
    const capNum = Number(wCapacity);
    if (isNaN(ewtNum) || isNaN(gpmNum) || isNaN(capNum)) return;
    const ewtF = toImperial(ewtNum, "enteringWaterTempF", unitSystem);
    const gpmI = toImperial(gpmNum, "waterFlowRateGPM", unitSystem);
    const capBtuh = toImperial(capNum, "requiredCoolingCapacityBtuh", unitSystem);
    if (gpmI <= 0 || capBtuh <= 0) return;
    const tr = capBtuh / 12000;
    const dT = (24 * tr) / gpmI;
    const lwtF = ewtF - dT;
    if (!isFinite(lwtF)) return;
    const next = toDisplay(round(lwtF, 1), "leavingWaterTempF", unitSystem);
    const current = Number(getValues("leavingWaterTempF") ?? NaN);
    if (isNaN(current) || Math.abs(current - next) > 0.05) {
      setValue("leavingWaterTempF", next as never, { shouldDirty: true });
    }
  }, [isChiller, chillerAnchor, wEWT, wGPM, wCapacity, unitSystem, getValues, setValue]);

  // When unit system changes (from TopBar toggle), convert all visible values in-place
  useEffect(() => {
    const prevSystem = prevUnitRef.current;
    if (prevSystem === unitSystem) return;
    prevUnitRef.current = unitSystem;
    for (const field of CONVERTIBLE_FIELDS) {
      const rawVal = getValues(field as keyof FormData) as number | undefined;
      if (rawVal == null) continue;
      const imperial = toImperial(rawVal, field, prevSystem);
      const converted = toDisplay(imperial, field, unitSystem);
      setValue(field as keyof FormData, converted as never);
    }
  }, [unitSystem, getValues, setValue]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmitWrapped = (data: any) => {
    // Convert all values back to Imperial before storing
    for (const field of CONVERTIBLE_FIELDS) {
      if (data[field] != null) {
        data[field] = toImperial(data[field], field, unitSystem);
      }
    }
    setDesignConditions(data);
  };

  const isThreePhaseOnly = selectedSeries?.id === 'acsc' || selectedSeries?.id === 'acc-bp';
  const isSaudiArabia = projectInfo?.country === 'Saudi Arabia';
  const basePowerSupplies = is50HzOnly
    ? ["400-415V/3Ph/50Hz"]
    : isThreePhaseOnly
    ? ["400-415V/3Ph/50Hz", "380-400V/3Ph/60Hz"]
    : ["230-240V/1Ph/50Hz", "400-415V/3Ph/50Hz", "230V/1Ph/60Hz", "230V/3Ph/60Hz", "380-400V/3Ph/60Hz", "460V/3Ph/60Hz"];
  const filtered50Hz = basePowerSupplies.filter(p => p.includes("50Hz"));
  const filtered60Hz = basePowerSupplies.filter(p => p.includes("60Hz"));
  const POWER_SUPPLIES = isSaudiArabia
    ? (filtered60Hz.length > 0 ? filtered60Hz : basePowerSupplies)
    : (filtered50Hz.length > 0 ? filtered50Hz : basePowerSupplies);

  // Reset the selected power supply if the current value is no longer valid (e.g., after switching to Saudi Arabia).
  useEffect(() => {
    const current = getValues("powerSupply");
    if (current && !POWER_SUPPLIES.includes(current)) {
      setValue("powerSupply", POWER_SUPPLIES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaudiArabia, is50HzOnly, isThreePhaseOnly]);

  const u = (field: string) => unitLabel(field, unitSystem);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(3)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Design Conditions</h2>
          <p className="text-muted-foreground text-sm">
            {selectedSeries?.name} - {selectedSeries?.tonRangeLabel}
            {isChiller && " · Chiller inputs required"}
            {projectInfo?.unitReference && (
              <span className="ml-2 text-xs font-medium text-[#0057B8] bg-[#EBF3FF] px-2 py-0.5 rounded-full">
                Ref: {projectInfo.unitReference}
              </span>
            )}
          </p>
        </div>

        <UnitToggle />
      </div>

      {/* Unit Reference & Quantity */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden mb-6">
        <div className="px-5 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitReference">Unit Reference</Label>
              <Input
                id="unitReference"
                placeholder="e.g. AHU-01, FCU-3A"
                defaultValue={projectInfo?.unitReference ?? ""}
                onChange={(e) => updateProjectInfo({ unitReference: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="unitQuantity">Unit Quantity <span className="text-[#0057B8]">*</span></Label>
              <Input
                id="unitQuantity"
                type="number"
                min={1}
                required
                placeholder="1"
                defaultValue={projectInfo?.quantity ?? 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateProjectInfo({ quantity: val >= 1 ? val : 1 });
                }}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Basis — chillers are always capacity-based, so hide the toggle. */}
      {!isChiller && (
      <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden mb-6">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0F4FB]">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8] mb-0.5">Selection Basis</p>
          <h3 className="text-sm font-semibold text-[#0D1626]">
            Selection will be based on Capacity or Airflow?
            <span className="text-[#0057B8] ml-0.5">*</span>
          </h3>
        </div>
        <div className="px-5 sm:px-6 py-5">
          <div className={`grid grid-cols-1 gap-3 ${isCCU ? '' : 'sm:grid-cols-2'}`}>
            {BASIS_OPTIONS.filter(({ value }) => !(isCCU && value === 'airflow')).map(({ value, label, sublabel, description, icon: Icon }) => {
              const selected = selectionBasis === value;
              const colorMap = {
                capacity: {
                  selected: "border-[#0057B8] bg-[#EBF3FF] shadow-[0_0_0_3px_rgba(0,87,184,0.1)]",
                  unselected: "border-[#B8D4F0] bg-[#F0F7FF] hover:border-[#0057B8] hover:bg-[#E6F0FB]",
                },
                airflow: {
                  selected: "border-[#00875A] bg-[#E6F9F0] shadow-[0_0_0_3px_rgba(0,135,90,0.1)]",
                  unselected: "border-[#A8E6CF] bg-[#F0FFF8] hover:border-[#00875A] hover:bg-[#E0F5EC]",
                },
              };
              const colors = colorMap[value];
              const accent = value === "airflow" ? "#00875A" : "#0057B8";
              const iconBgUnselected = value === "airflow" ? "#E6F9F0" : "#EBF3FF";
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectionBasis(value)}
                  className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none
                    ${selected ? colors.selected : colors.unselected}`}
                >
                  <div className="absolute top-3.5 right-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                    style={selected ? { borderColor: accent, backgroundColor: accent } : { borderColor: "#CBD5E1", backgroundColor: "white" }}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150"
                    style={selected ? { backgroundColor: accent, color: "white" } : { backgroundColor: iconBgUnselected, color: accent }}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: selected ? accent : "#0D1626" }}>
                      {label}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: selected ? `${accent}B3` : "#9BA8C0" }}>
                      {sublabel}
                    </p>
                    <p className="text-[11px] text-[#8894AB] mt-1.5 leading-snug pr-4">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}

      <form onSubmit={handleSubmit(onSubmitWrapped)} className="space-y-6">
        {/* Capacity or Airflow Requirements */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">
            {selectionBasis === 'airflow' ? 'Airflow Requirements' : 'Capacity Requirements'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectionBasis === 'airflow' ? (
              <FieldWithTooltip
                label={`Required Airflow (${u('requiredAirflowCFM')})`}
                tooltip="Total airflow volume required at the design conditions. Used to rank model matches."
                required
                filled={!!wAirflow}
              >
                <Input
                  type="number"
                  step={unitSystem === 'metric' ? "1" : "1"}
                  placeholder={unitSystem === 'imperial' ? "4000" : "6796"}
                  {...register("requiredAirflowCFM")}
                  className={errors.requiredAirflowCFM ? "border-destructive" : ""}
                />
                {errors.requiredAirflowCFM && (
                  <p className="text-xs text-destructive">{errors.requiredAirflowCFM.message}</p>
                )}
              </FieldWithTooltip>
            ) : (
              <>
                <FieldWithTooltip
                  label={`Required Cooling Capacity (${u('requiredCoolingCapacityBtuh')})`}
                  tooltip={isChiller
                    ? `Total cooling capacity required at the design conditions. Synced with Tons (1 TR = 12,000 Btu/h ≈ 3.517 kW).`
                    : "Total cooling capacity required at the design conditions. Used to rank model matches."}
                  required
                  filled={!!wCapacity}
                >
                  <Input
                    type="number"
                    step={unitSystem === 'metric' ? "0.01" : "1"}
                    placeholder={unitSystem === 'imperial' ? "120000" : "35.17"}
                    {...register("requiredCoolingCapacityBtuh")}
                    className={errors.requiredCoolingCapacityBtuh ? "border-destructive" : ""}
                  />
                  {errors.requiredCoolingCapacityBtuh && (
                    <p className="text-xs text-destructive">{errors.requiredCoolingCapacityBtuh.message}</p>
                  )}
                </FieldWithTooltip>
                {isChiller && (
                  <FieldWithTooltip
                    label="Required Cooling Capacity (Tons)"
                    tooltip="Tons of refrigeration. Automatically synced with the Btu/h (or kW) field — edit either one."
                    required
                    filled={!!tonsInput && tonsInput !== "0"}
                  >
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="10"
                      value={tonsInput}
                      onChange={handleTonsChange}
                    />
                  </FieldWithTooltip>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label>Power Supply <span className="text-destructive">*</span></Label>
              <Select
                value={getValues("powerSupply") || POWER_SUPPLIES[0]}
                onValueChange={(v) => setValue("powerSupply", v)}
              >
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
              label={`Altitude (${u('altitudeFt')})`}
              tooltip="Installation altitude above sea level. Affects capacity and fan performance."
            >
              <Input type="number" {...register("altitudeFt")} />
            </FieldWithTooltip>
            {!isFanCoil && (
              <FieldWithTooltip
                label={`Ambient Temperature (${u('ambientTempF')})`}
                tooltip="Outdoor ambient dry-bulb temperature at design conditions. Affects condenser and chiller performance."
              >
                <Input type="number" step="0.1" {...register("ambientTempF")} />
                <div className="flex gap-2 pt-1">
                  {[
                    { label: "T1", ambientF: 95, dbF: 80, wbF: 67 },
                    { label: "T3", ambientF: 115, dbF: 84, wbF: 67 },
                    { label: "T4", ambientF: 118, dbF: 80, wbF: 67 },
                  ].filter(({ label }) => projectInfo?.country === "Kuwait" || label !== "T4").map(({ label, ambientF, dbF, wbF }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setValue("ambientTempF", toDisplay(ambientF, "ambientTempF", unitSystem), { shouldDirty: true });
                        setValue("enteringDBF", toDisplay(dbF, "enteringDBF", unitSystem), { shouldDirty: true });
                        setValue("enteringWBF", toDisplay(wbF, "enteringWBF", unitSystem), { shouldDirty: true });
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-md border border-[#B8D4F0] bg-[#F0F7FF] text-[#0057B8] hover:bg-[#E6F0FB] hover:border-[#0057B8] transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FieldWithTooltip>
            )}
            {isCCU && (
              <FieldWithTooltip
                label={`Saturated Suction Temperature (${u('saturatedSuctionTempF')})`}
                tooltip="Evaporator saturated suction temperature (SST). Typical range: 20–50 °F depending on application (comfort cooling, medium temp, etc.)."
              >
                <Input type="number" step="0.1" {...register("saturatedSuctionTempF")} />
              </FieldWithTooltip>
            )}
          </div>
        </div>

        {/* Evaporator (not CCU, not chiller) */}
        {!isCCU && !isChiller && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Evaporator Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithTooltip
                label={`Entering Dry Bulb (${u('enteringDBF')})`}
                tooltip="Room dry-bulb temperature at the evaporator inlet."
                required
                filled={wDB != null && String(wDB) !== ""}
              >
                <Input type="number" step="0.1" {...register("enteringDBF")} />
                {errors.enteringDBF && <p className="text-xs text-destructive">{errors.enteringDBF.message}</p>}
              </FieldWithTooltip>

              <FieldWithTooltip
                label={`Entering Wet Bulb (${u('enteringWBF')})`}
                tooltip="Room wet-bulb temperature at the evaporator inlet. Used to calculate latent load."
                required
                filled={wWB != null && String(wWB) !== ""}
              >
                <Input type="number" step="0.1" {...register("enteringWBF")} />
                {errors.enteringWBF && <p className="text-xs text-destructive">{errors.enteringWBF.message}</p>}
              </FieldWithTooltip>

              {isFanCoil && (
                <>
                  <FieldWithTooltip
                    label={`Entering Water Temp (${u('enteringWaterTempF')})`}
                    tooltip="Chilled water return temperature entering the coil."
                    required
                    filled={wEWT != null && String(wEWT) !== ""}
                  >
                    <Input type="number" step="0.1" {...register("enteringWaterTempF")} />
                  </FieldWithTooltip>
                  <FieldWithTooltip
                    label={`Leaving Water Temp (${u('leavingWaterTempF')})`}
                    tooltip="Chilled water supply temperature leaving the coil."
                    required
                    filled={wLWT != null && String(wLWT) !== ""}
                  >
                    <Input type="number" step="0.1" {...register("leavingWaterTempF")} />
                  </FieldWithTooltip>
                  <FieldWithTooltip
                    label={`Water Flow Rate (${u('waterFlowRateGPM')})`}
                    tooltip="Chilled water flow rate through the coil."
                  >
                    <Input type="number" step="0.01" {...register("waterFlowRateGPM")} />
                  </FieldWithTooltip>
                </>
              )}

              <FieldWithTooltip
                label={`External Static Pressure (${u('espInWG')})`}
                tooltip={unitSystem === 'imperial'
                  ? "Total external static pressure for the duct system. Typical: 0.3–1.5 in. WG."
                  : "Total external static pressure for the duct system. Typical: 75–375 Pa."}
              >
                <Input type="number" step={unitSystem === 'imperial' ? "0.05" : "1"} {...register("espInWG")} />
              </FieldWithTooltip>

            </div>
          </div>
        )}

        {/* Fresh Air Requirements */}
        {!isCCU && !isChiller && !isFanCoil && !isSplit && !isCRAC && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Fresh Air Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWithTooltip
                label="Airflow Rate (%)"
                tooltip="Fresh (outdoor) air as a percentage of total supply airflow. Typical: 10–30%."
              >
                <Input type="number" step="1" min={0} max={100} placeholder="0" {...register("freshAirPercent")} />
              </FieldWithTooltip>
              <FieldWithTooltip
                label={`Dry Bulb (${u('freshAirDBF')})`}
                tooltip="Outdoor air dry-bulb temperature entering the mixing box."
              >
                <Input type="number" step="0.1" {...register("freshAirDBF")} />
              </FieldWithTooltip>
              <FieldWithTooltip
                label={`Wet Bulb (${u('freshAirWBF')})`}
                tooltip="Outdoor air wet-bulb temperature entering the mixing box. Used for latent load on the mixed-air coil."
              >
                <Input type="number" step="0.1" {...register("freshAirWBF")} />
              </FieldWithTooltip>
            </div>
          </div>
        )}

        {/* Chiller-specific */}
        {isChiller && (() => {
          const lwtFilled = wLWT != null && String(wLWT) !== "";
          const gpmFilled = wGPM != null && String(wGPM) !== "";
          const eitherFilled = lwtFilled || gpmFilled;
          return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Hydronic / Chiller Conditions</h3>
            <p className="text-xs text-muted-foreground -mt-2">
              Enter the entering water temp, then either the leaving water temp <em>or</em> the water flow rate — the other is calculated for you using <span className="font-mono">GPM = 24 × TR / ΔT</span>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWithTooltip
                label={`Entering Water Temp (${u('enteringWaterTempF')})`}
                tooltip="Chilled water return temperature entering the evaporator."
                required
                filled={wEWT != null && String(wEWT) !== ""}
              >
                <Input type="number" step="0.1" {...register("enteringWaterTempF")} />
              </FieldWithTooltip>
              <FieldWithTooltip
                label={`Leaving Water Temp (${u('leavingWaterTempF')})`}
                tooltip="Chilled water supply temperature leaving the evaporator. Auto-calculated from the flow rate if you enter that instead."
                required
                filled={eitherFilled}
              >
                <Input
                  type="number"
                  step="0.1"
                  {...register("leavingWaterTempF", {
                    onChange: () => setChillerAnchor("lwt"),
                  })}
                />
                {chillerAnchor === "gpm" && (
                  <p className="text-[11px] text-muted-foreground">Auto-calculated from flow rate</p>
                )}
              </FieldWithTooltip>
              <FieldWithTooltip
                label={`Water Flow Rate (${u('waterFlowRateGPM')})`}
                tooltip="Chilled water flow rate through the evaporator. Auto-calculated from the leaving water temp if you enter that instead."
                required
                filled={eitherFilled}
              >
                <Input
                  type="number"
                  step="0.01"
                  {...register("waterFlowRateGPM", {
                    onChange: () => setChillerAnchor("gpm"),
                  })}
                />
                {chillerAnchor === "lwt" && (
                  <p className="text-[11px] text-muted-foreground">Auto-calculated from leaving water temp</p>
                )}
              </FieldWithTooltip>
            </div>
          </div>
          );
        })()}

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

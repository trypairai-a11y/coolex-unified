"use client";

import { useState } from "react";
import { Upload, Save, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PRODUCT_GROUPS } from "@/lib/mock-data/product-groups";
import { PRODUCT_SERIES } from "@/lib/mock-data/product-series";

interface PriceRow {
  modelPrefix: string;
  seriesName: string;
  basePriceKWD: number;
  editing: boolean;
  draftPrice: number;
}

function buildInitialPrices(): PriceRow[] {
  return PRODUCT_SERIES.map(s => ({
    modelPrefix: s.modelPrefix,
    seriesName: s.name,
    basePriceKWD: Math.round(((s.minTons + s.maxTons) / 2) * 185),
    editing: false,
    draftPrice: Math.round(((s.minTons + s.maxTons) / 2) * 185),
  }));
}

const HISTORY = [
  { label: "Price List v3.2", date: "2026-02-01", by: "Admin User" },
  { label: "Price List v3.1", date: "2025-11-15", by: "Admin User" },
  { label: "Price List v3.0", date: "2025-08-01", by: "Admin User" },
];

export function PriceListManager() {
  const { showToast, ToastComponent } = useToast();
  const [prices, setPrices] = useState<PriceRow[]>(buildInitialPrices());

  const startEdit = (prefix: string) => {
    setPrices(p => p.map(r => r.modelPrefix === prefix ? { ...r, editing: true, draftPrice: r.basePriceKWD } : r));
  };

  const cancelEdit = (prefix: string) => {
    setPrices(p => p.map(r => r.modelPrefix === prefix ? { ...r, editing: false } : r));
  };

  const saveEdit = (prefix: string) => {
    setPrices(p => p.map(r => r.modelPrefix === prefix ? { ...r, editing: false, basePriceKWD: r.draftPrice } : r));
    showToast("Price updated", "success");
  };

  const updateDraft = (prefix: string, val: string) => {
    setPrices(p => p.map(r => r.modelPrefix === prefix ? { ...r, draftPrice: Number(val) } : r));
  };

  const handleImport = () => {
    showToast("Mock import successful — price list v3.3 loaded", "success");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-1" /> Import from Excel
          </Button>
          <div className="text-sm text-muted-foreground">
            Version history:
            <select className="ml-2 text-sm border rounded px-2 py-0.5">
              {HISTORY.map(h => (
                <option key={h.label}>{h.label} — {h.date}</option>
              ))}
            </select>
          </div>
        </div>
        <Badge variant="secondary">KWD pricing</Badge>
      </div>

      {/* Tabs per product group */}
      <Tabs defaultValue={PRODUCT_GROUPS[0].id}>
        <TabsList className="flex-wrap h-auto gap-1 mb-4">
          {PRODUCT_GROUPS.map(g => (
            <TabsTrigger key={g.id} value={g.id} className="text-xs">{g.name}</TabsTrigger>
          ))}
        </TabsList>

        {PRODUCT_GROUPS.map(group => {
          const groupSeries = PRODUCT_SERIES.filter(s => s.groupId === group.id);
          const groupPrices = prices.filter(p => groupSeries.some(s => s.modelPrefix === p.modelPrefix));

          return (
            <TabsContent key={group.id} value={group.id}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{group.name} — Base Prices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {["Series", "Model Prefix", "Base Price (KWD / Nominal Ton)", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupPrices.map((row, i) => (
                          <tr key={row.modelPrefix} className={`border-t ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                            <td className="px-4 py-3 font-medium">{row.seriesName}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.modelPrefix}</td>
                            <td className="px-4 py-3">
                              {row.editing ? (
                                <Input
                                  type="number"
                                  className="h-8 w-32 text-sm"
                                  value={row.draftPrice}
                                  onChange={e => updateDraft(row.modelPrefix, e.target.value)}
                                  autoFocus
                                />
                              ) : (
                                <span className="font-semibold text-[#0057B8]">KWD {row.basePriceKWD.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {row.editing ? (
                                <div className="flex items-center gap-1 justify-end">
                                  <Button size="sm" onClick={() => saveEdit(row.modelPrefix)} className="h-7 bg-[#0057B8] hover:bg-[#0057B8]/90">
                                    <Save className="w-3 h-3 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => cancelEdit(row.modelPrefix)} className="h-7">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => startEdit(row.modelPrefix)} className="h-7">
                                  <Edit3 className="w-3 h-3 mr-1" /> Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {ToastComponent}
    </div>
  );
}

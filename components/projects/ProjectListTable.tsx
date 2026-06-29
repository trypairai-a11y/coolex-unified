"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, FolderOpen, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { Project, ProjectStatus } from "@/types/project";

const STATUS_VARIANTS: Record<ProjectStatus, "default" | "secondary" | "success" | "warning" | "outline" | "destructive"> = {
  draft: "secondary",
  active: "default",
  submitted: "warning",
  approved: "success",
  archived: "outline",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

type SortKey = "name" | "id" | "clientName" | "updatedAt" | "status";

export function ProjectListTable() {
  const { data: projects, isLoading } = useProjects();
  const { reset } = useSelectionStore();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = (projects ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.salesEngineer.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    return av < bv ? -dir : av > bv ? dir : 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Export the currently-filtered/sorted project list to an .xlsx file.
  // Mirrors the on-screen columns and adds a unit count + total quantity.
  const handleExport = async () => {
    if (!sorted.length) return;
    const XLSX = await import("xlsx");
    const rows = sorted.map((p) => ({
      Project: p.name,
      "Project ID": p.displayId ?? p.id,
      Client: p.clientName,
      Engineer: p.salesEngineer,
      Country: p.country,
      Status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
      Units: p.units.length,
      "Total Quantity": p.units.reduce((sum, u) => sum + (u.quantity ?? 0), 0),
      "Submitted For": p.submittedFor,
      Created: formatDate(p.createdAt),
      "Last Modified": formatDate(p.updatedAt),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 16 },
      { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    const stamp = new Intl.DateTimeFormat("en-CA").format(new Date()); // YYYY-MM-DD
    XLSX.writeFile(workbook, `COOLEX-Projects-${stamp}.xlsx`);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/select" onClick={reset}>
          <Button className="bg-[#0057B8] hover:bg-[#0057B8]/90">
            <Plus className="w-4 h-4 mr-1" /> New Project
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isLoading || sorted.length === 0}
          title="Download the project list as an Excel file"
        >
          <Download className="w-4 h-4 mr-1" /> Export to Excel
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No projects found</p>
          {search && <p className="text-xs mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  { label: "Project ID", key: "id" as SortKey },
                  { label: "Project", key: "name" as SortKey },
                  { label: "Client", key: "clientName" as SortKey },
                  { label: "Engineer", key: null },
                  { label: "Units", key: null },
                  { label: "Last Modified", key: "updatedAt" as SortKey },
                  { label: "Status", key: "status" as SortKey },
                  { label: "", key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap ${key ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                    onClick={() => key && handleSort(key)}
                  >
                    {label}{key && <SortIcon k={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((project: Project) => (
                <tr key={project.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{project.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{project.name}</div>
                    <div className="text-xs text-muted-foreground">{project.country}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{project.clientName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{project.salesEngineer}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{project.units.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(project.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[project.status]} className="capitalize">{project.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#0057B8] hover:text-[#0057B8]">Open →</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

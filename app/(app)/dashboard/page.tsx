"use client";

import Link from "next/link";
import { Zap, ArrowRight, FileText, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentProjectsList } from "@/components/dashboard/RecentProjectsList";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSelectionStore } from "@/lib/stores/selection-store";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { reset } = useSelectionStore();
  const firstName = user?.name.split(" ")[0] ?? "there";

  const handleNewSelection = () => reset();

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0A1628] px-6 py-7 sm:px-8 sm:py-8">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0057B8]/20 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-[#00A3E0]/10 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-[#0057B8]/15 blur-2xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-white/50 text-sm mt-1.5 font-medium">
              COOLEX Unified Selection Platform
            </p>
          </div>
          <Link href="/select" onClick={handleNewSelection} className="shrink-0">
            <Button
              size="lg"
              className="bg-[#0057B8] hover:bg-[#0063d0] text-white gap-2 shadow-lg shadow-blue-900/40 font-semibold px-6"
            >
              <Zap className="w-4 h-4" />
              New Selection
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Recent Projects */}
      <div className="cx-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E0ECFF] flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-[#0057B8]" />
            </div>
            <span className="text-sm font-semibold text-foreground">Recent Projects</span>
          </div>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-[#0057B8] hover:text-[#0057B8] h-7 text-xs gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="px-5 py-4">
          <RecentProjectsList />
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: LayoutGrid,
            title: "7 Product Groups",
            desc: "Rooftop Packaged, Split, Chiller, VRF, Fan Coil, Condensing Unit, CRAC",
            href: "/select",
            accent: "#0057B8",
            bg: "#E8F2FF",
          },
          {
            icon: Zap,
            title: "Smart Selection",
            desc: "Enter design conditions and get matched models ranked by fit percentage",
            href: "/select",
            accent: "#00A3E0",
            bg: "#E0F5FF",
          },
          {
            icon: FileText,
            title: "PDF Submittals",
            desc: "Generate branded 6-page submittals instantly with full revision tracking",
            href: "/projects",
            accent: "#4A6FBF",
            bg: "#EEF2FF",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group cx-card p-5 flex flex-col gap-3 no-underline hover:border-[#0057B8]/20"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: card.bg }}>
                <Icon className="w-4 h-4" style={{ color: card.accent }} />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">{card.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.desc}</div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: card.accent }}>
                Get started <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

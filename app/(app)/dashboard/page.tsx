"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentProjectsList } from "@/components/dashboard/RecentProjectsList";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSelectionStore } from "@/lib/stores/selection-store";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { reset } = useSelectionStore();

  const handleNewSelection = () => {
    reset();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            COOLEX Unified Selector — {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/select" onClick={handleNewSelection}>
          <Button size="lg" className="bg-[#0057B8] hover:bg-[#0057B8]/90 gap-2 shadow-md">
            <Zap className="w-4 h-4" />
            Start New Selection
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-[#0057B8] hover:text-[#0057B8]">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <RecentProjectsList />
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "8 Product Groups",
            desc: "Select from Packaged, Split, Chiller, CCU, Precision Cooling, and more",
            href: "/select",
            color: "bg-blue-50 border-blue-100",
          },
          {
            title: "16 Equipment Series",
            desc: "Each series optimized for specific applications — from rooftops to data centers",
            href: "/select",
            color: "bg-cyan-50 border-cyan-100",
          },
          {
            title: "In-Browser Submittals",
            desc: "Generate branded 6-page PDF submittals instantly, with revision tracking",
            href: "/projects",
            color: "bg-indigo-50 border-indigo-100",
          },
        ].map((tip) => (
          <Link key={tip.title} href={tip.href} className={`rounded-xl border p-4 ${tip.color} hover:shadow-sm transition-shadow`}>
            <div className="font-semibold text-sm text-foreground">{tip.title}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</div>
            <div className="flex items-center gap-1 mt-3 text-[#0057B8] text-xs font-medium">
              Get started <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

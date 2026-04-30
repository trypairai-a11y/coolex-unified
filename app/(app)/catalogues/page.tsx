"use client";

import { BookOpen } from "lucide-react";

export default function CataloguesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#0057B8]/8 border border-[#0057B8]/15 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#0057B8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogues</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse product catalogues and technical literature.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center py-24 text-muted-foreground">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 opacity-30" />
        </div>
        <p className="font-medium">No catalogues yet</p>
        <p className="text-sm mt-1 text-muted-foreground/70">
          Product catalogues will appear here once published.
        </p>
      </div>
    </div>
  );
}

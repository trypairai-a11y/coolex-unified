"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  onClose?: () => void
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
        type === "success" && "bg-green-600 text-white",
        type === "error" && "bg-destructive text-white",
        type === "info" && "bg-primary text-primary-foreground"
      )}
    >
      {message}
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      )}
    </div>
  )
}

// Simple toast hook
export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  const showToast = React.useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null

  return { showToast, ToastComponent }
}

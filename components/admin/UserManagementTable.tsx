"use client";

import { useState } from "react";
import { Search, UserPlus, Check, X, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/components/ui/toast";
import type { User, UserRole, UserStatus } from "@/types/user";

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  engineer: "secondary",
  dealer: "outline",
};

const STATUS_VARIANTS: Record<UserStatus, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  pending: "warning",
  deactivated: "destructive",
};

function formatDate(iso?: string) {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export function UserManagementTable() {
  const { data: users, isLoading } = useUsers();
  const { showToast, ToastComponent } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("engineer");

  const filtered = (users ?? []).filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleApprove = (user: User) => {
    showToast(`${user.name} approved as Dealer`, "success");
  };

  const handleDeactivate = (user: User) => {
    showToast(`${user.name} deactivated`, "info");
  };

  const handleInvite = () => {
    showToast(`Invitation sent to ${inviteEmail}`, "success");
    setInviteOpen(false);
    setInviteEmail("");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="engineer">Engineer</SelectItem>
            <SelectItem value="dealer">Dealer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setInviteOpen(true)} className="bg-[#0057B8] hover:bg-[#0057B8]/90">
          <UserPlus className="w-4 h-4 mr-1" /> Invite User
        </Button>
      </div>

      {/* Pending alert */}
      {(users ?? []).some(u => u.status === "pending") && (
        <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {(users ?? []).filter(u => u.status === "pending").length} dealer registration{(users ?? []).filter(u => u.status === "pending").length > 1 ? "s" : ""} awaiting approval
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "Email", "Company", "Role", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user: User) => (
                <tr key={user.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANTS[user.role]} className="capitalize">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[user.status]} className="capitalize">{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.lastLogin)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(user)} className="h-7 text-green-600 border-green-200 hover:bg-green-50">
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                      )}
                      {user.status === "active" && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeactivate(user)} className="h-7 text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3 mr-1" /> Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} className="bg-[#0057B8] hover:bg-[#0057B8]/90" disabled={!inviteEmail}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ToastComponent}
    </div>
  );
}

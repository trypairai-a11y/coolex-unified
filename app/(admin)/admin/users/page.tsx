import { UserManagementTable } from "@/components/admin/UserManagementTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage user accounts, roles, and access permissions</p>
      </div>
      <UserManagementTable />
    </div>
  );
}

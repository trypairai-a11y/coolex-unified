import { ProjectListTable } from "@/components/projects/ProjectListTable";

export default function ProjectsPage() {
  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage equipment selection projects and submittals</p>
      </div>
      <ProjectListTable />
    </div>
  );
}

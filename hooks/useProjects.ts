import { useProjectsStore } from '@/lib/stores/projects-store';

export function useProjects() {
  const projects = useProjectsStore(s => s.projects);
  return { data: projects, isLoading: false };
}

export function useProject(id: string | null) {
  const projects = useProjectsStore(s => s.projects);
  const project = id ? projects.find(p => p.id === id) : undefined;
  return { data: project, isLoading: false };
}

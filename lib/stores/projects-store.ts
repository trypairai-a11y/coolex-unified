import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { MOCK_PROJECTS } from '@/lib/mock-data/projects';
import type { Project, Unit, Revision } from '@/types/project';

interface ProjectsState {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'units'>>) => void;
  deleteProject: (projectId: string) => void;
  addUnit: (projectId: string, unit: Unit) => void;
  addRevision: (projectId: string, unitId: string, revision: Revision) => void;
  updateUnitSubmittal: (projectId: string, unitId: string, submittalData: Unit['submittalData']) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    persist(
      (set) => ({
        projects: MOCK_PROJECTS,

        addProject: (project) =>
          set((state) => ({ projects: [...state.projects, project] })),

        updateProject: (projectId, updates) =>
          set((state) => ({
            projects: state.projects.map((p) => {
              if (p.id !== projectId) return p;
              return { ...p, ...updates, updatedAt: new Date().toISOString() };
            }),
          })),

        deleteProject: (projectId) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
          })),

        addUnit: (projectId, unit) =>
          set((state) => ({
            projects: state.projects.map((p) => {
              if (p.id !== projectId) return p;
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                units: [...p.units, unit],
              };
            }),
          })),

        addRevision: (projectId, unitId, revision) =>
          set((state) => ({
            projects: state.projects.map((p) => {
              if (p.id !== projectId) return p;
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                units: p.units.map((u) => {
                  if (u.id !== unitId) return u;
                  return {
                    ...u,
                    currentRevision: revision.revisionNumber,
                    revisions: [
                      ...u.revisions.map((r) =>
                        r.status === 'issued' ? { ...r, status: 'superseded' as const } : r
                      ),
                      revision,
                    ],
                  };
                }),
              };
            }),
          })),

        updateUnitSubmittal: (projectId, unitId, submittalData) =>
          set((state) => ({
            projects: state.projects.map((p) => {
              if (p.id !== projectId) return p;
              return {
                ...p,
                units: p.units.map((u) => {
                  if (u.id !== unitId) return u;
                  return { ...u, submittalData };
                }),
              };
            }),
          })),
      }),
      {
        name: 'coolex-projects',
        onRehydrateStorage: () => (state) => {
          if (!state || !Array.isArray(state.projects)) {
            useProjectsStore.setState({ projects: MOCK_PROJECTS });
          }
        },
      }
    ),
    { name: 'ProjectsStore' }
  )
);

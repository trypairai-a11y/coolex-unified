import type { Model } from './product';

export type ProjectStatus = 'draft' | 'active' | 'submitted' | 'approved' | 'archived';
export type RevisionStatus = 'draft' | 'issued' | 'superseded';

export interface Revision {
  id: string;
  unitId: string;
  revisionNumber: string;
  createdAt: string;
  createdBy: string;
  changeSummary: string;
  status: RevisionStatus;
  submittalUrl?: string;
}

export interface Unit {
  id: string;
  projectId: string;
  tag: string;
  reference: string;
  seriesId: string;
  seriesName: string;
  model: Model;
  quantity: number;
  revisions: Revision[];
  currentRevision: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  salesEngineer: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  units: Unit[];
  country: string;
  submittedFor: string;
}

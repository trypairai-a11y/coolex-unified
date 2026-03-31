import type { Model } from './product';
import type { DesignConditionsFormData } from './selection';
import type { SubmittalOption } from './submittal';

export type ProjectStatus = 'draft' | 'active' | 'submitted' | 'approved' | 'archived';
export type RevisionStatus = 'draft' | 'issued' | 'superseded';

/** Snapshot of submittal data captured when a revision is generated */
export interface SubmittalSnapshot {
  designConditions: DesignConditionsFormData;
  selectedOptions: SubmittalOption[];
  basePriceKWD: number;
  optionsTotalKWD: number;
  discountPercent: number;
  netTotalKWD: number;
  oracleBOM?: string;
  generatedBy: string;
}

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
  /** Latest submittal data snapshot — updated on each revision generation */
  submittalData?: SubmittalSnapshot;
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

import type { VRFIndoorType } from '@/types/selection';
import {
  VRF_DUCTED_LOW_STATIC_SPECS,
  VRF_DUCTED_LOW_STATIC_COMMON,
} from './vrf-ducted-low-static-performance';
import {
  VRF_WALL_MOUNTED_SPECS,
  VRF_WALL_MOUNTED_COMMON,
} from './vrf-wall-mounted-performance';
import {
  VRF_CASSETTE_SPECS,
  VRF_CASSETTE_COMMON,
} from './vrf-cassette-performance';
import {
  VRF_DUCTED_INVERTER_SPECS,
  VRF_DUCTED_INVERTER_COMMON,
} from './vrf-ducted-inverter-performance';
import {
  VRF_DUCTED_HIGH_STATIC_SPECS,
  VRF_DUCTED_HIGH_STATIC_COMMON,
} from './vrf-ducted-high-static-performance';

/**
 * Registry of VRF indoor units that have a real catalogue (model number + rated
 * specs), keyed by the wizard's VRFIndoorType. Indoor types not listed here are
 * still synthesized from generic profiles in the wizard.
 *
 * Each per-type catalogue file (vrf-*-performance.ts) exposes the same
 * normalized spec / common shape, so this registry treats them uniformly — the
 * design step, system diagram, and performance panel all read through these
 * helpers, and adding a new catalogue type is one entry below.
 */

/** A single catalogue row, normalized across every VRF indoor type. */
export interface VRFIndoorSpec {
  nominalKbtuh: number;
  modelNumber: string;
  coolingCapacityKW: number;
  coolingCapacityBtuh: number;
  heatingCapacityKW: number;
  heatingCapacityBtuh: number;
  fanMotorWatts: number;
  fanMotorWattsLabel: string;
  airflowCFM: number;
  coilRows: number;
  /** Unit body weight (kg). Absent when the catalogue lists only a panel weight. */
  bodyWeightKg?: number;
  /** Connecting gas pipe diameter (per model). */
  gasPipe: string;
  /** Connecting liquid pipe diameter (per model). */
  liquidPipe: string;
}

/** Specs common to every model within a catalogue. */
export interface VRFIndoorCommon {
  powerSupply: string;
  expansionDevice: string;
  evaporatorCoil: string;
  drainPipe: string;
  controller: string;
  /** Decorative-panel weights (cassette units ship the panel separately). */
  panelNetKg?: number;
  panelGrossKg?: number;
}

export interface VRFIndoorCatalog {
  type: VRFIndoorType;
  /** Human label for the performance panel header. */
  title: string;
  specs: VRFIndoorSpec[];
  common: VRFIndoorCommon;
  byCapacity: Record<number, VRFIndoorSpec>;
}

function index(specs: VRFIndoorSpec[]): Record<number, VRFIndoorSpec> {
  return Object.fromEntries(specs.map((s) => [s.nominalKbtuh, s]));
}

const CATALOGS: Partial<Record<VRFIndoorType, VRFIndoorCatalog>> = {
  'ducted-split-low-static': {
    type: 'ducted-split-low-static',
    title: 'Ducted Split — Low Static (Ceiling Concealed)',
    specs: VRF_DUCTED_LOW_STATIC_SPECS,
    common: VRF_DUCTED_LOW_STATIC_COMMON,
    byCapacity: index(VRF_DUCTED_LOW_STATIC_SPECS),
  },
  'wall-mounted': {
    type: 'wall-mounted',
    title: 'Wall Mounted',
    specs: VRF_WALL_MOUNTED_SPECS,
    common: VRF_WALL_MOUNTED_COMMON,
    byCapacity: index(VRF_WALL_MOUNTED_SPECS),
  },
  cassette: {
    type: 'cassette',
    title: 'Cassette (Ceiling Recessed)',
    specs: VRF_CASSETTE_SPECS,
    common: VRF_CASSETTE_COMMON,
    byCapacity: index(VRF_CASSETTE_SPECS),
  },
  'ducted-split-inverter': {
    type: 'ducted-split-inverter',
    title: 'Ducted Split — Inverter',
    specs: VRF_DUCTED_INVERTER_SPECS,
    common: VRF_DUCTED_INVERTER_COMMON,
    byCapacity: index(VRF_DUCTED_INVERTER_SPECS),
  },
  'ducted-split-high-static': {
    type: 'ducted-split-high-static',
    title: 'Ducted Split — High Static',
    specs: VRF_DUCTED_HIGH_STATIC_SPECS,
    common: VRF_DUCTED_HIGH_STATIC_COMMON,
    byCapacity: index(VRF_DUCTED_HIGH_STATIC_SPECS),
  },
};

/** The catalogue for an indoor type, or undefined if that type is synthesized. */
export function getVRFIndoorCatalog(
  type: VRFIndoorType | undefined,
): VRFIndoorCatalog | undefined {
  return type ? CATALOGS[type] : undefined;
}

/** Whether an indoor type is backed by a real catalogue. */
export function isVRFIndoorCatalogType(type: VRFIndoorType | undefined): boolean {
  return !!getVRFIndoorCatalog(type);
}

/** Catalogue spec for an indoor type + marketing capacity class (kBTU/h). */
export function getVRFIndoorSpec(
  type: VRFIndoorType | undefined,
  nominalKbtuh: number,
): VRFIndoorSpec | undefined {
  return getVRFIndoorCatalog(type)?.byCapacity[nominalKbtuh];
}

/** Catalogue model number for an indoor type + capacity, or undefined. */
export function getVRFIndoorModelNumber(
  type: VRFIndoorType | undefined,
  nominalKbtuh: number,
): string | undefined {
  return getVRFIndoorSpec(type, nominalKbtuh)?.modelNumber;
}

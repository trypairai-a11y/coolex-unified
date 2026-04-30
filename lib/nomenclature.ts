/**
 * COOLEX Nomenclature Engine
 *
 * Decodes model numbers into meaningful segments and generates
 * full Oracle BOM nomenclature codes including selected options.
 *
 * Format: [SERIES]-[CAPACITY]-[CONFIG]-[REFRIG]-[VOLTAGE][/OPT1/OPT2/...]
 */

// ── Segment definition ──────────────────────────────────────────────────────

export interface NomenclatureSegment {
  /** Short code shown in the breakdown (e.g. "026") */
  code: string;
  /** What this segment represents (e.g. "Capacity Code") */
  label: string;
  /** Human-readable meaning (e.g. "26 MBH nominal") */
  meaning: string;
  /** Tailwind color class for the visual chip */
  color: string;
}

export interface NomenclatureResult {
  /** The base model number as-is */
  modelNumber: string;
  /** Ordered segments that make up the model number */
  segments: NomenclatureSegment[];
  /** Full Oracle BOM code (base + voltage + option suffixes) */
  oracleBOM: string;
  /** Just the option suffix codes array */
  optionCodes: string[];
}

// ── Option code mapping (option id → Oracle BOM suffix) ─────────────────────

export const OPTION_BOM_CODES: Record<string, string> = {
  'ss-drain':        'SSDP',
  'ss-coil':         'ECEV',
  'louvered':        'LGCD',
  'vibration-iso':   'VISP',
  'hail-guard':      'HGCD',
  'cond-coil-coat':  'CCCD',
  'nema4-ctrls':     'N4CP',
  'phase-mon':       'PMRL',
  'gfci':            'GFOT',
  'dual-power':      'DPPE',
  'hgbp':            'HGBP',
  'suction-acc':     'SASL',
  'oil-sep':         'OSIL',
  'liquid-recv':     'LRFS',
  'filter-dryer':    'FDRC',
  'bacnet':          'BNMS',
  'modbus':          'MBRT',
  'remote-mon':      'RMGW',
  'econ-ctrl':       'ECEM',
};

// ── Color palette for segments ──────────────────────────────────────────────

const C = {
  series:   'bg-blue-100 text-blue-800 border-blue-300',
  capacity: 'bg-amber-100 text-amber-800 border-amber-300',
  config:   'bg-emerald-100 text-emerald-800 border-emerald-300',
  refrig:   'bg-purple-100 text-purple-800 border-purple-300',
  voltage:  'bg-slate-100 text-slate-700 border-slate-300',
  phase:    'bg-slate-100 text-slate-700 border-slate-300',
  freq:     'bg-slate-100 text-slate-700 border-slate-300',
  motor:    'bg-rose-100 text-rose-800 border-rose-300',
  coil:     'bg-teal-100 text-teal-800 border-teal-300',
};

// ── Series-specific decoders ────────────────────────────────────────────────

function decodeNGW(modelNumber: string): NomenclatureSegment[] {
  // NGW-026D3  →  NGW | 026 | D3
  const match = modelNumber.match(/^(NGW)-(\d{3})(D[34])$/);
  if (!match) return fallback(modelNumber);
  const [, series, cap, coilCode] = match;
  const rows = coilCode === 'D3' ? '3-Row' : '4-Row';
  return [
    { code: series, label: 'Series', meaning: 'New Generation Water — Chilled Water Fan Coil', color: C.series },
    { code: cap, label: 'Capacity Code', meaning: `${parseInt(cap, 10)} MBH nominal capacity`, color: C.capacity },
    { code: coilCode, label: 'Coil Configuration', meaning: `${rows} coil depth`, color: C.coil },
  ];
}

function decodeACSC(modelNumber: string): NomenclatureSegment[] {
  // ACSC080  →  ACSC | 080
  const match = modelNumber.match(/^(ACSC)(\d{3})$/);
  if (!match) return fallback(modelNumber);
  const [, series, cap] = match;
  return [
    { code: series, label: 'Series', meaning: 'Air-Cooled Screw Chiller', color: C.series },
    { code: cap, label: 'Capacity Code', meaning: `${parseInt(cap, 10)} TR nominal`, color: C.capacity },
  ];
}

// Generic decoder for series without real model data yet
function decodeGeneric(modelNumber: string, seriesId: string): NomenclatureSegment[] {
  const SERIES_MEANINGS: Record<string, string> = {
    'split-cs':   'Commercial Split System',
    'split-ds':   'Ducted Inverter Split System',
    'ms-wall':    'Mini-Split Wall-Mounted',
    'ms-cas':     'Mini-Split Cassette / Ceiling',
    'thac':       'THAC Air-Cooled Chiller (Brazed Plate)',
    'dhac':       'DHAC Air-Cooled Chiller (Shell & Tube)',
    'acc-bp':     'ACC Air-Cooled Chiller (Brazed Plate)',
    'acc-st':     'ACC Air-Cooled Chiller (Shell & Tube)',
    'ccu-std':    'Standard Condensing Unit',

    'prec-dc':    'Precision Data Center Cooling',
    'prec-tele':  'Precision Telecom Cooling',
    'fcu':        'Chilled Water Fan Coil Unit',
    'rpui':       'RPUI Rooftop Packaged Unit',
    'spu':        'SPU Split Packaged Unit',
    'dstc':       'DSTC Ducted Split Tropical (R-407C)',
    'dstf':       'DSTF Ducted Split Tropical (R-410A)',
  };

  // Try to split on dash: PREFIX-NUMBER
  const dashMatch = modelNumber.match(/^([A-Z][\w-]*)-(\d{2,4})(.*)$/);
  if (dashMatch) {
    const [, prefix, cap, suffix] = dashMatch;
    const segments: NomenclatureSegment[] = [
      { code: prefix, label: 'Series', meaning: SERIES_MEANINGS[seriesId] ?? prefix + ' Series', color: C.series },
      { code: cap, label: 'Capacity Code', meaning: `${parseInt(cap, 10)} MBH nominal`, color: C.capacity },
    ];
    if (suffix) {
      segments.push({ code: suffix, label: 'Variant', meaning: 'Configuration variant', color: C.config });
    }
    return segments;
  }

  // No dash: PREFIX + NUMBER (e.g. ACSC080)
  const noMatch = modelNumber.match(/^([A-Z]+)(\d{2,4})(.*)$/);
  if (noMatch) {
    const [, prefix, cap, suffix] = noMatch;
    const segments: NomenclatureSegment[] = [
      { code: prefix, label: 'Series', meaning: SERIES_MEANINGS[seriesId] ?? prefix + ' Series', color: C.series },
      { code: cap, label: 'Capacity Code', meaning: `${parseInt(cap, 10)} nominal`, color: C.capacity },
    ];
    if (suffix) {
      segments.push({ code: suffix, label: 'Variant', meaning: 'Configuration variant', color: C.config });
    }
    return segments;
  }

  return fallback(modelNumber);
}

function fallback(modelNumber: string): NomenclatureSegment[] {
  return [{ code: modelNumber, label: 'Model', meaning: 'Unit model number', color: C.series }];
}

// ── Series metadata for BOM base code ───────────────────────────────────────

interface SeriesBOMConfig {
  refrigerant: string;
  voltage: string;
  phase: string;
  frequency: string;
  compressorType: string;
}

const SERIES_BOM_CONFIG: Record<string, SeriesBOMConfig> = {
  'ngw':        { refrigerant: '',      voltage: '415', phase: '3', frequency: '50', compressorType: '' },
  'acsc':       { refrigerant: 'R134a', voltage: '415', phase: '3', frequency: '50', compressorType: 'SC' },
  'dstc':       { refrigerant: 'R407C', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'dstf':       { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'split-cs':   { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'split-ds':   { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'IV' },
  'ms-wall':    { refrigerant: 'R32',   voltage: '220', phase: '1', frequency: '50', compressorType: 'IV' },
  'ms-cas':     { refrigerant: 'R410A', voltage: '220', phase: '1', frequency: '50', compressorType: 'IV' },
  'thac':       { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'dhac':       { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'acc-bp':     { refrigerant: 'R407C', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'acc-st':     { refrigerant: 'R407C', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'ccu-std':    { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },

  'prec-dc':    { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'prec-tele':  { refrigerant: 'R410A', voltage: '220', phase: '1', frequency: '50', compressorType: 'IV' },
  'fcu':        { refrigerant: '',      voltage: '220', phase: '1', frequency: '50', compressorType: '' },
  'rpui':       { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
  'spu':        { refrigerant: 'R410A', voltage: '415', phase: '3', frequency: '50', compressorType: 'SL' },
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Decode a model number into its meaningful nomenclature segments.
 */
export function decodeNomenclature(modelNumber: string, seriesId: string): NomenclatureSegment[] {
  switch (seriesId) {
    case 'ngw':  return decodeNGW(modelNumber);
    case 'acsc': return decodeACSC(modelNumber);
    default:     return decodeGeneric(modelNumber, seriesId);
  }
}

/**
 * Get the full nomenclature segments including voltage/phase/frequency
 * and refrigerant as additional BOM context segments.
 */
export function getFullNomenclatureSegments(modelNumber: string, seriesId: string): NomenclatureSegment[] {
  const base = decodeNomenclature(modelNumber, seriesId);
  const config = SERIES_BOM_CONFIG[seriesId];
  if (!config) return base;

  const extra: NomenclatureSegment[] = [];

  if (config.compressorType) {
    const compTypes: Record<string, string> = {
      'SC': 'Screw compressor',
      'SL': 'Scroll compressor',
      'IV': 'Inverter compressor',
    };
    extra.push({
      code: config.compressorType,
      label: 'Compressor',
      meaning: compTypes[config.compressorType] ?? config.compressorType,
      color: C.config,
    });
  }

  if (config.refrigerant) {
    extra.push({
      code: config.refrigerant,
      label: 'Refrigerant',
      meaning: `${config.refrigerant} refrigerant`,
      color: C.refrig,
    });
  }

  extra.push({
    code: config.voltage,
    label: 'Voltage',
    meaning: `${config.voltage}V supply`,
    color: C.voltage,
  });
  extra.push({
    code: config.phase,
    label: 'Phase',
    meaning: `${config.phase}-phase`,
    color: C.phase,
  });
  extra.push({
    code: config.frequency,
    label: 'Frequency',
    meaning: `${config.frequency} Hz`,
    color: C.freq,
  });

  return [...base, ...extra];
}

/**
 * Build the full Oracle BOM nomenclature string.
 *
 * Format: MODEL-COMP-REFRIG-VVVPFF[/OPT1/OPT2/...]
 * Example: ACSC080-SC-R134a-41350/BNMS/FDRC/VISP
 */
export function buildOracleBOM(
  modelNumber: string,
  seriesId: string,
  selectedOptionIds: string[],
): NomenclatureResult {
  const segments = getFullNomenclatureSegments(modelNumber, seriesId);
  const config = SERIES_BOM_CONFIG[seriesId];

  // Build base BOM code
  let baseBOM = modelNumber;
  if (config) {
    const parts: string[] = [modelNumber];
    if (config.compressorType) parts.push(config.compressorType);
    if (config.refrigerant) parts.push(config.refrigerant);
    parts.push(`${config.voltage}${config.phase}${config.frequency}`);
    baseBOM = parts.join('-');
  }

  // Resolve option codes
  const optionCodes = selectedOptionIds
    .map(id => OPTION_BOM_CODES[id])
    .filter(Boolean)
    .sort();

  // Full BOM
  const oracleBOM = optionCodes.length > 0
    ? `${baseBOM}/${optionCodes.join('/')}`
    : baseBOM;

  return {
    modelNumber,
    segments,
    oracleBOM,
    optionCodes,
  };
}

/**
 * Get the short option BOM code for a given option ID.
 */
export function getOptionBOMCode(optionId: string): string | undefined {
  return OPTION_BOM_CODES[optionId];
}

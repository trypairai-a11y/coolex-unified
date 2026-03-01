export interface EquipmentOption {
  id: string;
  category: 'construction' | 'electrical' | 'refrigeration' | 'controls';
  label: string;
  description: string;
  priceAdderKWD: number;
  applicableSeriesIds: string[] | 'all';
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  // Construction
  { id: 'ss-drain', category: 'construction', label: 'Stainless Steel Drain Pan', description: 'Type 304 stainless steel drain pan with 1" NPT drain connection', priceAdderKWD: 45, applicableSeriesIds: 'all' },
  { id: 'ss-coil', category: 'construction', label: 'Coated Evaporator Coil', description: 'Electrofin E-Coat corrosion protection for coastal/industrial environments', priceAdderKWD: 120, applicableSeriesIds: 'all' },
  { id: 'louvered', category: 'construction', label: 'Louvered Condenser Guard', description: 'Heavy-duty aluminum louvered guards for condenser coil protection', priceAdderKWD: 65, applicableSeriesIds: ['pac-r', 'pac-f', 'pac-g', 'split-cs', 'split-ds'] },
  { id: 'vibration-iso', category: 'construction', label: 'Vibration Isolators', description: 'Spring-type vibration isolators for rooftop or structural applications', priceAdderKWD: 85, applicableSeriesIds: 'all' },
  { id: 'hail-guard', category: 'construction', label: 'Hail Guard', description: 'Galvanized steel hail protection for condenser coil', priceAdderKWD: 55, applicableSeriesIds: ['pac-r', 'pac-f', 'pac-g'] },
  { id: 'cond-coil-coat', category: 'construction', label: 'Coated Condenser Coil', description: 'BlueFinTM coating for condenser coil — salt air protection', priceAdderKWD: 140, applicableSeriesIds: 'all' },

  // Electrical
  { id: 'nema4-ctrls', category: 'electrical', label: 'NEMA 4X Control Panel', description: 'NEMA 4X stainless steel control panel for wash-down environments', priceAdderKWD: 195, applicableSeriesIds: 'all' },
  { id: 'phase-mon', category: 'electrical', label: 'Phase Monitor Relay', description: 'Electronic phase failure, reversal, and voltage imbalance protection', priceAdderKWD: 35, applicableSeriesIds: 'all' },
  { id: 'elec-heater-6kw', category: 'electrical', label: 'Electric Heater — 6 kW', description: 'Factory-installed electric resistance heater, 6 kW, 380V/3ph', priceAdderKWD: 110, applicableSeriesIds: ['pac-r', 'pac-f', 'split-cs'] },
  { id: 'elec-heater-12kw', category: 'electrical', label: 'Electric Heater — 12 kW', description: 'Factory-installed electric resistance heater, 12 kW, 380V/3ph', priceAdderKWD: 175, applicableSeriesIds: ['pac-r', 'pac-f', 'split-cs'] },
  { id: 'elec-heater-24kw', category: 'electrical', label: 'Electric Heater — 24 kW', description: 'Factory-installed electric resistance heater, 24 kW, 380V/3ph', priceAdderKWD: 280, applicableSeriesIds: ['pac-r', 'pac-f', 'split-cs'] },
  { id: 'gfci', category: 'electrical', label: 'GFCI Convenience Outlet', description: '115V GFCI convenience outlet in unit control panel', priceAdderKWD: 25, applicableSeriesIds: 'all' },
  { id: 'dual-power', category: 'electrical', label: 'Dual Power Entry', description: 'Separate compressor and fan power entry points for split-metering', priceAdderKWD: 90, applicableSeriesIds: ['pac-r', 'pac-f', 'pac-g'] },

  // Refrigeration
  { id: 'hgbp', category: 'refrigeration', label: 'Hot Gas Bypass', description: 'Capacity modulation via hot gas bypass for low-load stability', priceAdderKWD: 150, applicableSeriesIds: ['pac-r', 'pac-f', 'split-cs', 'ngw-scroll', 'acsc'] },
  { id: 'suction-acc', category: 'refrigeration', label: 'Suction Accumulator', description: 'Suction line accumulator for liquid slug protection', priceAdderKWD: 80, applicableSeriesIds: ['ccu-std', 'ccu-lt'] },
  { id: 'oil-sep', category: 'refrigeration', label: 'Oil Separator', description: 'In-line oil separator for long refrigerant line applications', priceAdderKWD: 125, applicableSeriesIds: ['ccu-std', 'ccu-lt', 'ngw-scroll'] },
  { id: 'liquid-recv', category: 'refrigeration', label: 'Liquid Receiver', description: 'Field-selectable receiver size for extended piping runs', priceAdderKWD: 95, applicableSeriesIds: ['ccu-std', 'ccu-lt'] },
  { id: 'filter-dryer', category: 'refrigeration', label: 'Replaceable Filter Drier', description: 'Replaceable-core filter drier with sight glass and moisture indicator', priceAdderKWD: 40, applicableSeriesIds: 'all' },

  // Controls
  { id: 'bacnet', category: 'controls', label: 'BACnet MS/TP Interface', description: 'Factory-installed BACnet MS/TP controller for BAS integration', priceAdderKWD: 220, applicableSeriesIds: 'all' },
  { id: 'modbus', category: 'controls', label: 'Modbus RTU Interface', description: 'Factory-installed Modbus RTU interface for PLC integration', priceAdderKWD: 185, applicableSeriesIds: 'all' },
  { id: 'remote-mon', category: 'controls', label: 'Remote Monitoring Gateway', description: 'LTE/Wi-Fi gateway for remote monitoring via COOLEX cloud portal', priceAdderKWD: 350, applicableSeriesIds: 'all' },
  { id: 'econ-ctrl', category: 'controls', label: 'Economizer Control Module', description: 'Integrated economizer control with enthalpy sensor', priceAdderKWD: 275, applicableSeriesIds: ['pac-r', 'pac-g'] },
];

export function getOptionsForSeries(seriesId: string): EquipmentOption[] {
  return EQUIPMENT_OPTIONS.filter(opt =>
    opt.applicableSeriesIds === 'all' || opt.applicableSeriesIds.includes(seriesId)
  );
}

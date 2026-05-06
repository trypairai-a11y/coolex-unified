export interface EquipmentOption {
  id: string;
  category: 'construction' | 'electrical' | 'refrigeration' | 'controls' | 'air-side';
  label: string;
  description: string;
  priceAdderKWD: number;
  applicableSeriesIds: string[] | 'all';
  /** For multi-component systems (e.g. VRF), restricts which side this option attaches to. */
  vrfTarget?: 'odu' | 'idu';
}

const ROOFTOP_PACKAGED_SERIES_IDS = ['rpui', 'rpuf', 'rpuc', 'spu'];

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  // Construction
  { id: 'ss-drain', category: 'construction', label: 'Stainless Steel Drain Pan', description: 'Type 304 stainless steel drain pan with 1" NPT drain connection', priceAdderKWD: 45, applicableSeriesIds: 'all' },
  { id: 'ss-coil', category: 'construction', label: 'Coated Evaporator Coil', description: 'Electrofin E-Coat corrosion protection for coastal/industrial environments', priceAdderKWD: 120, applicableSeriesIds: 'all' },
  { id: 'louvered', category: 'construction', label: 'Louvered Condenser Guard', description: 'Heavy-duty aluminum louvered guards for condenser coil protection', priceAdderKWD: 65, applicableSeriesIds: ['pac-r', 'pac-f', 'pac-g', 'split-cs', 'split-ds'] },
  { id: 'vibration-iso', category: 'construction', label: 'Vibration Isolators', description: 'Spring-type vibration isolators for rooftop or structural applications', priceAdderKWD: 85, applicableSeriesIds: 'all' },
  { id: 'hail-guard', category: 'construction', label: 'Hail Guard', description: 'Galvanized steel hail protection for condenser coil', priceAdderKWD: 55, applicableSeriesIds: ['pac-r', 'pac-f', 'pac-g'] },
  { id: 'cond-coil-coat', category: 'construction', label: 'Coated Condenser Coil', description: 'BlueFinTM coating for condenser coil - salt air protection', priceAdderKWD: 140, applicableSeriesIds: 'all' },

  // Electrical
  { id: 'nema4-ctrls', category: 'electrical', label: 'NEMA 4X Control Panel', description: 'NEMA 4X stainless steel control panel for wash-down environments', priceAdderKWD: 195, applicableSeriesIds: 'all' },
  { id: 'phase-mon', category: 'electrical', label: 'Phase Monitor Relay', description: 'Electronic phase failure, reversal, and voltage imbalance protection', priceAdderKWD: 35, applicableSeriesIds: 'all' },
  { id: 'gfci', category: 'electrical', label: 'GFCI Convenience Outlet', description: '115V GFCI convenience outlet in unit control panel', priceAdderKWD: 25, applicableSeriesIds: 'all' },
  { id: 'electric-heater', category: 'electrical', label: 'Electric Heater', description: 'Factory-installed electric resistance heater for supplemental or primary heating', priceAdderKWD: 0, applicableSeriesIds: 'all' },
  { id: 'dual-power', category: 'electrical', label: 'Dual Power Entry', description: 'Separate compressor and fan power entry points for split-metering', priceAdderKWD: 90, applicableSeriesIds: ['pac-r', 'pac-f', 'pac-g'] },

  // Refrigeration
  { id: 'hgbp', category: 'refrigeration', label: 'Hot Gas Bypass', description: 'Capacity modulation via hot gas bypass for low-load stability', priceAdderKWD: 150, applicableSeriesIds: ['pac-r', 'pac-f', 'split-cs'] },
  { id: 'suction-acc', category: 'refrigeration', label: 'Suction Accumulator', description: 'Suction line accumulator for liquid slug protection', priceAdderKWD: 80, applicableSeriesIds: ['ccu-std'] },
  { id: 'oil-sep', category: 'refrigeration', label: 'Oil Separator', description: 'In-line oil separator for long refrigerant line applications', priceAdderKWD: 125, applicableSeriesIds: ['ccu-std'] },
  { id: 'liquid-recv', category: 'refrigeration', label: 'Liquid Receiver', description: 'Field-selectable receiver size for extended piping runs', priceAdderKWD: 95, applicableSeriesIds: ['ccu-std'] },
  { id: 'filter-dryer', category: 'refrigeration', label: 'Replaceable Filter Drier', description: 'Replaceable-core filter drier with sight glass and moisture indicator', priceAdderKWD: 40, applicableSeriesIds: 'all' },

  // Controls
  { id: 'bacnet', category: 'controls', label: 'BACnet MS/TP Interface', description: 'Factory-installed BACnet MS/TP controller for BAS integration', priceAdderKWD: 220, applicableSeriesIds: 'all' },
  { id: 'modbus', category: 'controls', label: 'Modbus RTU Interface', description: 'Factory-installed Modbus RTU interface for PLC integration', priceAdderKWD: 185, applicableSeriesIds: 'all' },
  { id: 'remote-mon', category: 'controls', label: 'Remote Monitoring Gateway', description: 'LTE/Wi-Fi gateway for remote monitoring via COOLEX cloud portal', priceAdderKWD: 350, applicableSeriesIds: 'all' },
  { id: 'econ-ctrl', category: 'controls', label: 'Economizer Control Module', description: 'Integrated economizer control with enthalpy sensor', priceAdderKWD: 275, applicableSeriesIds: ['pac-r', 'pac-g'] },

  // ── Rooftop Packaged Series (RPUI / RPUF / RPUC / SPU) ──
  // Construction
  { id: 'rp-ss-drain', category: 'construction', label: 'Stainless Steel Drain Pan', description: 'Type 304 stainless steel drain pan for corrosion-resistant condensate handling', priceAdderKWD: 45, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM coating on condenser coil for salt air and industrial environments', priceAdderKWD: 140, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-evap-coat', category: 'construction', label: 'Evaporator Coil Protective Coating', description: 'Electrofin E-Coat on evaporator coil for corrosive environments', priceAdderKWD: 120, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-copper-evap', category: 'construction', label: 'Copper Fins - Evaporator', description: 'Copper fins on evaporator coil for enhanced durability in harsh environments', priceAdderKWD: 180, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-copper-cond', category: 'construction', label: 'Copper Fins - Condenser', description: 'Copper fins on condenser coil for enhanced durability in harsh environments', priceAdderKWD: 220, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },

  // Refrigeration
  { id: 'rp-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-rotalock', category: 'refrigeration', label: 'Rotalock Valve for Compressor', description: 'Rotalock service valves on compressor suction and discharge connections', priceAdderKWD: 65, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-pumpdown', category: 'refrigeration', label: 'Pump Down Kit', description: 'Solenoid valve kit for refrigerant pump-down and off-cycle isolation', priceAdderKWD: 95, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-manual-hlp', category: 'refrigeration', label: 'Manual High & Low Pressure Switch', description: 'Manual-reset high and low pressure cut-out switches for compressor protection', priceAdderKWD: 75, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },

  // Electrical
  { id: 'rp-comp-breaker', category: 'electrical', label: 'Compressor Circuit Breaker', description: 'Dedicated circuit breaker for compressor short-circuit and overload protection', priceAdderKWD: 110, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-mild-ambient', category: 'electrical', label: 'Mild Ambient Control Kit', description: 'Low-ambient head pressure control kit extending operation below 15°C', priceAdderKWD: 160, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-ctrl-disconnect', category: 'electrical', label: 'Control Circuit Disconnect Switch', description: 'Dedicated disconnect switch for safe control circuit isolation', priceAdderKWD: 55, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-electric-heater', category: 'electrical', label: 'Electric Heater', description: 'Factory-installed electric resistance heater for supplemental or primary heating', priceAdderKWD: 0, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },

  // Air Side
  { id: 'rp-bag-filter', category: 'air-side', label: 'Bag Filter Section', description: 'High-efficiency bag filter section for improved supply air quality', priceAdderKWD: 185, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-high-static', category: 'air-side', label: 'High Static Drive Kit', description: 'High-static pressure drive kit for long or restrictive duct runs', priceAdderKWD: 135, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },
  { id: 'rp-airflow-switch', category: 'air-side', label: 'Airflow Switch', description: 'Differential pressure airflow switch for filter and fan status monitoring', priceAdderKWD: 40, applicableSeriesIds: ROOFTOP_PACKAGED_SERIES_IDS },

  // ── CCU — Standard Condensing Unit Series ──
  // Construction
  { id: 'ccu-copper-cond', category: 'construction', label: 'Copper Fins - Condenser', description: 'Copper fins on condenser coil for enhanced durability in harsh environments', priceAdderKWD: 220, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-heresite-cond', category: 'construction', label: 'Heresite Coating - Condenser', description: 'Heresite phenolic baked-on coating on condenser coil for severe corrosive environments', priceAdderKWD: 260, applicableSeriesIds: ['ccu-std'] },

  // Refrigeration
  { id: 'ccu-pumpdown', category: 'refrigeration', label: 'Pump Down Kit', description: 'Solenoid valve kit for refrigerant pump-down and off-cycle isolation', priceAdderKWD: 95, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-manual-hlp', category: 'refrigeration', label: 'Manual High & Low Pressure Switch', description: 'Manual-reset high and low pressure cut-out switches for compressor protection', priceAdderKWD: 75, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-rotalock', category: 'refrigeration', label: 'Rotalock Valve for Compressor', description: 'Rotalock service valves on compressor suction and discharge connections', priceAdderKWD: 65, applicableSeriesIds: ['ccu-std'] },

  // Electrical
  { id: 'ccu-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-mild-ambient', category: 'electrical', label: 'Mild Ambient Control Kit', description: 'Low-ambient head pressure control kit extending operation below 15°C', priceAdderKWD: 160, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-ctrl-disconnect', category: 'electrical', label: 'Control Circuit Disconnect Switch', description: 'Dedicated disconnect switch for safe control circuit isolation', priceAdderKWD: 55, applicableSeriesIds: ['ccu-std'] },
  { id: 'ccu-comp-breaker', category: 'electrical', label: 'Compressor Circuit Breaker', description: 'Dedicated circuit breaker for compressor short-circuit and overload protection', priceAdderKWD: 110, applicableSeriesIds: ['ccu-std'] },

  // ── ACSC — Air-Cooled Screw Chiller Series ──
  // Construction
  { id: 'acsc-protection-guard', category: 'construction', label: 'Compressor & Cooler Unit Protection Guard', description: 'Heavy-duty protective guard enclosing compressor and cooler sections from impact and debris', priceAdderKWD: 175, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-spring-isolator', category: 'construction', label: 'Unit Mounting Spring Isolator', description: 'Spring-type vibration isolators for reduced structural noise and vibration transmission', priceAdderKWD: 210, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-comp-enclosure', category: 'construction', label: 'Compressor Enclosure Box', description: 'Acoustic enclosure box around compressor for reduced sound emissions', priceAdderKWD: 340, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-copper-cond', category: 'construction', label: 'Copper Fins – Condenser Coil', description: 'Copper fins on condenser coil for enhanced durability in corrosive environments', priceAdderKWD: 380, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM / Heresite coating on condenser coil for salt air and industrial environments', priceAdderKWD: 260, applicableSeriesIds: ['acsc'] },

  // Refrigeration
  { id: 'acsc-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-asme-cooler', category: 'refrigeration', label: 'ASME Code Stamped (S&T Cooler)', description: 'Shell & tube cooler constructed and stamped per ASME Section VIII pressure vessel code', priceAdderKWD: 420, applicableSeriesIds: ['acsc'] },

  // Electrical
  { id: 'acsc-cooler-heater', category: 'electrical', label: 'Cooler Heater Tape', description: 'Freeze protection heater tape on evaporator cooler for low-ambient operation', priceAdderKWD: 95, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-bms', category: 'electrical', label: 'Building Management System (BMS)', description: 'BACnet / Modbus interface for integration with site building management system', priceAdderKWD: 285, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-touchscreen', category: 'electrical', label: 'Touchscreens / Graphics', description: 'Color touchscreen HMI with graphical unit status, trending, and alarm history', priceAdderKWD: 320, applicableSeriesIds: ['acsc'] },
  { id: 'acsc-wireless-mon', category: 'electrical', label: 'Wireless Remote Monitoring & Control of Chiller', description: 'LTE/Wi-Fi gateway for remote monitoring and control via COOLEX cloud portal', priceAdderKWD: 450, applicableSeriesIds: ['acsc'] },

  // ── DHAC — Air-Cooled Chiller Series ──
  // Construction
  { id: 'dhac-spring-isolator', category: 'construction', label: 'Unit Mounting Spring Isolator', description: 'Spring-type vibration isolators for reduced structural noise and vibration transmission', priceAdderKWD: 195, applicableSeriesIds: ['dhac'] },
  { id: 'dhac-copper-cond', category: 'construction', label: 'Copper Fins – Condenser Coil', description: 'Copper fins on condenser coil for enhanced durability in corrosive environments', priceAdderKWD: 350, applicableSeriesIds: ['dhac'] },
  { id: 'dhac-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM / Heresite coating on condenser coil for salt air and industrial environments', priceAdderKWD: 240, applicableSeriesIds: ['dhac'] },

  // Refrigeration
  { id: 'dhac-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['dhac'] },
  { id: 'dhac-asme-cooler', category: 'refrigeration', label: 'ASME Code Stamped (S&T Cooler)', description: 'Shell & tube cooler constructed and stamped per ASME Section VIII pressure vessel code', priceAdderKWD: 400, applicableSeriesIds: ['dhac'] },

  // Electrical
  { id: 'dhac-cooler-heater', category: 'electrical', label: 'Cooler Heater Tape', description: 'Freeze protection heater tape on evaporator cooler for low-ambient operation', priceAdderKWD: 95, applicableSeriesIds: ['dhac'] },
  { id: 'dhac-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ['dhac'] },
  { id: 'dhac-bms', category: 'electrical', label: 'Building Management System (BMS)', description: 'BACnet / Modbus interface for integration with site building management system', priceAdderKWD: 285, applicableSeriesIds: ['dhac'] },
  { id: 'dhac-comp-breaker', category: 'electrical', label: 'Compressor Circuit Breaker', description: 'Dedicated circuit breaker for compressor short-circuit and overload protection', priceAdderKWD: 110, applicableSeriesIds: ['dhac'] },

  // ── VRF — Variable Refrigerant Flow Series ──
  // Outdoor unit (ODU) options
  { id: 'vrf-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM coating on condenser coil for salt air and industrial environments', priceAdderKWD: 140, applicableSeriesIds: ['vrf'], vrfTarget: 'odu' },
  { id: 'vrf-copper-cond', category: 'construction', label: 'Copper Fins - Condenser', description: 'Copper fins on condenser coil for enhanced durability in harsh environments', priceAdderKWD: 220, applicableSeriesIds: ['vrf'], vrfTarget: 'odu' },
  { id: 'vrf-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['vrf'], vrfTarget: 'odu' },

  // Indoor unit (IDU) options
  { id: 'vrf-ss-drain', category: 'construction', label: 'Stainless Steel Drain Pan', description: 'Type 304 stainless steel drain pan with 1" NPT drain connection', priceAdderKWD: 45, applicableSeriesIds: ['vrf'], vrfTarget: 'idu' },
  { id: 'vrf-evap-coat', category: 'construction', label: 'Evaporator Coil Protective Coating', description: 'Electrofin E-Coat on evaporator coil for corrosive environments', priceAdderKWD: 120, applicableSeriesIds: ['vrf'], vrfTarget: 'idu' },
  { id: 'vrf-copper-evap', category: 'construction', label: 'Copper Fins - Evaporator', description: 'Copper fins on evaporator coil for enhanced durability in harsh environments', priceAdderKWD: 180, applicableSeriesIds: ['vrf'], vrfTarget: 'idu' },

  // ── ACC-BP — Air-Cooled Chiller (Brazed Plate HX) Series ──
  // Construction
  { id: 'accbp-spring-isolator', category: 'construction', label: 'Unit Mounting Spring Isolator', description: 'Spring-type vibration isolators for reduced structural noise and vibration transmission', priceAdderKWD: 175, applicableSeriesIds: ['acc-bp'] },
  { id: 'accbp-copper-cond', category: 'construction', label: 'Copper Fins – Condenser Coil', description: 'Copper fins on condenser coil for enhanced durability in corrosive environments', priceAdderKWD: 320, applicableSeriesIds: ['acc-bp'] },
  { id: 'accbp-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM / Heresite coating on condenser coil for salt air and industrial environments', priceAdderKWD: 220, applicableSeriesIds: ['acc-bp'] },

  // Refrigeration
  { id: 'accbp-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['acc-bp'] },

  // Electrical
  { id: 'accbp-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ['acc-bp'] },
  { id: 'accbp-bms', category: 'electrical', label: 'Building Management System (BMS)', description: 'BACnet / Modbus interface for integration with site building management system', priceAdderKWD: 285, applicableSeriesIds: ['acc-bp'] },
  { id: 'accbp-comp-breaker', category: 'electrical', label: 'Compressor Circuit Breaker', description: 'Dedicated circuit breaker for compressor short-circuit and overload protection', priceAdderKWD: 110, applicableSeriesIds: ['acc-bp'] },

  // ── ACC-ST — Air-Cooled Chiller (Shell & Tube HX) Series ──
  // Construction
  { id: 'accst-spring-isolator', category: 'construction', label: 'Unit Mounting Spring Isolator', description: 'Spring-type vibration isolators for reduced structural noise and vibration transmission', priceAdderKWD: 195, applicableSeriesIds: ['acc-st'] },
  { id: 'accst-copper-cond', category: 'construction', label: 'Copper Fins – Condenser Coil', description: 'Copper fins on condenser coil for enhanced durability in corrosive environments', priceAdderKWD: 350, applicableSeriesIds: ['acc-st'] },
  { id: 'accst-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM / Heresite coating on condenser coil for salt air and industrial environments', priceAdderKWD: 240, applicableSeriesIds: ['acc-st'] },

  // Refrigeration
  { id: 'accst-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['acc-st'] },
  { id: 'accst-asme-cooler', category: 'refrigeration', label: 'ASME Code Stamped (S&T Cooler)', description: 'Shell & tube cooler constructed and stamped per ASME Section VIII pressure vessel code', priceAdderKWD: 400, applicableSeriesIds: ['acc-st'] },

  // Electrical
  { id: 'accst-cooler-heater', category: 'electrical', label: 'Cooler Heater Tape', description: 'Freeze protection heater tape on evaporator cooler for low-ambient operation', priceAdderKWD: 95, applicableSeriesIds: ['acc-st'] },
  { id: 'accst-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ['acc-st'] },
  { id: 'accst-bms', category: 'electrical', label: 'Building Management System (BMS)', description: 'BACnet / Modbus interface for integration with site building management system', priceAdderKWD: 285, applicableSeriesIds: ['acc-st'] },
  { id: 'accst-comp-breaker', category: 'electrical', label: 'Compressor Circuit Breaker', description: 'Dedicated circuit breaker for compressor short-circuit and overload protection', priceAdderKWD: 110, applicableSeriesIds: ['acc-st'] },

  // ── THAC — Air-Cooled Chiller (Brazed Plate HX) Series ──
  // Construction
  { id: 'thac-spring-isolator', category: 'construction', label: 'Unit Mounting Spring Isolator', description: 'Spring-type vibration isolators for reduced structural noise and vibration transmission', priceAdderKWD: 175, applicableSeriesIds: ['thac'] },
  { id: 'thac-copper-cond', category: 'construction', label: 'Copper Fins – Condenser Coil', description: 'Copper fins on condenser coil for enhanced durability in corrosive environments', priceAdderKWD: 320, applicableSeriesIds: ['thac'] },
  { id: 'thac-cond-coat', category: 'construction', label: 'Condenser Coil Protective Coating', description: 'BlueFinTM / Heresite coating on condenser coil for salt air and industrial environments', priceAdderKWD: 220, applicableSeriesIds: ['thac'] },

  // Refrigeration
  { id: 'thac-pressure-gauges', category: 'refrigeration', label: 'Pressure Gauges (High, Low)', description: 'High-side and low-side refrigerant pressure gauges for field diagnostics', priceAdderKWD: 55, applicableSeriesIds: ['thac'] },

  // Electrical
  { id: 'thac-overload-fan', category: 'electrical', label: 'Overload Relay - Condenser Fan Motor', description: 'Thermal overload relay for condenser fan motor protection', priceAdderKWD: 45, applicableSeriesIds: ['thac'] },
  { id: 'thac-bms', category: 'electrical', label: 'Building Management System (BMS)', description: 'BACnet / Modbus interface for integration with site building management system', priceAdderKWD: 285, applicableSeriesIds: ['thac'] },
  { id: 'thac-comp-breaker', category: 'electrical', label: 'Compressor Circuit Breaker', description: 'Dedicated circuit breaker for compressor short-circuit and overload protection', priceAdderKWD: 110, applicableSeriesIds: ['thac'] },
];

const CURATED_ONLY_SERIES_IDS = [...ROOFTOP_PACKAGED_SERIES_IDS, 'ccu-std', 'acsc', 'thac', 'dhac', 'vrf', 'acc-bp', 'acc-st'];

export function getOptionsForSeries(seriesId: string): EquipmentOption[] {
  if (CURATED_ONLY_SERIES_IDS.includes(seriesId)) {
    return EQUIPMENT_OPTIONS.filter(opt =>
      Array.isArray(opt.applicableSeriesIds) && opt.applicableSeriesIds.includes(seriesId)
    );
  }
  return EQUIPMENT_OPTIONS.filter(opt =>
    opt.applicableSeriesIds === 'all' || opt.applicableSeriesIds.includes(seriesId)
  );
}

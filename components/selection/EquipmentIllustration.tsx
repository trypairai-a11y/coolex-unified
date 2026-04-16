"use client";

/**
 * SVG equipment silhouette illustrations for each product group.
 * Used in the series selection cards to visually differentiate equipment types.
 */

interface Props {
  groupId: string;
  className?: string;
}

export function EquipmentIllustration({ groupId, className = "" }: Props) {
  const svgProps = {
    viewBox: "0 0 200 120",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: `w-full h-24 ${className}`,
  };

  switch (groupId) {
    // Rooftop Packaged Unit - boxy unit with top fan grilles
    case "pac":
      return (
        <svg {...svgProps}>
          {/* Main cabinet body */}
          <rect x="30" y="40" width="140" height="60" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Top section / fan housing */}
          <rect x="35" y="28" width="130" height="16" rx="3" fill="#D1E3FC" stroke="#0057B8" strokeWidth="1" />
          {/* Fan grilles */}
          <circle cx="65" cy="36" r="5" stroke="#0057B8" strokeWidth="1" fill="none" />
          <circle cx="100" cy="36" r="5" stroke="#0057B8" strokeWidth="1" fill="none" />
          <circle cx="135" cy="36" r="5" stroke="#0057B8" strokeWidth="1" fill="none" />
          {/* Panel lines */}
          <line x1="80" y1="45" x2="80" y2="95" stroke="#0057B8" strokeWidth="0.8" opacity="0.4" />
          <line x1="120" y1="45" x2="120" y2="95" stroke="#0057B8" strokeWidth="0.8" opacity="0.4" />
          {/* Louvered vents */}
          <line x1="38" y1="55" x2="75" y2="55" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="38" y1="60" x2="75" y2="60" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="38" y1="65" x2="75" y2="65" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="38" y1="70" x2="75" y2="70" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          {/* Connection stubs */}
          <rect x="45" y="96" width="8" height="8" rx="1" fill="#B8D4F0" stroke="#0057B8" strokeWidth="0.8" />
          <rect x="147" y="96" width="8" height="8" rx="1" fill="#B8D4F0" stroke="#0057B8" strokeWidth="0.8" />
          {/* Control panel */}
          <rect x="125" y="52" width="38" height="24" rx="2" fill="#fff" stroke="#0057B8" strokeWidth="0.8" />
          <circle cx="134" cy="60" r="2" fill="#00A3E0" />
          <rect x="139" y="58" width="18" height="4" rx="1" fill="#E8F0FE" />
          <rect x="139" y="66" width="12" height="3" rx="1" fill="#E8F0FE" />
        </svg>
      );

    // Split System - outdoor condenser + indoor unit
    case "split":
      return (
        <svg {...svgProps}>
          {/* Outdoor unit */}
          <rect x="15" y="38" width="70" height="62" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Large fan */}
          <circle cx="50" cy="60" r="16" stroke="#0057B8" strokeWidth="1.2" fill="#D1E3FC" />
          <circle cx="50" cy="60" r="3" fill="#0057B8" opacity="0.3" />
          {/* Fan blades hint */}
          <line x1="50" y1="46" x2="50" y2="74" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="36" y1="60" x2="64" y2="60" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          {/* Feet */}
          <rect x="22" y="98" width="12" height="4" rx="1" fill="#B8D4F0" stroke="#0057B8" strokeWidth="0.6" />
          <rect x="66" y="98" width="12" height="4" rx="1" fill="#B8D4F0" stroke="#0057B8" strokeWidth="0.6" />
          {/* Refrigerant lines (connecting) */}
          <path d="M85 55 Q100 55 100 45 Q100 35 115 35" stroke="#0057B8" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
          <path d="M85 65 Q105 65 105 50 Q105 42 115 42" stroke="#00A3E0" strokeWidth="1" strokeDasharray="3 2" fill="none" />
          {/* Indoor unit (air handler) */}
          <rect x="115" y="26" width="70" height="48" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Horizontal vent lines */}
          <line x1="122" y1="38" x2="178" y2="38" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="122" y1="43" x2="178" y2="43" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="122" y1="48" x2="178" y2="48" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="122" y1="53" x2="178" y2="53" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="122" y1="58" x2="178" y2="58" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          {/* Filter indicator */}
          <rect x="130" y="64" width="20" height="6" rx="1" fill="#00A3E0" opacity="0.3" />
        </svg>
      );

    // Mini-Split - sleek wall-mount indoor unit
    case "mini-split":
      return (
        <svg {...svgProps}>
          {/* Wall line */}
          <line x1="25" y1="20" x2="25" y2="105" stroke="#CBD5E1" strokeWidth="1" />
          {/* Mounting bracket */}
          <rect x="25" y="42" width="6" height="30" rx="1" fill="#CBD5E1" />
          {/* Main indoor unit body - sleek curved shape */}
          <path d="M32 35 Q32 30 40 28 L160 28 Q170 30 170 35 L170 72 Q170 78 160 80 L40 80 Q32 78 32 72 Z" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Top airflow inlet */}
          <line x1="50" y1="33" x2="152" y2="33" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          {/* Display panel */}
          <rect x="85" y="42" width="32" height="8" rx="3" fill="#fff" stroke="#0057B8" strokeWidth="0.6" />
          <text x="96" y="49" fontSize="6" fill="#0057B8" fontFamily="monospace">22°C</text>
          {/* Bottom vane / louver */}
          <path d="M42 75 Q100 82 160 75" stroke="#0057B8" strokeWidth="1" fill="none" />
          <path d="M48 79 Q100 86 154 79" stroke="#0057B8" strokeWidth="0.6" fill="none" opacity="0.5" />
          {/* Airflow arrows */}
          <path d="M80 88 L80 100 L76 96" stroke="#00A3E0" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M100 90 L100 104 L96 100" stroke="#00A3E0" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M120 88 L120 100 L116 96" stroke="#00A3E0" strokeWidth="0.8" fill="none" opacity="0.5" />
          {/* LED indicator */}
          <circle cx="68" cy="50" r="2" fill="#00A3E0" />
        </svg>
      );

    // Air-cooled chiller - large unit with multiple fan circles on top
    case "chiller":
      return (
        <svg {...svgProps}>
          {/* Main chiller body */}
          <rect x="15" y="45" width="170" height="50" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Top fan section */}
          <rect x="20" y="18" width="160" height="30" rx="3" fill="#D1E3FC" stroke="#0057B8" strokeWidth="1" />
          {/* Four large fans */}
          <circle cx="55" cy="33" r="10" stroke="#0057B8" strokeWidth="1" fill="#E8F0FE" />
          <circle cx="55" cy="33" r="2" fill="#0057B8" opacity="0.2" />
          <circle cx="90" cy="33" r="10" stroke="#0057B8" strokeWidth="1" fill="#E8F0FE" />
          <circle cx="90" cy="33" r="2" fill="#0057B8" opacity="0.2" />
          <circle cx="125" cy="33" r="10" stroke="#0057B8" strokeWidth="1" fill="#E8F0FE" />
          <circle cx="125" cy="33" r="2" fill="#0057B8" opacity="0.2" />
          <circle cx="160" cy="33" r="10" stroke="#0057B8" strokeWidth="1" fill="#E8F0FE" />
          <circle cx="160" cy="33" r="2" fill="#0057B8" opacity="0.2" />
          {/* Panel divisions */}
          <line x1="60" y1="50" x2="60" y2="90" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="100" y1="50" x2="100" y2="90" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          <line x1="140" y1="50" x2="140" y2="90" stroke="#0057B8" strokeWidth="0.6" opacity="0.3" />
          {/* Pipe connections */}
          <circle cx="30" cy="100" r="4" stroke="#0057B8" strokeWidth="0.8" fill="#B8D4F0" />
          <circle cx="50" cy="100" r="4" stroke="#00A3E0" strokeWidth="0.8" fill="#B8D4F0" />
          {/* Base frame */}
          <line x1="15" y1="95" x2="185" y2="95" stroke="#0057B8" strokeWidth="1.2" />
          {/* Control panel */}
          <rect x="148" y="55" width="30" height="18" rx="2" fill="#fff" stroke="#0057B8" strokeWidth="0.6" />
          <rect x="152" y="59" width="22" height="6" rx="1" fill="#E8F0FE" />
          <circle cx="157" cy="69" r="1.5" fill="#00A3E0" />
        </svg>
      );

    // Condensing Unit - outdoor box with single large fan
    case "ccu":
      return (
        <svg {...svgProps}>
          {/* Main body */}
          <rect x="45" y="28" width="110" height="72" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Large fan circle */}
          <circle cx="100" cy="55" r="22" stroke="#0057B8" strokeWidth="1.2" fill="#D1E3FC" />
          <circle cx="100" cy="55" r="4" fill="#0057B8" opacity="0.2" />
          {/* Fan blade hints */}
          <line x1="100" y1="35" x2="100" y2="75" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          <line x1="80" y1="55" x2="120" y2="55" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          <line x1="85" y1="40" x2="115" y2="70" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          <line x1="115" y1="40" x2="85" y2="70" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          {/* Grille lines (horizontal) */}
          <line x1="50" y1="35" x2="150" y2="35" stroke="#0057B8" strokeWidth="0.4" opacity="0.2" />
          <line x1="50" y1="40" x2="150" y2="40" stroke="#0057B8" strokeWidth="0.4" opacity="0.2" />
          <line x1="50" y1="45" x2="150" y2="45" stroke="#0057B8" strokeWidth="0.4" opacity="0.2" />
          <line x1="50" y1="65" x2="150" y2="65" stroke="#0057B8" strokeWidth="0.4" opacity="0.2" />
          <line x1="50" y1="70" x2="150" y2="70" stroke="#0057B8" strokeWidth="0.4" opacity="0.2" />
          <line x1="50" y1="75" x2="150" y2="75" stroke="#0057B8" strokeWidth="0.4" opacity="0.2" />
          {/* Compressor bulge at bottom */}
          <rect x="60" y="82" width="30" height="14" rx="3" fill="#D1E3FC" stroke="#0057B8" strokeWidth="0.8" />
          {/* Pipe stubs */}
          <circle cx="120" cy="92" r="3" stroke="#0057B8" strokeWidth="0.8" fill="#B8D4F0" />
          <circle cx="132" cy="92" r="3" stroke="#00A3E0" strokeWidth="0.8" fill="#B8D4F0" />
          {/* Feet */}
          <rect x="50" y="100" width="8" height="4" rx="1" fill="#B8D4F0" />
          <rect x="142" y="100" width="8" height="4" rx="1" fill="#B8D4F0" />
        </svg>
      );

    // Precision Cooling - tall cabinet with raised floor hint
    case "precision":
      return (
        <svg {...svgProps}>
          {/* Main tall cabinet */}
          <rect x="50" y="14" width="100" height="86" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Top exhaust */}
          <line x1="58" y1="20" x2="142" y2="20" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          <line x1="58" y1="24" x2="142" y2="24" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
          {/* Display panel */}
          <rect x="68" y="30" width="64" height="20" rx="2" fill="#fff" stroke="#0057B8" strokeWidth="0.8" />
          <rect x="74" y="34" width="52" height="10" rx="1" fill="#002D5C" opacity="0.1" />
          <text x="80" y="42" fontSize="6" fill="#0057B8" fontFamily="monospace" opacity="0.6">22.0°C 45%</text>
          {/* Status LEDs */}
          <circle cx="76" cy="55" r="2" fill="#22C55E" />
          <circle cx="84" cy="55" r="2" fill="#00A3E0" />
          <circle cx="92" cy="55" r="2" fill="#E8F0FE" stroke="#CBD5E1" strokeWidth="0.5" />
          {/* Lower grille */}
          <rect x="56" y="62" width="88" height="30" rx="2" fill="#D1E3FC" stroke="#0057B8" strokeWidth="0.6" />
          {/* Perforated pattern */}
          {[0, 1, 2, 3, 4].map(row => (
            <g key={row}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(col => (
                <circle
                  key={col}
                  cx={64 + col * 10}
                  cy={68 + row * 5}
                  r="1.5"
                  fill="#0057B8"
                  opacity="0.15"
                />
              ))}
            </g>
          ))}
          {/* Raised floor line */}
          <line x1="30" y1="100" x2="170" y2="100" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 3" />
          {/* Airflow arrow underneath */}
          <path d="M95 105 L100 110 L105 105" stroke="#00A3E0" strokeWidth="0.8" fill="none" opacity="0.5" />
        </svg>
      );

    // Fan Coil Unit - horizontal concealed unit
    case "fan-coil":
      return (
        <svg {...svgProps}>
          {/* Ceiling line */}
          <line x1="10" y1="30" x2="190" y2="30" stroke="#CBD5E1" strokeWidth="1" />
          {/* Main FCU body - horizontal slim */}
          <rect x="30" y="35" width="140" height="35" rx="3" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          {/* Fan section */}
          <circle cx="60" cy="52" r="10" stroke="#0057B8" strokeWidth="0.8" fill="#D1E3FC" />
          <circle cx="60" cy="52" r="2" fill="#0057B8" opacity="0.2" />
          {/* Coil section (wavy lines) */}
          <path d="M85 40 Q88 46 85 52 Q82 58 85 64" stroke="#0057B8" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M92 40 Q95 46 92 52 Q89 58 92 64" stroke="#0057B8" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M99 40 Q102 46 99 52 Q96 58 99 64" stroke="#0057B8" strokeWidth="0.6" fill="none" opacity="0.4" />
          {/* Filter section */}
          <rect x="110" y="40" width="20" height="25" rx="1" fill="#D1E3FC" stroke="#0057B8" strokeWidth="0.5" />
          <line x1="113" y1="43" x2="127" y2="43" stroke="#0057B8" strokeWidth="0.3" opacity="0.3" />
          <line x1="113" y1="47" x2="127" y2="47" stroke="#0057B8" strokeWidth="0.3" opacity="0.3" />
          <line x1="113" y1="51" x2="127" y2="51" stroke="#0057B8" strokeWidth="0.3" opacity="0.3" />
          <line x1="113" y1="55" x2="127" y2="55" stroke="#0057B8" strokeWidth="0.3" opacity="0.3" />
          <line x1="113" y1="59" x2="127" y2="59" stroke="#0057B8" strokeWidth="0.3" opacity="0.3" />
          {/* Drain pan */}
          <rect x="35" y="68" width="130" height="4" rx="1" fill="#B8D4F0" stroke="#0057B8" strokeWidth="0.4" />
          {/* Water pipes */}
          <circle cx="140" cy="52" r="3" stroke="#0057B8" strokeWidth="0.6" fill="#B8D4F0" />
          <circle cx="152" cy="52" r="3" stroke="#00A3E0" strokeWidth="0.6" fill="#B8D4F0" />
          {/* Supply grille below */}
          <rect x="50" y="80" width="100" height="14" rx="2" fill="#fff" stroke="#CBD5E1" strokeWidth="0.8" />
          <line x1="55" y1="84" x2="145" y2="84" stroke="#CBD5E1" strokeWidth="0.5" />
          <line x1="55" y1="87" x2="145" y2="87" stroke="#CBD5E1" strokeWidth="0.5" />
          <line x1="55" y1="90" x2="145" y2="90" stroke="#CBD5E1" strokeWidth="0.5" />
          {/* Airflow arrows */}
          <path d="M90 96 L90 106 L86 102" stroke="#00A3E0" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M110 96 L110 106 L106 102" stroke="#00A3E0" strokeWidth="0.6" fill="none" opacity="0.4" />
        </svg>
      );

    // Default fallback - generic HVAC unit
    default:
      return (
        <svg {...svgProps}>
          <rect x="40" y="30" width="120" height="60" rx="4" fill="#E8F0FE" stroke="#0057B8" strokeWidth="1.5" />
          <circle cx="80" cy="55" r="14" stroke="#0057B8" strokeWidth="1" fill="#D1E3FC" />
          <circle cx="80" cy="55" r="3" fill="#0057B8" opacity="0.2" />
          <rect x="110" y="40" width="38" height="20" rx="2" fill="#fff" stroke="#0057B8" strokeWidth="0.6" />
          <circle cx="120" cy="48" r="2" fill="#00A3E0" />
          <rect x="126" y="46" width="16" height="4" rx="1" fill="#E8F0FE" />
          <rect x="50" y="92" width="8" height="5" rx="1" fill="#B8D4F0" />
          <rect x="142" y="92" width="8" height="5" rx="1" fill="#B8D4F0" />
        </svg>
      );
  }
}

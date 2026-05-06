import type { Model } from '@/types/product';

// CCU (Condensing Unit) performance data
// Source: COOLEX CCU Performance Data Tables
// Refrigerant: R-410A
//
// Performance matrix is indexed by [SST °F][Ambient °F] and contains:
//   totalCapacityBtuh, powerInputKW, condensingTempF
//
// SST: Saturated Suction Temperature (°F) — evaporator-side design condition
// Ambient: Condenser Ambient Temperature (°F)
//
// Nominal rating point: SST 50°F / Ambient 95°F (model number = nominal MBH).

export interface CCUPerformancePoint {
  totalCapacityBtuh: number;
  powerInputKW: number;
  condensingTempF: number;
}

export type CCUPerformanceMatrix = Record<string, Record<string, CCUPerformancePoint>>;

export interface CCUModelSpec extends Model {
  refrigerant: string;
  compressorType: string;
  performance: CCUPerformanceMatrix;
}

export const CCU_SST_F = [45, 46, 47, 48, 49, 50] as const;
export const CCU_AMBIENT_F = [95, 115, 118.4, 125] as const;

const RAW: Record<string, CCUPerformanceMatrix> = {
  'CCU-380': {
    '45': {
      '95':    { totalCapacityBtuh: 349971, powerInputKW: 22.8, condensingTempF: 115.3 },
      '115':   { totalCapacityBtuh: 303417, powerInputKW: 28.1, condensingTempF: 133.6 },
      '118.4': { totalCapacityBtuh: 295196, powerInputKW: 29.1, condensingTempF: 136.6 },
      '125':   { totalCapacityBtuh: 279058, powerInputKW: 31.1, condensingTempF: 142.2 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 355865, powerInputKW: 22.9, condensingTempF: 115.6 },
      '115':   { totalCapacityBtuh: 308542, powerInputKW: 28.2, condensingTempF: 133.9 },
      '118.4': { totalCapacityBtuh: 300208, powerInputKW: 29.2, condensingTempF: 136.8 },
      '125':   { totalCapacityBtuh: 283805, powerInputKW: 31.2, condensingTempF: 142.4 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 361828, powerInputKW: 23.0, condensingTempF: 115.9 },
      '115':   { totalCapacityBtuh: 313723, powerInputKW: 28.3, condensingTempF: 134.1 },
      '118.4': { totalCapacityBtuh: 305274, powerInputKW: 29.3, condensingTempF: 137.1 },
      '125':   { totalCapacityBtuh: 288600, powerInputKW: 31.3, condensingTempF: 142.7 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 367859, powerInputKW: 23.1, condensingTempF: 116.2 },
      '115':   { totalCapacityBtuh: 318961, powerInputKW: 28.4, condensingTempF: 134.4 },
      '118.4': { totalCapacityBtuh: 310396, powerInputKW: 29.4, condensingTempF: 137.3 },
      '125':   { totalCapacityBtuh: 293446, powerInputKW: 31.4, condensingTempF: 143.0 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 373959, powerInputKW: 23.2, condensingTempF: 116.5 },
      '115':   { totalCapacityBtuh: 324256, powerInputKW: 28.5, condensingTempF: 134.7 },
      '118.4': { totalCapacityBtuh: 315574, powerInputKW: 29.5, condensingTempF: 137.6 },
      '125':   { totalCapacityBtuh: 298342, powerInputKW: 31.5, condensingTempF: 143.2 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 380127, powerInputKW: 23.3, condensingTempF: 116.9 },
      '115':   { totalCapacityBtuh: 329609, powerInputKW: 28.6, condensingTempF: 134.9 },
      '118.4': { totalCapacityBtuh: 320808, powerInputKW: 29.6, condensingTempF: 137.9 },
      '125':   { totalCapacityBtuh: 303288, powerInputKW: 31.6, condensingTempF: 143.5 },
    },
  },
  'CCU-420': {
    '45': {
      '95':    { totalCapacityBtuh: 386872, powerInputKW: 26.0, condensingTempF: 115.7 },
      '115':   { totalCapacityBtuh: 343195, powerInputKW: 32.2, condensingTempF: 134.1 },
      '118.4': { totalCapacityBtuh: 334338, powerInputKW: 33.4, condensingTempF: 137.1 },
      '125':   { totalCapacityBtuh: 317318, powerInputKW: 35.7, condensingTempF: 142.8 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 393470, powerInputKW: 26.1, condensingTempF: 116.0 },
      '115':   { totalCapacityBtuh: 349071, powerInputKW: 32.3, condensingTempF: 134.4 },
      '118.4': { totalCapacityBtuh: 340086, powerInputKW: 33.5, condensingTempF: 137.3 },
      '125':   { totalCapacityBtuh: 322773, powerInputKW: 35.8, condensingTempF: 143.1 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 400144, powerInputKW: 26.2, condensingTempF: 116.3 },
      '115':   { totalCapacityBtuh: 355014, powerInputKW: 32.4, condensingTempF: 134.6 },
      '118.4': { totalCapacityBtuh: 345898, powerInputKW: 33.6, condensingTempF: 137.6 },
      '125':   { totalCapacityBtuh: 328287, powerInputKW: 36.0, condensingTempF: 143.3 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 406894, powerInputKW: 26.3, condensingTempF: 116.6 },
      '115':   { totalCapacityBtuh: 361022, powerInputKW: 32.5, condensingTempF: 134.9 },
      '118.4': { totalCapacityBtuh: 351776, powerInputKW: 33.7, condensingTempF: 137.9 },
      '125':   { totalCapacityBtuh: 333861, powerInputKW: 36.1, condensingTempF: 143.6 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 413720, powerInputKW: 26.4, condensingTempF: 116.9 },
      '115':   { totalCapacityBtuh: 367098, powerInputKW: 32.6, condensingTempF: 135.2 },
      '118.4': { totalCapacityBtuh: 357719, powerInputKW: 33.8, condensingTempF: 138.1 },
      '125':   { totalCapacityBtuh: 339496, powerInputKW: 36.2, condensingTempF: 143.8 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 420623, powerInputKW: 26.5, condensingTempF: 117.2 },
      '115':   { totalCapacityBtuh: 373241, powerInputKW: 32.7, condensingTempF: 135.4 },
      '118.4': { totalCapacityBtuh: 363728, powerInputKW: 33.9, condensingTempF: 138.4 },
      '125':   { totalCapacityBtuh: 345191, powerInputKW: 36.3, condensingTempF: 144.1 },
    },
  },
  'CCU-480': {
    '45': {
      '95':    { totalCapacityBtuh: 451634, powerInputKW: 30.0, condensingTempF: 115.7 },
      '115':   { totalCapacityBtuh: 394491, powerInputKW: 37.2, condensingTempF: 134.1 },
      '118.4': { totalCapacityBtuh: 384667, powerInputKW: 38.6, condensingTempF: 137.1 },
      '125':   { totalCapacityBtuh: 365513, powerInputKW: 41.4, condensingTempF: 142.8 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 459226, powerInputKW: 30.1, condensingTempF: 116.0 },
      '115':   { totalCapacityBtuh: 401168, powerInputKW: 37.3, condensingTempF: 134.4 },
      '118.4': { totalCapacityBtuh: 391203, powerInputKW: 38.7, condensingTempF: 137.3 },
      '125':   { totalCapacityBtuh: 371711, powerInputKW: 41.5, condensingTempF: 143.1 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 466898, powerInputKW: 30.2, condensingTempF: 116.3 },
      '115':   { totalCapacityBtuh: 407914, powerInputKW: 37.5, condensingTempF: 134.6 },
      '118.4': { totalCapacityBtuh: 397808, powerInputKW: 38.9, condensingTempF: 137.6 },
      '125':   { totalCapacityBtuh: 377972, powerInputKW: 41.7, condensingTempF: 143.3 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 474648, powerInputKW: 30.4, condensingTempF: 116.6 },
      '115':   { totalCapacityBtuh: 414731, powerInputKW: 37.6, condensingTempF: 134.9 },
      '118.4': { totalCapacityBtuh: 404482, powerInputKW: 39.0, condensingTempF: 137.9 },
      '125':   { totalCapacityBtuh: 384298, powerInputKW: 41.8, condensingTempF: 143.6 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 482478, powerInputKW: 30.5, condensingTempF: 116.9 },
      '115':   { totalCapacityBtuh: 421617, powerInputKW: 37.8, condensingTempF: 135.2 },
      '118.4': { totalCapacityBtuh: 411224, powerInputKW: 39.1, condensingTempF: 138.1 },
      '125':   { totalCapacityBtuh: 390687, powerInputKW: 42.0, condensingTempF: 143.8 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 490386, powerInputKW: 30.6, condensingTempF: 117.2 },
      '115':   { totalCapacityBtuh: 428573, powerInputKW: 37.9, condensingTempF: 135.4 },
      '118.4': { totalCapacityBtuh: 418036, powerInputKW: 39.3, condensingTempF: 138.4 },
      '125':   { totalCapacityBtuh: 397139, powerInputKW: 42.1, condensingTempF: 144.1 },
    },
  },
  'CCU-540': {
    '45': {
      '95':    { totalCapacityBtuh: 498446, powerInputKW: 34.0, condensingTempF: 116.4 },
      '115':   { totalCapacityBtuh: 434733, powerInputKW: 42.3, condensingTempF: 134.8 },
      '118.4': { totalCapacityBtuh: 423642, powerInputKW: 43.9, condensingTempF: 137.7 },
      '125':   { totalCapacityBtuh: 401620, powerInputKW: 47.2, condensingTempF: 143.4 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 506741, powerInputKW: 34.1, condensingTempF: 116.8 },
      '115':   { totalCapacityBtuh: 442090, powerInputKW: 42.4, condensingTempF: 135.0 },
      '118.4': { totalCapacityBtuh: 430856, powerInputKW: 44.0, condensingTempF: 138.0 },
      '125':   { totalCapacityBtuh: 408471, powerInputKW: 47.4, condensingTempF: 143.7 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 515113, powerInputKW: 34.3, condensingTempF: 117.1 },
      '115':   { totalCapacityBtuh: 449513, powerInputKW: 42.6, condensingTempF: 135.3 },
      '118.4': { totalCapacityBtuh: 438135, powerInputKW: 44.2, condensingTempF: 138.3 },
      '125':   { totalCapacityBtuh: 415383, powerInputKW: 47.5, condensingTempF: 144.0 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 523561, powerInputKW: 34.5, condensingTempF: 117.4 },
      '115':   { totalCapacityBtuh: 457004, powerInputKW: 42.8, condensingTempF: 135.6 },
      '118.4': { totalCapacityBtuh: 445481, powerInputKW: 44.4, condensingTempF: 138.6 },
      '125':   { totalCapacityBtuh: 422355, powerInputKW: 47.7, condensingTempF: 144.3 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 532086, powerInputKW: 34.7, condensingTempF: 117.8 },
      '115':   { totalCapacityBtuh: 464563, powerInputKW: 43.0, condensingTempF: 135.9 },
      '118.4': { totalCapacityBtuh: 452893, powerInputKW: 44.6, condensingTempF: 138.9 },
      '125':   { totalCapacityBtuh: 429389, powerInputKW: 47.9, condensingTempF: 144.6 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 540606, powerInputKW: 34.9, condensingTempF: 118.1 },
      '115':   { totalCapacityBtuh: 472187, powerInputKW: 43.2, condensingTempF: 136.2 },
      '118.4': { totalCapacityBtuh: 460371, powerInputKW: 44.8, condensingTempF: 139.2 },
      '125':   { totalCapacityBtuh: 436483, powerInputKW: 48.1, condensingTempF: 144.9 },
    },
  },
  'CCU-600': {
    '45': {
      '95':    { totalCapacityBtuh: 553878, powerInputKW: 38.4, condensingTempF: 118.5 },
      '115':   { totalCapacityBtuh: 482062, powerInputKW: 47.8, condensingTempF: 136.5 },
      '118.4': { totalCapacityBtuh: 469506, powerInputKW: 49.6, condensingTempF: 139.5 },
      '125':   { totalCapacityBtuh: 443958, powerInputKW: 53.5, condensingTempF: 145.2 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 562967, powerInputKW: 38.6, condensingTempF: 118.8 },
      '115':   { totalCapacityBtuh: 490173, powerInputKW: 48.0, condensingTempF: 136.9 },
      '118.4': { totalCapacityBtuh: 477472, powerInputKW: 49.9, condensingTempF: 139.8 },
      '125':   { totalCapacityBtuh: 451524, powerInputKW: 53.7, condensingTempF: 145.5 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 572130, powerInputKW: 38.8, condensingTempF: 119.2 },
      '115':   { totalCapacityBtuh: 498348, powerInputKW: 48.2, condensingTempF: 137.2 },
      '118.4': { totalCapacityBtuh: 485500, powerInputKW: 50.1, condensingTempF: 140.1 },
      '125':   { totalCapacityBtuh: 459146, powerInputKW: 54.0, condensingTempF: 145.8 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 581365, powerInputKW: 39.1, condensingTempF: 119.6 },
      '115':   { totalCapacityBtuh: 506586, powerInputKW: 48.5, condensingTempF: 137.5 },
      '118.4': { totalCapacityBtuh: 493590, powerInputKW: 50.3, condensingTempF: 140.4 },
      '125':   { totalCapacityBtuh: 466825, powerInputKW: 54.2, condensingTempF: 146.1 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 590671, powerInputKW: 39.3, condensingTempF: 119.9 },
      '115':   { totalCapacityBtuh: 514887, powerInputKW: 48.7, condensingTempF: 137.8 },
      '118.4': { totalCapacityBtuh: 501743, powerInputKW: 50.5, condensingTempF: 140.7 },
      '125':   { totalCapacityBtuh: 474560, powerInputKW: 54.4, condensingTempF: 146.5 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 600310, powerInputKW: 39.5, condensingTempF: 120.3 },
      '115':   { totalCapacityBtuh: 523249, powerInputKW: 48.9, condensingTempF: 138.2 },
      '118.4': { totalCapacityBtuh: 509957, powerInputKW: 50.8, condensingTempF: 141.1 },
      '125':   { totalCapacityBtuh: 482350, powerInputKW: 54.7, condensingTempF: 146.8 },
    },
  },
  'CCU-660': {
    '45': {
      '95':    { totalCapacityBtuh: 607450, powerInputKW: 40.1, condensingTempF: 114.1 },
      '115':   { totalCapacityBtuh: 524400, powerInputKW: 49.7, condensingTempF: 132.7 },
      '118.4': { totalCapacityBtuh: 509709, powerInputKW: 51.6, condensingTempF: 135.7 },
      '125':   { totalCapacityBtuh: 481399, powerInputKW: 55.2, condensingTempF: 141.4 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 617756, powerInputKW: 40.2, condensingTempF: 114.4 },
      '115':   { totalCapacityBtuh: 533329, powerInputKW: 49.9, condensingTempF: 132.9 },
      '118.4': { totalCapacityBtuh: 518431, powerInputKW: 51.8, condensingTempF: 135.9 },
      '125':   { totalCapacityBtuh: 489644, powerInputKW: 55.4, condensingTempF: 141.6 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 628182, powerInputKW: 40.4, condensingTempF: 114.6 },
      '115':   { totalCapacityBtuh: 542355, powerInputKW: 50.1, condensingTempF: 133.1 },
      '118.4': { totalCapacityBtuh: 527248, powerInputKW: 51.9, condensingTempF: 136.2 },
      '125':   { totalCapacityBtuh: 497975, powerInputKW: 55.6, condensingTempF: 141.8 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 638727, powerInputKW: 40.6, condensingTempF: 114.9 },
      '115':   { totalCapacityBtuh: 551480, powerInputKW: 50.3, condensingTempF: 133.4 },
      '118.4': { totalCapacityBtuh: 536160, powerInputKW: 52.1, condensingTempF: 136.4 },
      '125':   { totalCapacityBtuh: 506390, powerInputKW: 55.8, condensingTempF: 142.0 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 649393, powerInputKW: 40.8, condensingTempF: 115.2 },
      '115':   { totalCapacityBtuh: 560703, powerInputKW: 50.5, condensingTempF: 133.6 },
      '118.4': { totalCapacityBtuh: 545168, powerInputKW: 52.3, condensingTempF: 136.6 },
      '125':   { totalCapacityBtuh: 514893, powerInputKW: 56.0, condensingTempF: 142.3 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 660408, powerInputKW: 40.9, condensingTempF: 115.5 },
      '115':   { totalCapacityBtuh: 570027, powerInputKW: 50.6, condensingTempF: 133.9 },
      '118.4': { totalCapacityBtuh: 554274, powerInputKW: 52.5, condensingTempF: 136.9 },
      '125':   { totalCapacityBtuh: 523483, powerInputKW: 56.2, condensingTempF: 142.5 },
    },
  },
  'CCU-720': {
    '45': {
      '95':    { totalCapacityBtuh: 665663, powerInputKW: 46.1, condensingTempF: 115.3 },
      '115':   { totalCapacityBtuh: 577935, powerInputKW: 56.7, condensingTempF: 133.8 },
      '118.4': { totalCapacityBtuh: 563643, powerInputKW: 58.7, condensingTempF: 136.8 },
      '125':   { totalCapacityBtuh: 534345, powerInputKW: 62.9, condensingTempF: 142.4 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 676433, powerInputKW: 46.3, condensingTempF: 115.6 },
      '115':   { totalCapacityBtuh: 587358, powerInputKW: 56.9, condensingTempF: 134.0 },
      '118.4': { totalCapacityBtuh: 572878, powerInputKW: 59.0, condensingTempF: 137.0 },
      '125':   { totalCapacityBtuh: 543064, powerInputKW: 63.1, condensingTempF: 142.7 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 687299, powerInputKW: 46.5, condensingTempF: 115.9 },
      '115':   { totalCapacityBtuh: 596865, powerInputKW: 57.2, condensingTempF: 134.3 },
      '118.4': { totalCapacityBtuh: 582195, powerInputKW: 59.2, condensingTempF: 137.3 },
      '125':   { totalCapacityBtuh: 551859, powerInputKW: 63.3, condensingTempF: 142.9 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 698259, powerInputKW: 46.7, condensingTempF: 116.2 },
      '115':   { totalCapacityBtuh: 606456, powerInputKW: 57.4, condensingTempF: 134.6 },
      '118.4': { totalCapacityBtuh: 591596, powerInputKW: 59.4, condensingTempF: 137.5 },
      '125':   { totalCapacityBtuh: 560730, powerInputKW: 63.5, condensingTempF: 143.2 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 709313, powerInputKW: 47.0, condensingTempF: 116.5 },
      '115':   { totalCapacityBtuh: 616131, powerInputKW: 57.6, condensingTempF: 134.8 },
      '118.4': { totalCapacityBtuh: 601080, powerInputKW: 59.6, condensingTempF: 137.8 },
      '125':   { totalCapacityBtuh: 569677, powerInputKW: 63.8, condensingTempF: 143.5 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 720460, powerInputKW: 47.2, condensingTempF: 116.8 },
      '115':   { totalCapacityBtuh: 625889, powerInputKW: 57.8, condensingTempF: 135.1 },
      '118.4': { totalCapacityBtuh: 610647, powerInputKW: 59.8, condensingTempF: 138.0 },
      '125':   { totalCapacityBtuh: 578699, powerInputKW: 64.0, condensingTempF: 143.7 },
    },
  },
  'CCU-780': {
    '45': {
      '95':    { totalCapacityBtuh: 719642, powerInputKW: 50.1, condensingTempF: 117.5 },
      '115':   { totalCapacityBtuh: 623874, powerInputKW: 61.8, condensingTempF: 135.7 },
      '118.4': { totalCapacityBtuh: 607018, powerInputKW: 64.0, condensingTempF: 138.7 },
      '125':   { totalCapacityBtuh: 573973, powerInputKW: 68.5, condensingTempF: 144.4 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 731657, powerInputKW: 50.3, condensingTempF: 117.9 },
      '115':   { totalCapacityBtuh: 634324, powerInputKW: 62.0, condensingTempF: 136.0 },
      '118.4': { totalCapacityBtuh: 617235, powerInputKW: 64.2, condensingTempF: 139.0 },
      '125':   { totalCapacityBtuh: 583628, powerInputKW: 68.8, condensingTempF: 144.6 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 743802, powerInputKW: 50.5, condensingTempF: 118.2 },
      '115':   { totalCapacityBtuh: 644883, powerInputKW: 62.3, condensingTempF: 136.3 },
      '118.4': { totalCapacityBtuh: 627558, powerInputKW: 64.5, condensingTempF: 139.3 },
      '125':   { totalCapacityBtuh: 593379, powerInputKW: 69.0, condensingTempF: 144.9 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 756078, powerInputKW: 50.8, condensingTempF: 118.5 },
      '115':   { totalCapacityBtuh: 655551, powerInputKW: 62.5, condensingTempF: 136.6 },
      '118.4': { totalCapacityBtuh: 637988, powerInputKW: 64.7, condensingTempF: 139.6 },
      '125':   { totalCapacityBtuh: 603226, powerInputKW: 69.3, condensingTempF: 145.2 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 768486, powerInputKW: 51.0, condensingTempF: 118.9 },
      '115':   { totalCapacityBtuh: 666330, powerInputKW: 62.7, condensingTempF: 136.9 },
      '118.4': { totalCapacityBtuh: 648526, powerInputKW: 65.0, condensingTempF: 139.8 },
      '125':   { totalCapacityBtuh: 613170, powerInputKW: 69.6, condensingTempF: 145.5 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 780612, powerInputKW: 51.3, condensingTempF: 119.2 },
      '115':   { totalCapacityBtuh: 677220, powerInputKW: 63.0, condensingTempF: 137.2 },
      '118.4': { totalCapacityBtuh: 659173, powerInputKW: 65.2, condensingTempF: 140.1 },
      '125':   { totalCapacityBtuh: 623211, powerInputKW: 69.8, condensingTempF: 145.8 },
    },
  },
  'CCU-840': {
    '45': {
      '95':    { totalCapacityBtuh: 780782, powerInputKW: 51.9, condensingTempF: 113.7 },
      '115':   { totalCapacityBtuh: 680304, powerInputKW: 64.3, condensingTempF: 132.4 },
      '118.4': { totalCapacityBtuh: 662747, powerInputKW: 66.7, condensingTempF: 135.4 },
      '125':   { totalCapacityBtuh: 629009, powerInputKW: 71.5, condensingTempF: 141.1 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 794097, powerInputKW: 52.1, condensingTempF: 114.0 },
      '115':   { totalCapacityBtuh: 691952, powerInputKW: 64.6, condensingTempF: 132.6 },
      '118.4': { totalCapacityBtuh: 674141, powerInputKW: 66.9, condensingTempF: 135.7 },
      '125':   { totalCapacityBtuh: 639822, powerInputKW: 71.7, condensingTempF: 141.4 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 807566, powerInputKW: 52.3, condensingTempF: 114.3 },
      '115':   { totalCapacityBtuh: 703731, powerInputKW: 64.8, condensingTempF: 132.9 },
      '118.4': { totalCapacityBtuh: 685663, powerInputKW: 67.2, condensingTempF: 135.9 },
      '125':   { totalCapacityBtuh: 650753, powerInputKW: 71.9, condensingTempF: 141.6 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 821189, powerInputKW: 52.6, condensingTempF: 114.5 },
      '115':   { totalCapacityBtuh: 715642, powerInputKW: 65.0, condensingTempF: 133.1 },
      '118.4': { totalCapacityBtuh: 697314, powerInputKW: 67.4, condensingTempF: 136.1 },
      '125':   { totalCapacityBtuh: 661802, powerInputKW: 72.2, condensingTempF: 141.8 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 834966, powerInputKW: 52.8, condensingTempF: 114.8 },
      '115':   { totalCapacityBtuh: 727686, powerInputKW: 65.2, condensingTempF: 133.3 },
      '118.4': { totalCapacityBtuh: 709094, powerInputKW: 67.6, condensingTempF: 136.4 },
      '125':   { totalCapacityBtuh: 672971, powerInputKW: 72.4, condensingTempF: 142.1 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 840422, powerInputKW: 53.0, condensingTempF: 115.1 },
      '115':   { totalCapacityBtuh: 739863, powerInputKW: 65.5, condensingTempF: 133.6 },
      '118.4': { totalCapacityBtuh: 721006, powerInputKW: 67.9, condensingTempF: 136.6 },
      '125':   { totalCapacityBtuh: 684260, powerInputKW: 72.7, condensingTempF: 142.3 },
    },
  },
  'CCU-960': {
    '45': {
      '95':    { totalCapacityBtuh: 903268, powerInputKW: 59.9, condensingTempF: 115.7 },
      '115':   { totalCapacityBtuh: 788982, powerInputKW: 74.4, condensingTempF: 134.1 },
      '118.4': { totalCapacityBtuh: 769334, powerInputKW: 77.2, condensingTempF: 137.1 },
      '125':   { totalCapacityBtuh: 731027, powerInputKW: 82.7, condensingTempF: 142.8 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 918453, powerInputKW: 60.2, condensingTempF: 116.0 },
      '115':   { totalCapacityBtuh: 802336, powerInputKW: 74.7, condensingTempF: 134.4 },
      '118.4': { totalCapacityBtuh: 782406, powerInputKW: 77.4, condensingTempF: 137.3 },
      '125':   { totalCapacityBtuh: 743422, powerInputKW: 83.0, condensingTempF: 143.1 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 933796, powerInputKW: 60.4, condensingTempF: 116.3 },
      '115':   { totalCapacityBtuh: 815829, powerInputKW: 75.0, condensingTempF: 134.6 },
      '118.4': { totalCapacityBtuh: 795616, powerInputKW: 77.7, condensingTempF: 137.6 },
      '125':   { totalCapacityBtuh: 755945, powerInputKW: 83.3, condensingTempF: 143.3 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 949297, powerInputKW: 60.7, condensingTempF: 116.6 },
      '115':   { totalCapacityBtuh: 829461, powerInputKW: 75.2, condensingTempF: 134.9 },
      '118.4': { totalCapacityBtuh: 808963, powerInputKW: 78.0, condensingTempF: 137.9 },
      '125':   { totalCapacityBtuh: 768595, powerInputKW: 83.7, condensingTempF: 143.6 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 964955, powerInputKW: 61.0, condensingTempF: 116.9 },
      '115':   { totalCapacityBtuh: 843233, powerInputKW: 75.5, condensingTempF: 135.2 },
      '118.4': { totalCapacityBtuh: 822449, powerInputKW: 78.3, condensingTempF: 138.1 },
      '125':   { totalCapacityBtuh: 781373, powerInputKW: 84.0, condensingTempF: 143.8 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 980772, powerInputKW: 61.3, condensingTempF: 117.2 },
      '115':   { totalCapacityBtuh: 857146, powerInputKW: 75.8, condensingTempF: 135.4 },
      '118.4': { totalCapacityBtuh: 836073, powerInputKW: 78.6, condensingTempF: 138.4 },
      '125':   { totalCapacityBtuh: 794279, powerInputKW: 84.3, condensingTempF: 144.1 },
    },
  },
  'CCU-1080': {
    '45': {
      '95':    { totalCapacityBtuh: 996892, powerInputKW: 67.9, condensingTempF: 116.4 },
      '115':   { totalCapacityBtuh: 869466, powerInputKW: 84.5, condensingTempF: 134.8 },
      '118.4': { totalCapacityBtuh: 847285, powerInputKW: 87.7, condensingTempF: 137.7 },
      '125':   { totalCapacityBtuh: 803240, powerInputKW: 94.3, condensingTempF: 143.4 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 1013482, powerInputKW: 68.2, condensingTempF: 116.8 },
      '115':   { totalCapacityBtuh: 884179,  powerInputKW: 84.8, condensingTempF: 135.0 },
      '118.4': { totalCapacityBtuh: 861711,  powerInputKW: 88.1, condensingTempF: 138.0 },
      '125':   { totalCapacityBtuh: 816942,  powerInputKW: 94.7, condensingTempF: 143.7 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 1030226, powerInputKW: 68.6, condensingTempF: 117.1 },
      '115':   { totalCapacityBtuh: 899027,  powerInputKW: 85.2, condensingTempF: 135.3 },
      '118.4': { totalCapacityBtuh: 876271,  powerInputKW: 88.4, condensingTempF: 138.3 },
      '125':   { totalCapacityBtuh: 830766,  powerInputKW: 95.1, condensingTempF: 144.0 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 1047122, powerInputKW: 69.0, condensingTempF: 117.4 },
      '115':   { totalCapacityBtuh: 914009,  powerInputKW: 85.6, condensingTempF: 135.6 },
      '118.4': { totalCapacityBtuh: 890962,  powerInputKW: 88.8, condensingTempF: 138.6 },
      '125':   { totalCapacityBtuh: 844711,  powerInputKW: 95.5, condensingTempF: 144.3 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 1064171, powerInputKW: 69.3, condensingTempF: 117.8 },
      '115':   { totalCapacityBtuh: 929125,  powerInputKW: 85.9, condensingTempF: 135.9 },
      '118.4': { totalCapacityBtuh: 905787,  powerInputKW: 89.1, condensingTempF: 138.9 },
      '125':   { totalCapacityBtuh: 858778,  powerInputKW: 95.8, condensingTempF: 144.6 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 1080253, powerInputKW: 69.7, condensingTempF: 118.1 },
      '115':   { totalCapacityBtuh: 944375,  powerInputKW: 86.3, condensingTempF: 136.2 },
      '118.4': { totalCapacityBtuh: 920743,  powerInputKW: 89.5, condensingTempF: 139.2 },
      '125':   { totalCapacityBtuh: 872965,  powerInputKW: 96.2, condensingTempF: 144.9 },
    },
  },
  'CCU-1200': {
    '45': {
      '95':    { totalCapacityBtuh: 1107757, powerInputKW: 76.8,  condensingTempF: 118.5 },
      '115':   { totalCapacityBtuh: 964123,  powerInputKW: 95.6,  condensingTempF: 136.5 },
      '118.4': { totalCapacityBtuh: 939013,  powerInputKW: 99.3,  condensingTempF: 139.5 },
      '125':   { totalCapacityBtuh: 887917,  powerInputKW: 107.1, condensingTempF: 145.2 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 1125935, powerInputKW: 77.2,  condensingTempF: 118.8 },
      '115':   { totalCapacityBtuh: 980346,  powerInputKW: 96.0,  condensingTempF: 136.9 },
      '118.4': { totalCapacityBtuh: 954943,  powerInputKW: 99.7,  condensingTempF: 139.8 },
      '125':   { totalCapacityBtuh: 903048,  powerInputKW: 107.5, condensingTempF: 145.5 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 1144259, powerInputKW: 77.6,  condensingTempF: 119.2 },
      '115':   { totalCapacityBtuh: 996695,  powerInputKW: 96.5,  condensingTempF: 137.2 },
      '118.4': { totalCapacityBtuh: 971000,  powerInputKW: 100.1, condensingTempF: 140.1 },
      '125':   { totalCapacityBtuh: 918293,  powerInputKW: 107.9, condensingTempF: 145.8 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 1162729, powerInputKW: 78.1,  condensingTempF: 119.6 },
      '115':   { totalCapacityBtuh: 1013172, powerInputKW: 96.9,  condensingTempF: 137.5 },
      '118.4': { totalCapacityBtuh: 987181,  powerInputKW: 100.6, condensingTempF: 140.4 },
      '125':   { totalCapacityBtuh: 933650,  powerInputKW: 108.4, condensingTempF: 146.1 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 1181343, powerInputKW: 78.6,  condensingTempF: 119.9 },
      '115':   { totalCapacityBtuh: 1029773, powerInputKW: 97.4,  condensingTempF: 137.8 },
      '118.4': { totalCapacityBtuh: 1003486, powerInputKW: 101.0, condensingTempF: 140.7 },
      '125':   { totalCapacityBtuh: 949120,  powerInputKW: 108.9, condensingTempF: 146.5 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 1200099, powerInputKW: 79.1,  condensingTempF: 120.3 },
      '115':   { totalCapacityBtuh: 1046499, powerInputKW: 97.9,  condensingTempF: 138.2 },
      '118.4': { totalCapacityBtuh: 1019914, powerInputKW: 101.5, condensingTempF: 141.1 },
      '125':   { totalCapacityBtuh: 964700,  powerInputKW: 109.4, condensingTempF: 146.8 },
    },
  },
  'CCU-1380': {
    '45': {
      '95':    { totalCapacityBtuh: 1275211, powerInputKW: 88.3,  condensingTempF: 118.1 },
      '115':   { totalCapacityBtuh: 1080694, powerInputKW: 112.8, condensingTempF: 138.8 },
      '118.4': { totalCapacityBtuh: 1075026, powerInputKW: 113.6, condensingTempF: 139.3 },
      '125':   { totalCapacityBtuh: 1014708, powerInputKW: 122.1, condensingTempF: 145.1 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 1296029, powerInputKW: 88.8,  condensingTempF: 118.5 },
      '115':   { totalCapacityBtuh: 1099316, powerInputKW: 113.2, condensingTempF: 139.1 },
      '118.4': { totalCapacityBtuh: 1092770, powerInputKW: 114.1, condensingTempF: 139.6 },
      '125':   { totalCapacityBtuh: 1031400, powerInputKW: 122.7, condensingTempF: 145.4 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 1317017, powerInputKW: 89.3,  condensingTempF: 118.8 },
      '115':   { totalCapacityBtuh: 1118105, powerInputKW: 113.6, condensingTempF: 139.3 },
      '118.4': { totalCapacityBtuh: 1110645, powerInputKW: 114.6, condensingTempF: 139.9 },
      '125':   { totalCapacityBtuh: 1048205, powerInputKW: 123.2, condensingTempF: 145.7 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 1338172, powerInputKW: 89.8,  condensingTempF: 119.2 },
      '115':   { totalCapacityBtuh: 1137062, powerInputKW: 114.0, condensingTempF: 139.5 },
      '118.4': { totalCapacityBtuh: 1128650, powerInputKW: 115.1, condensingTempF: 140.2 },
      '125':   { totalCapacityBtuh: 1065121, powerInputKW: 123.8, condensingTempF: 146.0 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 1359494, powerInputKW: 90.4,  condensingTempF: 119.5 },
      '115':   { totalCapacityBtuh: 1156187, powerInputKW: 114.5, condensingTempF: 139.7 },
      '118.4': { totalCapacityBtuh: 1146785, powerInputKW: 115.7, condensingTempF: 140.5 },
      '125':   { totalCapacityBtuh: 1082148, powerInputKW: 124.3, condensingTempF: 146.3 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 1380931, powerInputKW: 90.9,  condensingTempF: 119.9 },
      '115':   { totalCapacityBtuh: 1175481, powerInputKW: 114.9, condensingTempF: 140.0 },
      '118.4': { totalCapacityBtuh: 1165049, powerInputKW: 116.2, condensingTempF: 140.8 },
      '125':   { totalCapacityBtuh: 1099285, powerInputKW: 124.9, condensingTempF: 146.6 },
    },
  },
  'CCU-1500': {
    '45': {
      '95':    { totalCapacityBtuh: 1392586, powerInputKW: 102.3, condensingTempF: 120.7 },
      '115':   { totalCapacityBtuh: 1184716, powerInputKW: 129.2, condensingTempF: 140.4 },
      '118.4': { totalCapacityBtuh: 1173163, powerInputKW: 130.8, condensingTempF: 141.4 },
      '125':   { totalCapacityBtuh: 1104215, powerInputKW: 140.3, condensingTempF: 147.2 },
    },
    '46': {
      '95':    { totalCapacityBtuh: 1414826, powerInputKW: 102.9, condensingTempF: 121.1 },
      '115':   { totalCapacityBtuh: 1204472, powerInputKW: 129.7, condensingTempF: 140.7 },
      '118.4': { totalCapacityBtuh: 1191752, powerInputKW: 131.4, condensingTempF: 141.7 },
      '125':   { totalCapacityBtuh: 1121508, powerInputKW: 141.0, condensingTempF: 147.5 },
    },
    '47': {
      '95':    { totalCapacityBtuh: 1437231, powerInputKW: 103.5, condensingTempF: 121.5 },
      '115':   { totalCapacityBtuh: 1224390, powerInputKW: 130.2, condensingTempF: 140.9 },
      '118.4': { totalCapacityBtuh: 1210454, powerInputKW: 132.0, condensingTempF: 142.1 },
      '125':   { totalCapacityBtuh: 1138889, powerInputKW: 141.7, condensingTempF: 147.8 },
    },
    '48': {
      '95':    { totalCapacityBtuh: 1459799, powerInputKW: 104.1, condensingTempF: 121.9 },
      '115':   { totalCapacityBtuh: 1244472, powerInputKW: 130.7, condensingTempF: 141.2 },
      '118.4': { totalCapacityBtuh: 1229269, powerInputKW: 132.7, condensingTempF: 142.4 },
      '125':   { totalCapacityBtuh: 1156359, powerInputKW: 142.4, condensingTempF: 148.1 },
    },
    '49': {
      '95':    { totalCapacityBtuh: 1482529, powerInputKW: 104.8, condensingTempF: 122.3 },
      '115':   { totalCapacityBtuh: 1264718, powerInputKW: 131.3, condensingTempF: 141.4 },
      '118.4': { totalCapacityBtuh: 1248196, powerInputKW: 133.4, condensingTempF: 142.7 },
      '125':   { totalCapacityBtuh: 1173915, powerInputKW: 143.1, condensingTempF: 148.5 },
    },
    '50': {
      '95':    { totalCapacityBtuh: 1504317, powerInputKW: 105.4, condensingTempF: 122.7 },
      '115':   { totalCapacityBtuh: 1285130, powerInputKW: 131.8, condensingTempF: 141.7 },
      '118.4': { totalCapacityBtuh: 1267236, powerInputKW: 134.0, condensingTempF: 143.1 },
      '125':   { totalCapacityBtuh: 1191558, powerInputKW: 143.9, condensingTempF: 148.9 },
    },
  },
};

const BTUH_PER_TON = 12000;

function buildModel(modelNumber: string, perf: CCUPerformanceMatrix): CCUModelSpec {
  // Nominal rating: SST 50°F / 95°F ambient — model numbers match nominal MBH at this point.
  const rated = perf['50']['95'];
  const nominalTons = Math.round((rated.totalCapacityBtuh / BTUH_PER_TON) * 10) / 10;
  const eer = Math.round((rated.totalCapacityBtuh / (rated.powerInputKW * 1000)) * 100) / 100;

  // Structural approximations scaled by nominal tons
  const lengthIn = Math.round(nominalTons * 1.6 + 90);
  const widthIn = Math.round(nominalTons * 0.5 + 55);
  const heightIn = Math.round(nominalTons * 0.4 + 70);
  const weightLbs = Math.round(nominalTons * 75 + 1200);
  const compressorCount = nominalTons <= 50 ? 2 : nominalTons <= 85 ? 3 : nominalTons <= 110 ? 4 : 6;

  return {
    id: `ccu-std-${modelNumber}`,
    seriesId: 'ccu-std',
    modelNumber,
    nominalTons,
    totalCapacityBtuh: rated.totalCapacityBtuh,
    sensibleCapacityBtuh: rated.totalCapacityBtuh,
    airflowCFM: Math.round(nominalTons * 320),
    powerKW: rated.powerInputKW,
    eer,
    leavingDBF: 45,
    leavingWBF: 45,
    compressorCount,
    matchPercent: 100,
    weightLbs,
    lengthIn,
    widthIn,
    heightIn,
    refrigerant: 'R-410A',
    compressorType: 'Scroll',
    performance: perf,
  };
}

export const CCU_MODELS: CCUModelSpec[] = Object.entries(RAW).map(([modelNumber, perf]) =>
  buildModel(modelNumber, perf),
);

/**
 * Find the two tabulated grid values that bracket a target. Clamps to the
 * range edges when the target is outside the table, so extrapolation reduces
 * to using the boundary value.
 */
function bracket(target: number, options: readonly number[]): { lo: number; hi: number; t: number } {
  const sorted = [...options].sort((a, b) => a - b);
  if (target <= sorted[0]) return { lo: sorted[0], hi: sorted[0], t: 0 };
  if (target >= sorted[sorted.length - 1]) {
    const last = sorted[sorted.length - 1];
    return { lo: last, hi: last, t: 0 };
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i] && target <= sorted[i + 1]) {
      const lo = sorted[i];
      const hi = sorted[i + 1];
      const t = hi === lo ? 0 : (target - lo) / (hi - lo);
      return { lo, hi, t };
    }
  }
  return { lo: sorted[0], hi: sorted[0], t: 0 };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Look up a CCU performance point by SST (°F) and ambient temp (°F).
 * Performs bilinear interpolation across the SST × ambient grid; values outside
 * the tabulated range are clamped to the nearest edge.
 */
export function getCCUPerformance(
  modelNumber: string,
  sstF: number,
  ambientF: number,
): CCUPerformancePoint | undefined {
  const model = CCU_MODELS.find(m => m.modelNumber === modelNumber);
  if (!model) return undefined;

  const { lo: sstLo, hi: sstHi, t: tS } = bracket(sstF, CCU_SST_F);
  const { lo: ambLo, hi: ambHi, t: tA } = bracket(ambientF, CCU_AMBIENT_F);

  const p00 = model.performance[String(sstLo)]?.[String(ambLo)];
  const p01 = model.performance[String(sstLo)]?.[String(ambHi)];
  const p10 = model.performance[String(sstHi)]?.[String(ambLo)];
  const p11 = model.performance[String(sstHi)]?.[String(ambHi)];
  if (!p00 || !p01 || !p10 || !p11) return undefined;

  const blend = (k: keyof CCUPerformancePoint) => {
    const lo = lerp(p00[k], p01[k], tA);
    const hi = lerp(p10[k], p11[k], tA);
    return lerp(lo, hi, tS);
  };

  return {
    totalCapacityBtuh: blend('totalCapacityBtuh'),
    powerInputKW: blend('powerInputKW'),
    condensingTempF: blend('condensingTempF'),
  };
}

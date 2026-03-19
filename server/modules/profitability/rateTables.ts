import type { RateEntry, WaiverType, Region, CostDefaults, WaiverDuration } from './types';

// OLTL Rates (Effective January 1, 2025) - Per 15 minutes
export const OLTL_RATES: RateEntry[] = [
  { serviceType: 'PAS_Agency', region1: 4.83, region2: 5.37, region3: 5.05, region4: 5.38, unitType: '15min' },
  { serviceType: 'PAS_Consumer', region1: 3.76, region2: 3.60, region3: 3.93, region4: 4.41, unitType: '15min' },
  { serviceType: 'PAS_Consumer_OT', region1: 5.64, region2: 5.39, region3: 5.90, region4: 6.61, unitType: '15min' },
  { serviceType: 'PAS_CSLA', region1: 4.91, region2: 5.46, region3: 5.15, region4: 5.48, unitType: '15min' },
  { serviceType: 'Respite_Agency', region1: 4.29, region2: 4.77, region3: 4.49, region4: 4.78, unitType: '15min' },
];

// OLTL Hourly Rates (4 units per hour)
export const OLTL_HOURLY_RATES: RateEntry[] = [
  { serviceType: 'PAS_Agency', region1: 19.32, region2: 21.48, region3: 20.20, region4: 21.52, unitType: 'hour' },
  { serviceType: 'PAS_Consumer', region1: 15.04, region2: 14.40, region3: 15.72, region4: 17.64, unitType: 'hour' },
  { serviceType: 'PAS_Consumer_OT', region1: 22.56, region2: 21.56, region3: 23.60, region4: 26.44, unitType: 'hour' },
  { serviceType: 'PAS_CSLA', region1: 19.64, region2: 21.84, region3: 20.60, region4: 21.92, unitType: 'hour' },
  { serviceType: 'Respite_Agency', region1: 17.16, region2: 19.08, region3: 17.96, region4: 19.12, unitType: 'hour' },
];

// ODP Rates (8% higher than OLTL due to additional requirements)
export const ODP_RATES: RateEntry[] = OLTL_HOURLY_RATES.map(rate => ({
  ...rate,
  region1: Number((rate.region1 * 1.08).toFixed(2)),
  region2: Number((rate.region2 * 1.08).toFixed(2)),
  region3: Number((rate.region3 * 1.08).toFixed(2)),
  region4: Number((rate.region4 * 1.08).toFixed(2)),
}));

// Skilled Nursing Rates (OLTL) - Per hour
export const SKILLED_RATES: RateEntry[] = [
  { serviceType: 'LPN', region1: 44.08, region2: 44.08, region3: 44.08, region4: 44.08, unitType: 'hour' },
  { serviceType: 'RN', region1: 66.20, region2: 66.20, region3: 66.20, region4: 66.20, unitType: 'hour' },
  { serviceType: 'OT', region1: 85.16, region2: 85.16, region3: 85.16, region4: 85.16, unitType: 'hour' },
  { serviceType: 'PT', region1: 80.80, region2: 80.80, region3: 80.80, region4: 80.80, unitType: 'hour' },
  { serviceType: 'Speech', region1: 86.88, region2: 86.88, region3: 86.88, region4: 86.88, unitType: 'hour' },
];

// Default Cost Configuration
export const DEFAULT_COSTS: CostDefaults = {
  clientCAC: 575,        // Client acquisition cost
  caregiverCAC: 400,     // Caregiver acquisition cost
  onboardingCost: 200,   // Onboarding admin time value
  overheadPercentage: 0.15, // 15% overhead
  basePay: 12.50,        // Base hourly pay
  premiumPay: 13.00,     // Premium hourly pay
};

// Expected Duration by Waiver Type (in months)
export const WAIVER_DURATION: WaiverDuration = {
  OLTL: 21,    // 18-24 months average
  ODP: 30,     // 24-36+ months average
  Skilled: 9,  // 6-12 months average (episode-based)
};

// Region Names and County Mappings
export const REGION_NAMES: Record<Region, string> = {
  1: 'Western PA',
  2: 'North Central PA',
  3: 'South Central PA',
  4: 'Southeast PA',
};

export const REGION_SHORT_NAMES: Record<Region, string> = {
  1: 'Western',
  2: 'North Central',
  3: 'South Central',
  4: 'Southeast',
};

export const REGION_COUNTIES: Record<Region, string[]> = {
  1: ['Allegheny', 'Armstrong', 'Beaver', 'Fayette', 'Greene', 'Washington', 'Westmoreland'],
  2: ['Bedford', 'Blair', 'Bradford', 'Butler', 'Cambria', 'Cameron', 'Centre', 'Clarion', 'Clearfield', 'Clinton', 'Columbia', 'Crawford', 'Elk', 'Erie', 'Forest', 'Indiana', 'Jefferson', 'Lackawanna', 'Lawrence', 'Luzerne', 'McKean', 'Mercer', 'Mifflin', 'Monroe', 'Montour', 'Northumberland', 'Pike', 'Potter', 'Snyder', 'Somerset', 'Sullivan', 'Susquehanna', 'Tioga', 'Union', 'Venango', 'Warren', 'Wayne', 'Wyoming'],
  3: ['Adams', 'Berks', 'Carbon', 'Cumberland', 'Dauphin', 'Franklin', 'Fulton', 'Huntingdon', 'Juniata', 'Lancaster', 'Lebanon', 'Lehigh', 'Northampton', 'Perry', 'Schuylkill', 'York'],
  4: ['Bucks', 'Chester', 'Delaware', 'Montgomery', 'Philadelphia'],
};

// Get region name by number
export function getRegionName(region: Region): string {
  return REGION_NAMES[region] || `Region ${region}`;
}

// Get region short name by number
export function getRegionShortName(region: Region): string {
  return REGION_SHORT_NAMES[region] || `Region ${region}`;
}

// Get counties for a region
export function getRegionCounties(region: Region): string[] {
  return REGION_COUNTIES[region] || [];
}

// Find region by county name
export function getRegionByCounty(county: string): Region | null {
  const normalizedCounty = county.trim().toLowerCase();
  for (const [region, counties] of Object.entries(REGION_COUNTIES)) {
    if (counties.some(c => c.toLowerCase() === normalizedCounty)) {
      return Number(region) as Region;
    }
  }
  return null;
}

// Service Type Display Names
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  // OLTL
  'PAS_Agency': 'Personal Assistance (Agency)',
  'PAS_Consumer': 'Personal Assistance (Consumer)',
  'PAS_Consumer_OT': 'Personal Assistance (Consumer OT)',
  'PAS_CSLA': 'Personal Assistance (CSLA)',
  'Respite_Agency': 'Respite (Agency)',
  // Skilled
  'LPN': 'Licensed Practical Nurse (LPN)',
  'RN': 'Registered Nurse (RN)',
  'OT': 'Occupational Therapy',
  'PT': 'Physical Therapy',
  'Speech': 'Speech Therapy',
};

// Get rate for a specific waiver, service type, and region
export function getRate(waiverType: WaiverType, serviceType: string, region: Region): number {
  let rates: RateEntry[];
  
  switch (waiverType) {
    case 'OLTL':
      rates = OLTL_HOURLY_RATES;
      break;
    case 'ODP':
      rates = ODP_RATES;
      break;
    case 'Skilled':
      rates = SKILLED_RATES;
      break;
    default:
      return 0;
  }
  
  const entry = rates.find(r => r.serviceType === serviceType);
  if (!entry) return 0;
  
  switch (region) {
    case 1: return entry.region1;
    case 2: return entry.region2;
    case 3: return entry.region3;
    case 4: return entry.region4;
    default: return 0;
  }
}

// Get available service types for a waiver
export function getServiceTypes(waiverType: WaiverType): string[] {
  switch (waiverType) {
    case 'OLTL':
      return OLTL_HOURLY_RATES.map(r => r.serviceType);
    case 'ODP':
      return ODP_RATES.map(r => r.serviceType);
    case 'Skilled':
      return SKILLED_RATES.map(r => r.serviceType);
    default:
      return [];
  }
}

// Get default service type for a waiver
export function getDefaultServiceType(waiverType: WaiverType): string {
  switch (waiverType) {
    case 'OLTL':
      return 'PAS_CSLA'; // Highest tier
    case 'ODP':
      return 'PAS_CSLA';
    case 'Skilled':
      return 'LPN';
    default:
      return '';
  }
}

// Get default pay rate based on waiver and service type
export function getDefaultPayRate(waiverType: WaiverType, serviceType: string): number {
  if (waiverType === 'Skilled') {
    switch (serviceType) {
      case 'LPN': return 25.00;
      case 'RN': return 35.00;
      case 'OT': return 45.00;
      case 'PT': return 42.00;
      case 'Speech': return 45.00;
      default: return 25.00;
    }
  }
  return DEFAULT_COSTS.basePay;
}

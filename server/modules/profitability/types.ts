/**
 * CareBase Profitability Calculator Types
 * Ported from client-profitability-analyzer-main/lib/types.ts
 */

export type WaiverType = 'OLTL' | 'ODP' | 'Skilled';
export type Region = 1 | 2 | 3 | 4;
export type ScheduleType = 'fixed' | 'mostly_fixed' | 'variable';
export type CaregiverType = 'family' | 'non_family';
export type CaregiverSource = 'referral' | 'indeed' | 'job_board' | 'word_of_mouth' | 'other';
export type Recommendation = 'STRONG_YES' | 'YES' | 'MAYBE' | 'CAUTION' | 'HARD_NO';

export type OLTLServiceType = 'PAS_Agency' | 'PAS_Consumer' | 'PAS_Consumer_OT' | 'PAS_CSLA' | 'Respite_Agency';
export type SkilledServiceType = 'LPN' | 'RN' | 'OT' | 'PT' | 'Speech';

export interface RateEntry {
  serviceType: string;
  region1: number;
  region2: number;
  region3: number;
  region4: number;
  unitType: '15min' | 'hour';
}

export interface CaseWorker {
  id: string;
  name?: string;
  type: CaregiverType;
  hoursPerWeek: number;
  payRate?: number;
  caregiverId?: string;
}

export interface StaffingModel {
  totalHoursPerWeek: number;
  workers: CaseWorker[];
  regularHoursPerWorker: number[];
  overtimeHoursPerWorker: number[];
  totalRegularHours: number;
  totalOvertimeHours: number;
}

export interface ClientAssessmentInput {
  clientName: string;
  waiverType: WaiverType;
  region: Region;
  serviceType?: string;
  hoursPerWeek: number;
  scheduleType: ScheduleType;
  caregiverType: CaregiverType;
  caregiverSource: CaregiverSource;
  payRateOverride?: number;
  fitAssessment: FitAssessment;
  staffingModel?: StaffingModel;
  useMultiWorker?: boolean;
  notes?: string;
  hardPassReasons?: string[];
}

export interface FitAssessment {
  hasCaregiversAvailable: boolean;
  inServiceArea: boolean;
  scheduleCompatible: boolean;
  withinCapabilities: boolean;
  familyDynamicsGood: boolean;
}

export interface WorkerProfitability {
  workerId: string;
  workerName?: string;
  workerType: CaregiverType;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  payRate: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  revenueGenerated: number;
  profit: number;
  marginPercentage: number;
}

export interface StaffingAnalysis {
  totalWeeklyHours: number;
  biWeeklyHours: number;
  workerCount: number;
  familyWorkerCount: number;
  nonFamilyWorkerCount: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  overtimeCost: number;
  regularCost: number;
  totalLaborCost: number;
  optimalWorkerCount: number;
  currentOvertimePercentage: number;
  workerBreakdown: WorkerProfitability[];
}

export interface ProfitabilityResults {
  weeklyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  weeklyLabor: number;
  expectedDuration: number;
  reimbursementRate: number;
  caregiverPay: number;
  grossMarginPerHour: number;
  grossMarginPercentage: number;
  otMarginPerHour: number;
  weeklyProfit: number;
  monthlyProfit: number;
  annualProfit: number;
  clientLTV: number;
  totalCAC: number;
  ltvCacRatio: number;
  breakEvenMonths: number;
  churnRiskScore: number;
  churnProbability: number;
  fitScore: number;
  profitabilityScore: number;
  recommendation: Recommendation;
  recommendationText: string;
  staffingAnalysis?: StaffingAnalysis;
}

export interface CostDefaults {
  clientCAC: number;
  caregiverCAC: number;
  onboardingCost: number;
  overheadPercentage: number;
  basePay: number;
  premiumPay: number;
}

export type WaiverDuration = Record<WaiverType, number>;

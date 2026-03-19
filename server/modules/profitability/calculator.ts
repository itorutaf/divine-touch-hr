import type {
  ClientAssessmentInput,
  ProfitabilityResults,
  Recommendation,
  CostDefaults,
  StaffingAnalysis,
  WorkerProfitability,
  CaseWorker,
  StaffingModel,
} from './types';
import { getRate, WAIVER_DURATION, DEFAULT_COSTS, getDefaultPayRate } from './rateTables';

const OT_MULTIPLIER = 1.5;
const REGULAR_HOURS_CAP_NON_FAMILY = 40; // Non-family workers capped at 40 regular hours
const REGULAR_HOURS_CAP_FAMILY = 60; // Family members can work more before OT concerns
const BI_WEEKLY_MULTIPLIER = 2; // Bi-weekly pay period

// Calculate churn risk score based on various factors
function calculateChurnRiskScore(input: ClientAssessmentInput): number {
  let score = 0;
  
  // Caregiver type impact
  if (input.caregiverType === 'family') {
    score -= 30; // Family caregivers have much lower churn
  }
  
  // Caregiver source impact
  switch (input.caregiverSource) {
    case 'indeed':
    case 'job_board':
      score += 20;
      break;
    case 'word_of_mouth':
      score -= 5;
      break;
    case 'referral':
      score += 0;
      break;
    default:
      score += 10;
  }
  
  // Hours impact
  if (input.hoursPerWeek < 20) {
    score += 15; // Part-time has higher churn
  } else if (input.hoursPerWeek > 50) {
    score += 10; // Burnout risk
  }
  
  // Schedule impact
  switch (input.scheduleType) {
    case 'variable':
      score += 10;
      break;
    case 'mostly_fixed':
      score += 5;
      break;
    case 'fixed':
      score += 0;
      break;
  }
  
  // Normalize to 0-100
  return Math.max(0, Math.min(100, score + 50));
}

// Convert churn risk score to probability
function getChurnProbability(score: number): number {
  if (score <= 20) return 0.25;
  if (score <= 40) return 0.50;
  if (score <= 60) return 0.75;
  if (score <= 80) return 0.85;
  return 0.95;
}

// Calculate fit score from assessment
function calculateFitScore(fit: ClientAssessmentInput['fitAssessment']): number {
  const answers = [
    fit.hasCaregiversAvailable,
    fit.inServiceArea,
    fit.scheduleCompatible,
    fit.withinCapabilities,
    fit.familyDynamicsGood,
  ];
  
  const yesCount = answers.filter(Boolean).length;
  return (yesCount / answers.length) * 100;
}

// Calculate LTV:CAC score (0-100)
function getLtvCacScore(ratio: number): number {
  if (ratio >= 5) return 100;
  if (ratio >= 4) return 90;
  if (ratio >= 3) return 80;
  if (ratio >= 2) return 50;
  if (ratio >= 1) return 25;
  return 0;
}

// Calculate margin score (0-100)
function getMarginScore(marginPercentage: number): number {
  if (marginPercentage >= 0.40) return 100;
  if (marginPercentage >= 0.30) return 75;
  if (marginPercentage >= 0.25) return 50;
  if (marginPercentage >= 0.15) return 25;
  return 0;
}

// Calculate break-even score (0-100)
function getBreakEvenScore(months: number): number {
  if (months <= 3) return 100;
  if (months <= 6) return 75;
  if (months <= 9) return 50;
  if (months <= 12) return 25;
  return 0;
}

// Calculate churn score (inverse - lower churn = higher score)
function getChurnScore(probability: number): number {
  if (probability <= 0.30) return 100;
  if (probability <= 0.50) return 75;
  if (probability <= 0.75) return 25;
  return 0;
}

// Get recommendation based on score
function getRecommendation(score: number): Recommendation {
  if (score >= 80) return 'STRONG_YES';
  if (score >= 70) return 'YES';
  if (score >= 50) return 'MAYBE';
  if (score >= 30) return 'CAUTION';
  return 'HARD_NO';
}

// Get recommendation text
function getRecommendationText(recommendation: Recommendation): string {
  switch (recommendation) {
    case 'STRONG_YES':
      return 'Pursue immediately - high priority client';
    case 'YES':
      return 'Take the client - solid opportunity';
    case 'MAYBE':
      return 'Manager review - situational decision';
    case 'CAUTION':
      return 'Only with strategic reason';
    case 'HARD_NO':
      return 'Do not take - will lose money';
  }
}

// Main calculation function
export function calculateProfitability(
  input: ClientAssessmentInput,
  costs: CostDefaults = DEFAULT_COSTS
): ProfitabilityResults {
  // Get reimbursement rate
  const serviceType = input.serviceType || 'PAS_CSLA';
  const reimbursementRate = getRate(input.waiverType, serviceType, input.region);
  
  // Get caregiver pay
  const caregiverPay = input.payRateOverride || getDefaultPayRate(input.waiverType, serviceType);
  
  // Calculate gross margin
  const grossMarginPerHour = reimbursementRate - caregiverPay;
  const grossMarginPercentage = reimbursementRate > 0 ? grossMarginPerHour / reimbursementRate : 0;
  
  // Calculate OT margin (for hours over 40)
  const otPay = caregiverPay * OT_MULTIPLIER;
  // For OT, we use the OT reimbursement rate if available (PAS_Consumer_OT), otherwise same rate
  const otReimbursementRate = input.waiverType === 'OLTL' && serviceType === 'PAS_Consumer'
    ? getRate('OLTL', 'PAS_Consumer_OT', input.region)
    : reimbursementRate;
  const otMarginPerHour = otReimbursementRate - otPay;
  
  // Calculate revenue
  const weeklyRevenue = input.hoursPerWeek * reimbursementRate;
  const monthlyRevenue = weeklyRevenue * 4.33;
  const annualRevenue = weeklyRevenue * 52;
  const weeklyLabor = input.hoursPerWeek * caregiverPay;
  
  // Calculate weekly profit
  let weeklyGrossProfit: number;
  if (input.hoursPerWeek <= 40) {
    weeklyGrossProfit = input.hoursPerWeek * grossMarginPerHour;
  } else {
    const regularHours = 40;
    const otHours = input.hoursPerWeek - 40;
    weeklyGrossProfit = (regularHours * grossMarginPerHour) + (otHours * otMarginPerHour);
  }
  
  // Apply overhead
  const weeklyProfit = weeklyGrossProfit * (1 - costs.overheadPercentage);
  const monthlyProfit = weeklyProfit * 4.33;
  const annualProfit = weeklyProfit * 52;
  
  // Calculate LTV
  const expectedMonths = WAIVER_DURATION[input.waiverType];
  const churnRiskScore = calculateChurnRiskScore(input);
  const churnProbability = getChurnProbability(churnRiskScore);
  const clientLTV = monthlyProfit * expectedMonths * (1 - churnProbability);
  
  // Calculate CAC
  const totalCAC = costs.clientCAC + costs.caregiverCAC + costs.onboardingCost;
  
  // Calculate LTV:CAC ratio
  const ltvCacRatio = totalCAC > 0 ? clientLTV / totalCAC : 0;
  
  // Calculate break-even
  const breakEvenMonths = monthlyProfit > 0 ? totalCAC / monthlyProfit : Infinity;
  
  // Calculate fit score
  const fitScore = calculateFitScore(input.fitAssessment);
  
  // Calculate overall profitability score
  const ltvCacScore = getLtvCacScore(ltvCacRatio);
  const marginScore = getMarginScore(grossMarginPercentage);
  const breakEvenScore = getBreakEvenScore(breakEvenMonths);
  const churnScore = getChurnScore(churnProbability);
  
  const profitabilityScore = 
    (0.25 * ltvCacScore) +
    (0.25 * marginScore) +
    (0.20 * breakEvenScore) +
    (0.15 * churnScore) +
    (0.15 * fitScore);
  
  // Get recommendation
  const recommendation = getRecommendation(profitabilityScore);
  const recommendationText = getRecommendationText(recommendation);
  
  // Calculate staffing analysis if multi-worker mode or high hours
  let staffingAnalysis: StaffingAnalysis | undefined;
  if (input.useMultiWorker || input.staffingModel || input.hoursPerWeek > 40) {
    staffingAnalysis = calculateStaffingAnalysis(input, reimbursementRate, costs);
  }
  
  // Expected duration
  const expectedDuration = WAIVER_DURATION[input.waiverType];
  
  return {
    weeklyRevenue,
    monthlyRevenue,
    annualRevenue,
    weeklyLabor,
    expectedDuration,
    reimbursementRate,
    caregiverPay,
    grossMarginPerHour,
    grossMarginPercentage,
    otMarginPerHour,
    weeklyProfit,
    monthlyProfit,
    annualProfit,
    clientLTV,
    totalCAC,
    ltvCacRatio,
    breakEvenMonths,
    churnRiskScore,
    churnProbability,
    fitScore,
    profitabilityScore,
    recommendation,
    recommendationText,
    staffingAnalysis,
  };
}

// Calculate staffing analysis for multi-worker cases
export function calculateStaffingAnalysis(
  input: ClientAssessmentInput,
  reimbursementRate: number,
  costs: CostDefaults = DEFAULT_COSTS
): StaffingAnalysis {
  const totalWeeklyHours = input.hoursPerWeek;
  const biWeeklyHours = totalWeeklyHours * BI_WEEKLY_MULTIPLIER;
  
  // Get workers from staffing model or create default single worker
  const workers: CaseWorker[] = input.staffingModel?.workers || [{
    id: 'default',
    type: input.caregiverType,
    hoursPerWeek: totalWeeklyHours,
    payRate: input.payRateOverride,
  }];
  
  const serviceType = input.serviceType || 'PAS_CSLA';
  const basePayRate = getDefaultPayRate(input.waiverType, serviceType);
  
  // Calculate per-worker breakdown
  const workerBreakdown: WorkerProfitability[] = workers.map((worker) => {
    const payRate = worker.payRate || basePayRate;
    const regularHoursCap = worker.type === 'family' 
      ? REGULAR_HOURS_CAP_FAMILY 
      : REGULAR_HOURS_CAP_NON_FAMILY;
    
    const regularHours = Math.min(worker.hoursPerWeek, regularHoursCap);
    const overtimeHours = Math.max(0, worker.hoursPerWeek - regularHoursCap);
    
    const regularPay = regularHours * payRate;
    const overtimePay = overtimeHours * payRate * OT_MULTIPLIER;
    const totalPay = regularPay + overtimePay;
    
    const revenueGenerated = worker.hoursPerWeek * reimbursementRate;
    const profit = revenueGenerated - totalPay;
    const marginPercentage = revenueGenerated > 0 ? profit / revenueGenerated : 0;
    
    return {
      workerId: worker.id,
      workerName: worker.name,
      workerType: worker.type,
      regularHours,
      overtimeHours,
      totalHours: worker.hoursPerWeek,
      payRate,
      regularPay,
      overtimePay,
      totalPay,
      revenueGenerated,
      profit,
      marginPercentage,
    };
  });
  
  // Aggregate totals
  const totalRegularHours = workerBreakdown.reduce((sum, w) => sum + w.regularHours, 0);
  const totalOvertimeHours = workerBreakdown.reduce((sum, w) => sum + w.overtimeHours, 0);
  const regularCost = workerBreakdown.reduce((sum, w) => sum + w.regularPay, 0);
  const overtimeCost = workerBreakdown.reduce((sum, w) => sum + w.overtimePay, 0);
  const totalLaborCost = regularCost + overtimeCost;
  
  const familyWorkerCount = workers.filter(w => w.type === 'family').length;
  const nonFamilyWorkerCount = workers.filter(w => w.type === 'non_family').length;
  
  // Calculate optimal worker count (minimize overtime)
  const optimalWorkerCount = Math.ceil(totalWeeklyHours / REGULAR_HOURS_CAP_NON_FAMILY);
  
  const currentOvertimePercentage = totalWeeklyHours > 0 
    ? totalOvertimeHours / totalWeeklyHours 
    : 0;
  
  return {
    totalWeeklyHours,
    biWeeklyHours,
    workerCount: workers.length,
    familyWorkerCount,
    nonFamilyWorkerCount,
    totalRegularHours,
    totalOvertimeHours,
    overtimeCost,
    regularCost,
    totalLaborCost,
    optimalWorkerCount,
    currentOvertimePercentage,
    workerBreakdown,
  };
}

// Calculate optimal staffing model to minimize overtime
export function calculateOptimalStaffing(
  totalHoursPerWeek: number,
  primaryCaregiverType: 'family' | 'non_family'
): { workers: number; hoursPerWorker: number; overtimeHours: number }[] {
  const scenarios: { workers: number; hoursPerWorker: number; overtimeHours: number }[] = [];
  
  // Calculate for 1 to 6 workers
  for (let workerCount = 1; workerCount <= 6; workerCount++) {
    const hoursPerWorker = totalHoursPerWeek / workerCount;
    const regularCap = primaryCaregiverType === 'family' 
      ? REGULAR_HOURS_CAP_FAMILY 
      : REGULAR_HOURS_CAP_NON_FAMILY;
    const overtimeHours = Math.max(0, hoursPerWorker - regularCap) * workerCount;
    
    scenarios.push({
      workers: workerCount,
      hoursPerWorker: Math.round(hoursPerWorker * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
    });
  }
  
  return scenarios;
}

// Helper to format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Helper to format percentage
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Helper to format ratio
export function formatRatio(value: number): string {
  return `${value.toFixed(1)}:1`;
}

// Helper to format months
export function formatMonths(value: number): string {
  if (value === Infinity || value > 99) return '99+ mo';
  return `${value.toFixed(1)} mo`;
}

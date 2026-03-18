import { FullEmployeeExportData } from "./db";

// CSV escape helper
function escapeCSV(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Date formatter
function formatDate(date: Date | string | null | undefined, format: 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'MM/DD/YYYY'): string {
  if (!date) return "";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  return format === 'YYYY-MM-DD' ? `${year}-${month}-${day}` : `${month}/${day}/${year}`;
}

// ============ UKG FORMAT ============
// UKG (Ultimate Kronos Group) uses specific column headers and formats

export interface UKGEmployeeRow {
  EmployeeID: string;
  FirstName: string;
  LastName: string;
  MiddleName: string;
  SSN: string;
  DateOfBirth: string;
  Gender: string;
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
  HomePhone: string;
  WorkPhone: string;
  Email: string;
  HireDate: string;
  TerminationDate: string;
  EmploymentStatus: string;
  EmploymentType: string;
  PayType: string;
  PayRate: string;
  PayFrequency: string;
  FLSAStatus: string;
  Department: string;
  JobTitle: string;
  CostCenter: string;
  FederalFilingStatus: string;
  FederalAllowances: string;
  AdditionalFederalWithholding: string;
  StateFilingStatus: string;
  StateAllowances: string;
  AdditionalStateWithholding: string;
  WorkState: string;
  BankName: string;
  AccountType: string;
  RoutingNumber: string;
  AccountNumber: string;
  DepositType: string;
  DepositAmount: string;
}

export function generateUKGExport(employees: FullEmployeeExportData[]): string {
  const headers = [
    'EmployeeID', 'FirstName', 'LastName', 'MiddleName', 'SSN', 'DateOfBirth', 'Gender',
    'Address1', 'Address2', 'City', 'State', 'ZipCode', 'Country',
    'HomePhone', 'WorkPhone', 'Email', 'HireDate', 'TerminationDate',
    'EmploymentStatus', 'EmploymentType', 'PayType', 'PayRate', 'PayFrequency', 'FLSAStatus',
    'Department', 'JobTitle', 'CostCenter',
    'FederalFilingStatus', 'FederalAllowances', 'AdditionalFederalWithholding',
    'StateFilingStatus', 'StateAllowances', 'AdditionalStateWithholding', 'WorkState',
    'BankName', 'AccountType', 'RoutingNumber', 'AccountNumber', 'DepositType', 'DepositAmount'
  ];
  
  const rows = employees.map(data => {
    const { employee, taxInfo, directDeposits, compensation } = data;
    const primaryDeposit = directDeposits.find(d => d.isPrimary) || directDeposits[0];
    
    return [
      escapeCSV(employee.employeeId),
      escapeCSV(employee.legalFirstName),
      escapeCSV(employee.legalLastName),
      escapeCSV(employee.preferredName || ''),
      escapeCSV(taxInfo?.ssnFull || employee.ssnLast4 ? `XXX-XX-${employee.ssnLast4}` : ''),
      escapeCSV(formatDate(employee.dob)),
      '', // Gender not captured
      escapeCSV(employee.addressLine1 || ''),
      '', // Address2 not captured
      escapeCSV(employee.city || ''),
      escapeCSV(employee.state || ''),
      escapeCSV(employee.zip || ''),
      'US',
      escapeCSV(employee.phone || ''),
      '', // Work phone
      escapeCSV(employee.email || ''),
      escapeCSV(formatDate(employee.proposedStartDate || employee.activeDate)),
      '', // Termination date
      employee.currentPhase === 'Active' ? 'Active' : 'Pending',
      escapeCSV(compensation?.employmentType || 'Part-Time'),
      escapeCSV(compensation?.payType || employee.payType || 'Hourly'),
      escapeCSV(compensation?.payRate || employee.payRate || ''),
      escapeCSV(compensation?.payFrequency || 'Bi-Weekly'),
      escapeCSV(compensation?.flsaStatus || 'Non-Exempt'),
      escapeCSV(compensation?.departmentCode || employee.serviceLine || ''),
      escapeCSV(employee.roleAppliedFor || ''),
      escapeCSV(compensation?.costCenter || ''),
      escapeCSV(taxInfo?.federalFilingStatus || ''),
      escapeCSV(taxInfo?.federalAllowances || '0'),
      escapeCSV(taxInfo?.additionalFederalWithholding || ''),
      escapeCSV(taxInfo?.stateFilingStatus || ''),
      escapeCSV(taxInfo?.stateAllowances || '0'),
      escapeCSV(taxInfo?.additionalStateWithholding || ''),
      escapeCSV(taxInfo?.workState || employee.state || ''),
      escapeCSV(primaryDeposit?.bankName || ''),
      escapeCSV(primaryDeposit?.accountType || ''),
      escapeCSV(primaryDeposit?.routingNumber || ''),
      escapeCSV(primaryDeposit?.accountNumber || ''),
      escapeCSV(primaryDeposit?.depositType || 'Full'),
      escapeCSV(primaryDeposit?.depositAmount || '')
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// ============ ADP FORMAT ============
// ADP uses a slightly different format with their own column naming

export function generateADPExport(employees: FullEmployeeExportData[]): string {
  const headers = [
    'Co Code', 'Batch ID', 'File #', 'First Name', 'Middle Name', 'Last Name', 'Suffix',
    'Address Line 1', 'Address Line 2', 'City', 'State/Province', 'Postal Code', 'Country Code',
    'SSN', 'Birth Date', 'Original Hire Date', 'Most Recent Hire Date',
    'Home Phone', 'Personal Mobile', 'Work Email',
    'Pay Group', 'Pay Frequency', 'Salary/Hourly', 'Standard Hours', 'Pay Rate',
    'Federal Filing Status', 'Federal Exemptions', 'Additional Federal Tax',
    'State Code', 'State Filing Status', 'State Exemptions', 'Additional State Tax',
    'Bank Transit/ABA', 'Bank Account', 'Account Type', 'Deposit Amount Type', 'Deposit Amount'
  ];
  
  const rows = employees.map((data, index) => {
    const { employee, taxInfo, directDeposits, compensation } = data;
    const primaryDeposit = directDeposits.find(d => d.isPrimary) || directDeposits[0];
    
    return [
      'DT01', // Company code - placeholder
      'NEW', // Batch ID
      escapeCSV(employee.employeeId),
      escapeCSV(employee.legalFirstName),
      '', // Middle name
      escapeCSV(employee.legalLastName),
      '', // Suffix
      escapeCSV(employee.addressLine1 || ''),
      '', // Address 2
      escapeCSV(employee.city || ''),
      escapeCSV(employee.state || ''),
      escapeCSV(employee.zip || ''),
      'USA',
      escapeCSV(taxInfo?.ssnFull || ''),
      escapeCSV(formatDate(employee.dob)),
      escapeCSV(formatDate(employee.proposedStartDate || employee.activeDate)),
      escapeCSV(formatDate(employee.proposedStartDate || employee.activeDate)),
      escapeCSV(employee.phone || ''),
      escapeCSV(employee.phone || ''),
      escapeCSV(employee.email || ''),
      escapeCSV(employee.serviceLine || 'HOMECARE'),
      escapeCSV(compensation?.payFrequency || 'B'), // B = Bi-weekly
      compensation?.payType === 'Salary' ? 'S' : 'H',
      '40', // Standard hours
      escapeCSV(compensation?.payRate || employee.payRate || ''),
      escapeCSV(taxInfo?.federalFilingStatus?.charAt(0) || 'S'),
      escapeCSV(taxInfo?.federalAllowances || '0'),
      escapeCSV(taxInfo?.additionalFederalWithholding || '0'),
      escapeCSV(taxInfo?.workState || employee.state || 'PA'),
      escapeCSV(taxInfo?.stateFilingStatus || ''),
      escapeCSV(taxInfo?.stateAllowances || '0'),
      escapeCSV(taxInfo?.additionalStateWithholding || '0'),
      escapeCSV(primaryDeposit?.routingNumber || ''),
      escapeCSV(primaryDeposit?.accountNumber || ''),
      primaryDeposit?.accountType === 'Savings' ? 'S' : 'C',
      primaryDeposit?.depositType === 'Full' ? 'N' : (primaryDeposit?.depositType === 'Percentage' ? 'P' : 'F'),
      escapeCSV(primaryDeposit?.depositAmount || primaryDeposit?.depositPercent || '')
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// ============ HHA EXCHANGE FORMAT ============
// HHA Exchange uses their own specific format for employee imports

export function generateHHAExchangeExport(employees: FullEmployeeExportData[]): string {
  const headers = [
    'EmployeeID', 'ProviderID', 'FirstName', 'LastName', 'MiddleInitial',
    'SSN', 'DateOfBirth', 'Gender', 'Ethnicity',
    'Address1', 'Address2', 'City', 'State', 'ZipCode',
    'HomePhone', 'CellPhone', 'Email',
    'HireDate', 'TermDate', 'Status',
    'PayRate', 'PayType', 'OvertimeRate',
    'Discipline', 'Credentials', 'CredentialExpDate',
    'BackgroundCheckDate', 'BackgroundCheckStatus',
    'CPRCertDate', 'CPRExpDate',
    'TBTestDate', 'TBTestResult',
    'EmergencyContactName', 'EmergencyContactPhone',
    'Notes'
  ];
  
  const rows = employees.map(data => {
    const { employee, taxInfo, compensation, hhaMapping } = data;
    
    return [
      escapeCSV(hhaMapping?.hhaEmployeeId || employee.employeeId),
      escapeCSV(hhaMapping?.hhaProviderId || 'DIVINE_TOUCH'),
      escapeCSV(employee.legalFirstName),
      escapeCSV(employee.legalLastName),
      '', // Middle initial
      escapeCSV(taxInfo?.ssnFull || ''),
      escapeCSV(formatDate(employee.dob, 'MM/DD/YYYY')),
      '', // Gender
      '', // Ethnicity
      escapeCSV(employee.addressLine1 || ''),
      '', // Address2
      escapeCSV(employee.city || ''),
      escapeCSV(employee.state || ''),
      escapeCSV(employee.zip || ''),
      escapeCSV(employee.phone || ''),
      escapeCSV(employee.phone || ''),
      escapeCSV(employee.email || ''),
      escapeCSV(formatDate(employee.proposedStartDate || employee.activeDate, 'MM/DD/YYYY')),
      '', // Term date
      employee.currentPhase === 'Active' ? 'Active' : 'Pending',
      escapeCSV(compensation?.payRate || employee.payRate || ''),
      escapeCSV(compensation?.payType || employee.payType || 'Hourly'),
      escapeCSV(compensation?.overtimeRate || '1.5'),
      escapeCSV(employee.serviceLine || ''),
      escapeCSV(employee.licenseNumber || ''),
      escapeCSV(formatDate(employee.licenseExpDate, 'MM/DD/YYYY')),
      escapeCSV(formatDate(employee.patchDate || employee.fbiDate, 'MM/DD/YYYY')),
      employee.patchReceived && employee.fbiReceived ? 'Cleared' : 'Pending',
      escapeCSV(formatDate(employee.cprExpDate, 'MM/DD/YYYY')), // Using exp as cert date
      escapeCSV(formatDate(employee.cprExpDate, 'MM/DD/YYYY')),
      escapeCSV(formatDate(employee.physicalTbDate, 'MM/DD/YYYY')),
      employee.physicalTbComplete ? 'Negative' : '',
      '', // Emergency contact name
      '', // Emergency contact phone
      escapeCSV(employee.hrNotes || '')
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// ============ GENERIC CSV FORMAT ============
// Full data export with all fields

export function generateGenericExport(employees: FullEmployeeExportData[]): string {
  const headers = [
    'Employee ID', 'First Name', 'Last Name', 'Preferred Name',
    'Date of Birth', 'Phone', 'Email',
    'Address', 'City', 'State', 'ZIP',
    'SSN (Last 4)', 'Full SSN',
    'Service Line', 'Role Applied For', 'Hiring Source',
    'Current Phase', 'Status', 'Hire Date', 'Active Date',
    'Tax Classification', 'Federal Filing Status', 'Federal Allowances',
    'State Filing Status', 'State Allowances', 'Work State',
    'Employment Type', 'FLSA Status', 'Pay Type', 'Pay Rate', 'Pay Frequency',
    'Overtime Eligible', 'Overtime Rate',
    'Bank Name', 'Account Type', 'Routing Number', 'Account Number',
    'PATCH Clearance', 'PATCH Date', 'FBI Clearance', 'FBI Date',
    'Child Abuse Clearance', 'Child Abuse Date',
    'Physical/TB Complete', 'Physical/TB Date',
    'CPR Complete', 'CPR Exp Date',
    'License Verified', 'License Number', 'License Exp Date',
    'I-9 Complete', 'I-9 Verified Date',
    'Payroll Added', 'EVV/HHA Profile Created',
    'HR Notes', 'Compliance Notes'
  ];
  
  const rows = employees.map(data => {
    const { employee, taxInfo, directDeposits, compensation } = data;
    const primaryDeposit = directDeposits.find(d => d.isPrimary) || directDeposits[0];
    
    return [
      escapeCSV(employee.employeeId),
      escapeCSV(employee.legalFirstName),
      escapeCSV(employee.legalLastName),
      escapeCSV(employee.preferredName || ''),
      escapeCSV(formatDate(employee.dob)),
      escapeCSV(employee.phone || ''),
      escapeCSV(employee.email || ''),
      escapeCSV(employee.addressLine1 || ''),
      escapeCSV(employee.city || ''),
      escapeCSV(employee.state || ''),
      escapeCSV(employee.zip || ''),
      escapeCSV(employee.ssnLast4 || ''),
      escapeCSV(taxInfo?.ssnFull || ''),
      escapeCSV(employee.serviceLine || ''),
      escapeCSV(employee.roleAppliedFor || ''),
      escapeCSV(employee.hiringSource || ''),
      escapeCSV(employee.currentPhase || ''),
      escapeCSV(employee.status || ''),
      escapeCSV(formatDate(employee.proposedStartDate)),
      escapeCSV(formatDate(employee.activeDate)),
      escapeCSV(taxInfo?.taxClassification || ''),
      escapeCSV(taxInfo?.federalFilingStatus || ''),
      escapeCSV(taxInfo?.federalAllowances || ''),
      escapeCSV(taxInfo?.stateFilingStatus || ''),
      escapeCSV(taxInfo?.stateAllowances || ''),
      escapeCSV(taxInfo?.workState || ''),
      escapeCSV(compensation?.employmentType || ''),
      escapeCSV(compensation?.flsaStatus || ''),
      escapeCSV(compensation?.payType || employee.payType || ''),
      escapeCSV(compensation?.payRate || employee.payRate || ''),
      escapeCSV(compensation?.payFrequency || ''),
      compensation?.overtimeEligible ? 'Yes' : 'No',
      escapeCSV(compensation?.overtimeRate || ''),
      escapeCSV(primaryDeposit?.bankName || ''),
      escapeCSV(primaryDeposit?.accountType || ''),
      escapeCSV(primaryDeposit?.routingNumber || ''),
      escapeCSV(primaryDeposit?.accountNumber || ''),
      employee.patchReceived ? 'Yes' : 'No',
      escapeCSV(formatDate(employee.patchDate)),
      employee.fbiReceived ? 'Yes' : 'No',
      escapeCSV(formatDate(employee.fbiDate)),
      employee.childAbuseReceived ? 'Yes' : 'No',
      escapeCSV(formatDate(employee.childAbuseDate)),
      employee.physicalTbComplete ? 'Yes' : 'No',
      escapeCSV(formatDate(employee.physicalTbDate)),
      employee.cprComplete ? 'Yes' : 'No',
      escapeCSV(formatDate(employee.cprExpDate)),
      employee.licenseVerified ? 'Yes' : 'No',
      escapeCSV(employee.licenseNumber || ''),
      escapeCSV(formatDate(employee.licenseExpDate)),
      employee.i9Complete ? 'Yes' : 'No',
      escapeCSV(formatDate(employee.i9VerifiedDate)),
      employee.payrollAdded ? 'Yes' : 'No',
      employee.evvHhaProfileCreated ? 'Yes' : 'No',
      escapeCSV(employee.hrNotes || ''),
      escapeCSV(employee.complianceNotes || '')
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// ============ PAYROLL RUN EXPORT ============
// Export hours/pay data for a specific pay period

export interface PayrollRunData {
  employeeId: string;
  firstName: string;
  lastName: string;
  ssn: string;
  regularHours: number;
  overtimeHours: number;
  payRate: number;
  overtimeRate: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
}

export function generatePayrollRunExport(data: PayrollRunData[], targetSystem: 'UKG' | 'ADP' | 'Generic'): string {
  if (targetSystem === 'UKG') {
    const headers = ['EmployeeID', 'PayCode', 'Hours', 'Rate', 'Amount'];
    const rows: string[] = [];
    
    data.forEach(emp => {
      if (emp.regularHours > 0) {
        rows.push([
          escapeCSV(emp.employeeId),
          'REG',
          escapeCSV(emp.regularHours),
          escapeCSV(emp.payRate),
          escapeCSV(emp.regularPay)
        ].join(','));
      }
      if (emp.overtimeHours > 0) {
        rows.push([
          escapeCSV(emp.employeeId),
          'OT',
          escapeCSV(emp.overtimeHours),
          escapeCSV(emp.payRate * emp.overtimeRate),
          escapeCSV(emp.overtimePay)
        ].join(','));
      }
    });
    
    return [headers.join(','), ...rows].join('\n');
  }
  
  if (targetSystem === 'ADP') {
    const headers = ['Co Code', 'File #', 'Temp Dept', 'Reg Hours', 'O/T Hours', 'Hours 3 Code', 'Hours 3 Amount'];
    const rows = data.map(emp => [
      'DT01',
      escapeCSV(emp.employeeId),
      '',
      escapeCSV(emp.regularHours),
      escapeCSV(emp.overtimeHours),
      '',
      ''
    ].join(','));
    
    return [headers.join(','), ...rows].join('\n');
  }
  
  // Generic format
  const headers = [
    'Employee ID', 'First Name', 'Last Name', 'SSN',
    'Regular Hours', 'Overtime Hours', 'Pay Rate', 'OT Rate',
    'Regular Pay', 'Overtime Pay', 'Gross Pay'
  ];
  
  const rows = data.map(emp => [
    escapeCSV(emp.employeeId),
    escapeCSV(emp.firstName),
    escapeCSV(emp.lastName),
    escapeCSV(emp.ssn),
    escapeCSV(emp.regularHours),
    escapeCSV(emp.overtimeHours),
    escapeCSV(emp.payRate),
    escapeCSV(emp.overtimeRate),
    escapeCSV(emp.regularPay.toFixed(2)),
    escapeCSV(emp.overtimePay.toFixed(2)),
    escapeCSV(emp.grossPay.toFixed(2))
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

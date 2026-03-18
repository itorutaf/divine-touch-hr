import { describe, expect, it } from "vitest";
import { 
  generateUKGExport, 
  generateADPExport, 
  generateHHAExchangeExport,
  generateGenericExport 
} from "./payrollExportService";

describe("Payroll Export Service", () => {
  // Mock data matching the FullEmployeeExportData structure
  const mockEmployeeData = [
    {
      employee: {
        id: 1,
        employeeId: "EMP-001",
        legalFirstName: "Jane",
        legalLastName: "Doe",
        preferredName: "JD",
        email: "jane.doe@example.com",
        phone: "555-123-4567",
        addressLine1: "123 Main St",
        city: "Philadelphia",
        state: "PA",
        zip: "19101",
        dob: new Date("1990-05-15"),
        ssnLast4: "6789",
        serviceLine: "OLTL",
        roleAppliedFor: "Caregiver",
        hiringSource: "Indeed",
        currentPhase: "Active",
        status: "Active",
        proposedStartDate: new Date("2024-01-15"),
        activeDate: new Date("2024-01-15"),
        payRate: "15.00",
        payType: "Hourly",
        patchClearance: "Verified",
        patchDate: new Date("2024-01-10"),
        fbiClearance: "Verified",
        fbiDate: new Date("2024-01-10"),
        childAbuseClearance: "Verified",
        childAbuseDate: new Date("2024-01-10"),
        physicalTbComplete: true,
        physicalTbDate: new Date("2024-01-08"),
        cprComplete: true,
        cprExpDate: new Date("2025-01-08"),
        licenseVerified: false,
        i9Complete: true,
        i9VerifiedDate: new Date("2024-01-12"),
        payrollAdded: true,
        evvHhaProfileCreated: true,
      },
      taxInfo: {
        id: 1,
        employeeId: 1,
        taxClassification: "W2",
        ssnFull: "123-45-6789",
        federalFilingStatus: "Single",
        federalAllowances: 1,
        workState: "PA",
        stateFilingStatus: "Single",
        stateAllowances: 1,
        federalExempt: false,
        stateExempt: false,
        w4ReceivedDate: new Date("2024-01-12"),
      },
      compensation: {
        id: 1,
        employeeId: 1,
        employmentType: "Part-Time",
        flsaStatus: "Non-Exempt",
        payRate: "15.00",
        payType: "Hourly",
        payFrequency: "Bi-Weekly",
        overtimeEligible: true,
        overtimeRate: "1.5",
        effectiveDate: new Date("2024-01-15"),
      },
      directDeposits: [
        {
          id: 1,
          employeeId: 1,
          bankName: "First National Bank",
          routingNumber: "123456789",
          accountNumber: "987654321",
          accountType: "Checking",
          depositType: "Percentage",
          depositPercent: "100",
          isPrimary: true,
          isActive: true,
        },
      ],
    },
  ];

  describe("generateUKGExport", () => {
    it("generates valid UKG CSV format", () => {
      const result = generateUKGExport(mockEmployeeData);
      
      expect(result).toContain("EmployeeID");
      expect(result).toContain("FirstName");
      expect(result).toContain("LastName");
      expect(result).toContain("SSN");
      expect(result).toContain("EMP-001");
      expect(result).toContain("Jane");
      expect(result).toContain("Doe");
    });

    it("handles empty employee list", () => {
      const result = generateUKGExport([]);
      
      // Should still have headers
      expect(result).toContain("EmployeeID");
      const lines = result.trim().split("\n");
      expect(lines.length).toBe(1); // Only header row
    });
  });

  describe("generateADPExport", () => {
    it("generates valid ADP CSV format", () => {
      const result = generateADPExport(mockEmployeeData);
      
      expect(result).toContain("Co Code");
      expect(result).toContain("File #");
      expect(result).toContain("SSN");
      expect(result).toContain("Jane");
      expect(result).toContain("Doe");
    });

    it("includes tax and compensation fields", () => {
      const result = generateADPExport(mockEmployeeData);
      
      expect(result).toContain("Pay Rate");
      expect(result).toContain("Pay Frequency");
      expect(result).toContain("15.00");
    });
  });

  describe("generateHHAExchangeExport", () => {
    it("generates valid HHA Exchange CSV format", () => {
      const result = generateHHAExchangeExport(mockEmployeeData);
      
      expect(result).toContain("EmployeeID");
      expect(result).toContain("FirstName");
      expect(result).toContain("LastName");
      expect(result).toContain("EMP-001");
      expect(result).toContain("Jane");
    });

    it("includes service line information", () => {
      const result = generateHHAExchangeExport(mockEmployeeData);
      
      expect(result).toContain("Discipline");
      expect(result).toContain("OLTL");
    });
  });

  describe("generateGenericExport", () => {
    it("generates comprehensive CSV with all fields", () => {
      const result = generateGenericExport(mockEmployeeData);
      
      // Check for key fields in headers
      expect(result).toContain("Employee ID");
      expect(result).toContain("First Name");
      expect(result).toContain("Last Name");
      expect(result).toContain("Pay Rate");
      expect(result).toContain("Bank Name");
      
      // Check for data values
      expect(result).toContain("EMP-001");
      expect(result).toContain("Jane");
      expect(result).toContain("Doe");
    });

    it("includes direct deposit information", () => {
      const result = generateGenericExport(mockEmployeeData);
      
      expect(result).toContain("First National Bank");
      expect(result).toContain("Checking");
    });

    it("handles employees without tax info", () => {
      const dataWithoutTax = [{
        ...mockEmployeeData[0],
        taxInfo: null,
      }];
      
      const result = generateGenericExport(dataWithoutTax);
      
      // Should still generate valid CSV
      expect(result).toContain("EMP-001");
      expect(result).toContain("Jane");
    });

    it("handles employees without direct deposit", () => {
      const dataWithoutDD = [{
        ...mockEmployeeData[0],
        directDeposits: [],
      }];
      
      const result = generateGenericExport(dataWithoutDD);
      
      // Should still generate valid CSV
      expect(result).toContain("EMP-001");
      expect(result).toContain("Jane");
    });
  });
});

describe("Payroll Export Data Completeness", () => {
  it("identifies employees with complete payroll data", () => {
    const completeEmployee = {
      id: 1,
      hasTaxInfo: true,
      hasDirectDeposit: true,
      hasCompensation: true,
    };
    
    const isComplete = completeEmployee.hasTaxInfo && 
                       completeEmployee.hasDirectDeposit && 
                       completeEmployee.hasCompensation;
    
    expect(isComplete).toBe(true);
  });

  it("identifies employees with incomplete payroll data", () => {
    const incompleteEmployee = {
      id: 1,
      hasTaxInfo: true,
      hasDirectDeposit: false,
      hasCompensation: true,
    };
    
    const isComplete = incompleteEmployee.hasTaxInfo && 
                       incompleteEmployee.hasDirectDeposit && 
                       incompleteEmployee.hasCompensation;
    
    expect(isComplete).toBe(false);
  });
});

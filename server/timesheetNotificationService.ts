import { notifyOwner } from "./_core/notification";
import * as db from "./db";

export interface TimesheetReminderResult {
  success: boolean;
  employeesNotified: number;
  notificationSent: boolean;
  error?: string;
}

/**
 * Check for missing timesheets and send reminder notifications
 */
export async function runTimesheetReminderCheck(): Promise<TimesheetReminderResult> {
  try {
    // Get active pay period
    const activePayPeriod = await db.getActivePayPeriod();
    
    if (!activePayPeriod) {
      return {
        success: true,
        employeesNotified: 0,
        notificationSent: false,
        error: "No active pay period found",
      };
    }
    
    // Get employees with missing timesheets
    const missingTimesheets = await db.getEmployeesWithMissingTimesheets(activePayPeriod.id);
    
    if (missingTimesheets.length === 0) {
      return {
        success: true,
        employeesNotified: 0,
        notificationSent: false,
      };
    }
    
    // Calculate days until due
    const dueDate = new Date(activePayPeriod.timesheetDueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine reminder type based on days until due
    let reminderType: "first_reminder" | "second_reminder" | "final_reminder" | "overdue_notice";
    let urgency: string;
    
    if (daysUntilDue < 0) {
      reminderType = "overdue_notice";
      urgency = "OVERDUE";
    } else if (daysUntilDue <= 1) {
      reminderType = "final_reminder";
      urgency = "URGENT - Due Tomorrow";
    } else if (daysUntilDue <= 3) {
      reminderType = "second_reminder";
      urgency = "Due in " + daysUntilDue + " days";
    } else {
      reminderType = "first_reminder";
      urgency = "Due in " + daysUntilDue + " days";
    }
    
    // Build notification content
    const employeeList = missingTimesheets
      .map((emp: any) => `• ${emp.legalFirstName} ${emp.legalLastName} (${emp.employeeId}) - ${emp.email || "No email"}`)
      .join("\n");
    
    const notificationContent = `
**Timesheet Reminder - ${activePayPeriod.periodName}**

**Status:** ${urgency}
**Due Date:** ${dueDate.toLocaleDateString()}
**Missing Timesheets:** ${missingTimesheets.length}

**Employees Missing Timesheets:**
${employeeList}

---
Please follow up with these employees to ensure timesheets are submitted before payroll processing.
    `.trim();
    
    // Send notification to owner/HR
    const notificationSent = await notifyOwner({
      title: `⏰ Timesheet Reminder: ${missingTimesheets.length} Missing - ${urgency}`,
      content: notificationContent,
    });
    
    // Log reminders for each employee
    for (const emp of missingTimesheets) {
      await db.createTimesheetReminder({
        employeeId: emp.id,
        payPeriodId: activePayPeriod.id,
        reminderType,
        sentTo: emp.email || undefined,
        status: notificationSent ? "sent" : "failed",
      });
    }
    
    return {
      success: true,
      employeesNotified: missingTimesheets.length,
      notificationSent,
    };
  } catch (error) {
    console.error("[TimesheetReminder] Error:", error);
    return {
      success: false,
      employeesNotified: 0,
      notificationSent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send individual reminder to a specific employee
 */
export async function sendIndividualReminder(
  employeeId: number,
  payPeriodId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const employee = await db.getEmployeeById(employeeId);
    const payPeriod = await db.getPayPeriodById(payPeriodId);
    
    if (!employee || !payPeriod) {
      return { success: false, error: "Employee or pay period not found" };
    }
    
    const dueDate = new Date(payPeriod.timesheetDueDate);
    
    // In a real implementation, this would send an email to the employee
    // For now, we log the reminder and notify the owner
    await notifyOwner({
      title: `Timesheet Reminder Sent to ${employee.legalFirstName} ${employee.legalLastName}`,
      content: `
A timesheet reminder has been sent to:
- **Employee:** ${employee.legalFirstName} ${employee.legalLastName}
- **Email:** ${employee.email || "No email on file"}
- **Pay Period:** ${payPeriod.periodName}
- **Due Date:** ${dueDate.toLocaleDateString()}

Please ensure this employee submits their timesheet before the deadline.
      `.trim(),
    });
    
    // Log the reminder
    await db.createTimesheetReminder({
      employeeId,
      payPeriodId,
      reminderType: "first_reminder",
      sentTo: employee.email || undefined,
      status: "sent",
    });
    
    return { success: true };
  } catch (error) {
    console.error("[TimesheetReminder] Individual reminder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

# Divine Touch Home Care - HR Onboarding System TODO

## Core Infrastructure
- [x] Database schema with all 76 columns from Google Sheets
- [x] Role-based access control (HR, Admin, Supervisor, Compliance)
- [x] User management with role assignment

## Employee Management
- [x] Employee CRUD operations
- [x] Personal information fields (name, DOB, phone, email, address, SSN last 4)
- [x] Role and service line assignment (OLTL, ODP, Skilled)
- [x] Hiring source and submission tracking

## Onboarding Tracker
- [x] Phase tracking (Intake, Screening, Documentation, Verification, Provisioning, Ready to Schedule, Active)
- [x] Status management (Pending Review, In Progress, Action Required, On Hold, Complete, Withdrawn, Rejected)
- [x] Next action, owner, due date, priority fields
- [x] Escalation flag functionality
- [x] Completion percentage calculation

## 8 Human Gate Approval Workflows
- [x] Gate 1: HR Completeness Review
- [x] Gate 2: Pay Rate/Start Date Approval
- [x] Gate 3: Clearances Verification & Adjudication
- [x] Gate 4: I-9 Verification Logging
- [x] Gate 5: Credential/License Verification (Skilled roles)
- [x] Gate 6: Payroll Verification
- [x] Gate 7: EVV/HHA Admin Verification
- [x] Gate 8: Supervisor Ready for First Shift Sign-off

## Document Management
- [x] DocuSign Packet 1 tracking (envelope ID, status, completion date)
- [x] DocuSign Packet 2 tracking (envelope ID, status, completion date)
- [x] Google Drive folder URL storage (9 subfolder URLs)

## Background Clearances
- [x] PATCH clearance tracking (received, date)
- [x] FBI clearance tracking (received, date)
- [x] Child Abuse clearance tracking (received, date)
- [x] Physical/TB test tracking
- [x] CPR certification tracking with expiration

## Service Line Routing
- [x] OLTL requirements handling
- [x] ODP requirements handling
- [x] Skilled role requirements (license verification gate)
- [x] Conditional field display based on service line

## Dashboard & Reporting
- [x] Pipeline visualization by phase
- [x] Employee counts per phase
- [x] Exceptions view (stuck/attention-required records)
- [x] Filtering and search functionality
- [ ] Weekly digest email capability

## Integrations
- [ ] Google Sheets bidirectional sync
- [ ] Background sync job for Sheets
- [ ] Notification system for gate approvals

## Future Scalability
- [x] Database structure ready for payroll module
- [x] Audit trail for compliance


## Document Upload Feature
- [x] Database schema for employee documents
- [x] S3 storage integration for file uploads
- [x] Document categories (clearances, certifications, ID, forms)
- [x] Upload API endpoints with validation
- [x] Document list view per employee
- [x] Upload UI component with drag-and-drop
- [x] Document preview and download
- [x] Delete document functionality
- [x] Document review workflow (approve/reject)
- [x] Expiration date tracking for clearances/certifications
- [x] Role-based permissions for document management


## Document Expiration Notifications
- [x] Database schema for notification settings and logs
- [x] Document expiration check logic (30-day, 14-day, 7-day warnings)
- [x] Email notification service using built-in notification API
- [x] Notification settings UI for configuring alert thresholds
- [x] Manual "Run Check Now" button for on-demand checks
- [x] Email templates for expiration alerts
- [x] Notification history/log view
- [x] Role-based notification recipients (HR users)
- [x] Document category monitoring toggles


## Dashboard Expiring Documents Widget
- [x] Create expiring documents summary widget component
- [x] Display counts for 7-day, 14-day, 30-day, and expired documents
- [x] Add visual color coding (red for urgent, yellow for warning)
- [x] Link to Settings notifications page for details
- [x] Integrate widget into main dashboard
- [x] Add documents requiring immediate attention list
- [x] Unit tests for dashboard expiring documents endpoint


## Scheduled Document Expiration Checks
- [x] Create API endpoint for scheduled expiration check
- [x] Configure cron job to run daily at 8 AM
- [x] Send digest email to HR with expiring documents summary
- [x] Log scheduled check executions
- [x] Test scheduled task functionality
- [x] Security: X-Cron-Secret header validation
- [x] Unit tests for cron functionality


## Timesheet Management System
- [x] Database schema for timesheets and pay periods
- [x] Timesheet template download/print functionality
- [x] Employee timesheet upload portal
- [x] Per-employee timesheet storage and tracking
- [x] Pay period management (bi-weekly/weekly configuration)
- [x] Timesheet status tracking (pending, submitted, approved, rejected)
- [x] Participant signature tracking (wet/digital)
- [x] EVV compliance status tracking
- [x] Automated email reminders for missing timesheets before payroll
- [x] Admin view to see all employee timesheet submissions
- [x] Timesheet approval workflow for supervisors
- [x] Payroll integration readiness indicator
- [x] Send individual reminders to employees
- [x] Bulk reminder check functionality
- [x] Cron job for daily reminder checks
- [x] Unit tests (21 tests)


## Payroll Report Generation
- [x] API endpoint to generate payroll report from approved timesheets
- [x] CSV export with employee info, hours, pay rates, totals
- [x] Filter by pay period
- [x] Include signature verification status
- [x] Payroll Reports UI page
- [x] Download CSV button
- [x] Preview report data before export
- [x] Unit tests for payroll report generation (8 tests)


## Comprehensive Payroll Export System
- [x] Database schema: Add tax information fields (W-2/1099, federal/state withholding, filing status)
- [x] Database schema: Add benefits fields (health insurance, retirement, deductions)
- [x] Database schema: Add overtime settings (exempt/non-exempt, OT rate multiplier)
- [x] Database schema: Add direct deposit information
- [x] Export format: UKG employee import CSV
- [x] Export format: ADP employee import CSV
- [x] Export format: HHA Exchange employee CSV
- [x] Export format: Payroll run data (hours, rates, totals)
- [x] Payroll Export UI page with provider selection
- [x] Employee tax information management UI (Payroll tab)
- [x] Employee benefits management UI (Payroll tab)
- [x] Field mapping preview before export
- [x] Export history and audit log
- [x] Validation checks before export (required fields)
- [x] Unit tests for export functionality (12 tests)

## Service Line Organization & Onboarding Journeys

- [x] Add Payroll Export and Payroll Reports to sidebar navigation
- [x] Reorganize Employees page with service line tabs (OLTL, ODP, Skilled)
- [x] Create OLTL (Non-Skilled) onboarding journey with 611 documentation
- [x] Create OLTL Skilled onboarding journey with 601 documentation
- [x] Create ODP onboarding journey with state-specific documentation
- [x] Service line-specific documentation checklists
- [x] Phase tracking per service line requirements
- [x] Payroll export validation system for missing/incomplete data
- [x] Validation warnings before export
- [x] Required fields checklist per export provider
- [x] Data completeness dashboard with progress bar
- [x] System-specific validation requirements (UKG, ADP, HHA)

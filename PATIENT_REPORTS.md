# Patient Report System Documentation

## Overview

The Patient Report System has been added to the Medical Insurance Claims Portal to allow doctors to create comprehensive medical reports for patients, which can then be attached to insurance claims during the claim submission process.

## Database Schema

### New Model: PatientReport

```prisma
model PatientReport {
  id            String      @id @default(cuid())
  patientId     String
  doctorId      String
  appointmentId String?     // Optional link to specific appointment
  reportType    ReportType
  title         String
  description   String
  diagnosis     String?
  treatment     String?
  medications   String?     // JSON string or text field for medication details
  recommendations String?
  followUpDate  DateTime?
  documentUrl   String?     // Optional file attachment URL
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  patient       User        @relation("PatientReports", fields: [patientId], references: [id])
  doctor        User        @relation("DoctorReports", fields: [doctorId], references: [id])
  appointment   Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  
  // Reports can be attached to claims
  claimReports  ClaimReport[]

  @@map("patient_reports")
}
```

### New Junction Model: ClaimReport

```prisma
model ClaimReport {
  id         String        @id @default(cuid())
  claimId    String
  reportId   String
  attachedAt DateTime      @default(now())
  attachedBy String        // User who attached the report to claim
  
  // Relations
  claim      Claim         @relation(fields: [claimId], references: [id], onDelete: Cascade)
  report     PatientReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  user       User          @relation("ClaimReportAttachments", fields: [attachedBy], references: [id])
  
  @@unique([claimId, reportId]) // Prevent duplicate attachments
  @@map("claim_reports")
}
```

### New Enum: ReportType

```prisma
enum ReportType {
  DIAGNOSIS_REPORT
  TREATMENT_SUMMARY
  PRESCRIPTION_REPORT
  LAB_REPORT
  SCAN_REPORT
  FOLLOW_UP_REPORT
  DISCHARGE_SUMMARY
}
```

## API Endpoints

### Patient Reports

- `GET /api/patient-reports` - List patient reports with filtering
- `POST /api/patient-reports` - Create new patient report (doctor only)
- `GET /api/patient-reports/[id]` - Get specific patient report
- `PUT /api/patient-reports/[id]` - Update patient report (doctor only)
- `DELETE /api/patient-reports/[id]` - Delete patient report (doctor only)

### Claim Report Attachments

- `POST /api/claims/[id]/attach-report` - Attach report to claim (patient only)
- `POST /api/claims/[id]/detach-report` - Detach report from claim (patient only)

## React Hooks

### usePatientReports Hook

```typescript
// Get patient reports with filtering
const { data: reportsData, isLoading } = usePatientReports({
  patientId: 'user-id',
  doctorId: 'doctor-id',
  appointmentId: 'appointment-id',
  reportType: 'DIAGNOSIS_REPORT',
  isActive: true,
  page: 1,
  limit: 10
})

// Create new patient report
const createReport = useCreatePatientReport()
await createReport.mutateAsync({
  patientId: 'patient-id',
  appointmentId: 'appointment-id',
  reportType: 'DIAGNOSIS_REPORT',
  title: 'Report Title',
  description: 'Report Description',
  diagnosis: 'Patient Diagnosis',
  treatment: 'Treatment Provided',
  medications: 'Prescribed Medications',
  recommendations: 'Follow-up Recommendations',
  followUpDate: '2024-02-01T10:00:00Z',
  documentUrl: 'https://...'
})

// Update patient report
const updateReport = useUpdatePatientReport()
await updateReport.mutateAsync({
  id: 'report-id',
  data: { title: 'Updated Title' }
})

// Delete patient report
const deleteReport = useDeletePatientReport()
await deleteReport.mutateAsync('report-id')

// Attach report to claim
const attachReport = useAttachReportToClaim()
await attachReport.mutateAsync({
  claimId: 'claim-id',
  reportId: 'report-id'
})

// Detach report from claim
const detachReport = useDetachReportFromClaim()
await detachReport.mutateAsync({
  claimId: 'claim-id',
  reportId: 'report-id'
})
```

## UI Components

### CreatePatientReportModal

Modal component for doctors to create new patient reports with the following features:
- Report type selection with descriptions
- Form fields for all report data
- Optional appointment linking
- Validation and error handling
- Loading states and success notifications

### AttachReportsToClaimModal

Modal component for patients to attach their medical reports to claims with:
- List of available patient reports
- Report filtering (excludes already attached reports)
- Multi-select capability with checkboxes
- Report details preview
- Batch attachment functionality

## User Workflow

### For Doctors:
1. Access patient appointment or dashboard
2. Click "Add Report" or similar action
3. Fill out the CreatePatientReportModal form
4. Select appropriate report type and fill in medical details
5. Submit to create the report

### For Patients:
1. Create or edit an insurance claim
2. Click "Attach Medical Reports" during claim process
3. View available medical reports from doctors
4. Select relevant reports using checkboxes
5. Attach selected reports to the claim
6. Submit claim with attached medical documentation

## Security & Authorization

### Role-Based Access Control:
- **Doctors**: Can create, read, update, and delete their own reports
- **Patients**: Can read their own reports and attach them to their claims
- **Insurance**: Can read all reports for review purposes
- **Bank**: Can read all reports for payment processing

### Data Validation:
- Report ownership verification (doctors can only modify their own reports)
- Appointment verification (reports can only be linked to doctor's appointments)
- Patient verification (reports can only be attached to patient's own claims)
- Duplicate prevention (same report cannot be attached to same claim twice)

## Benefits

1. **Streamlined Documentation**: Doctors can easily create comprehensive medical reports
2. **Enhanced Claims Processing**: Patients can attach relevant medical documentation to support their claims
3. **Improved Transparency**: All stakeholders can access relevant medical information
4. **Better Organization**: Reports are linked to appointments and can be categorized by type
5. **Audit Trail**: Complete tracking of who created, modified, and attached reports

## Future Enhancements

- File upload integration for supporting documents
- Report templates for common medical scenarios
- Digital signature capabilities for doctors
- Report analytics and insights
- Integration with external medical systems
- Automated report generation from appointment notes

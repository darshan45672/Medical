import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create demo users
  const patient = await prisma.user.upsert({
    where: { email: 'patient@demo.com' },
    update: {},
    create: {
      email: 'patient@demo.com',
      password: hashedPassword,
      name: 'John Patient',
      role: 'PATIENT',
      phone: '+1-555-0101',
      address: '123 Main St, City, State 12345',
    },
  })

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@demo.com' },
    update: {},
    create: {
      email: 'doctor@demo.com',
      password: hashedPassword,
      name: 'Dr. Sarah Wilson',
      role: 'DOCTOR',
      phone: '+1-555-0102',
      address: '456 Medical Center Dr, City, State 12345',
    },
  })

  const insurance = await prisma.user.upsert({
    where: { email: 'insurance@demo.com' },
    update: {},
    create: {
      email: 'insurance@demo.com',
      password: hashedPassword,
      name: 'Insurance Agent',
      role: 'INSURANCE',
      phone: '+1-555-0103',
      address: '789 Insurance Plaza, City, State 12345',
    },
  })

  const bank = await prisma.user.upsert({
    where: { email: 'bank@demo.com' },
    update: {},
    create: {
      email: 'bank@demo.com',
      password: hashedPassword,
      name: 'Bank Representative',
      role: 'BANK',
      phone: '+1-555-0104',
      address: '321 Banking Ave, City, State 12345',
    },
  })

  // Create additional patients
  const patient2 = await prisma.user.upsert({
    where: { email: 'patient2@demo.com' },
    update: {},
    create: {
      email: 'patient2@demo.com',
      password: hashedPassword,
      name: 'Mary Johnson',
      role: 'PATIENT',
      phone: '+1-555-0105',
      address: '789 Elm St, City, State 12345',
    },
  })

  const patient3 = await prisma.user.upsert({
    where: { email: 'patient3@demo.com' },
    update: {},
    create: {
      email: 'patient3@demo.com',
      password: hashedPassword,
      name: 'Robert Brown',
      role: 'PATIENT',
      phone: '+1-555-0106',
      address: '321 Oak Ave, City, State 12345',
    },
  })

  // Create an appointment and mark it as accepted
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-01-10T10:00:00'),
      status: 'COMPLETED',
      notes: 'General checkup appointment - Completed',
    },
  })

  // Create more appointments for different patients
  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-01-15T14:00:00'),
      status: 'CONSULTED',
      notes: 'Follow-up consultation for chronic condition',
    },
  })

  const appointment3 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-01-20T11:00:00'),
      status: 'COMPLETED',
      notes: 'Annual physical examination',
    },
  })

  // Create more recent appointments
  const appointment4 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-07-15T09:00:00'),
      status: 'COMPLETED',
      notes: 'Recent check-up for medication adjustment',
    },
  })

  // Create additional appointments with different statuses for better demonstration
  const appointment5 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-12-20T14:30:00'),
      status: 'PENDING',
      notes: 'Requested appointment for annual physical exam',
    },
  })

  const appointment6 = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-12-22T11:15:00'),
      status: 'ACCEPTED',
      notes: 'Follow-up appointment for blood test results',
    },
  })

  const appointment7 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-12-18T10:00:00'),
      status: 'CONSULTED',
      notes: 'Patient consulted for blood pressure monitoring. Prescribed medication.',
    },
  })

  const appointment8 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-12-10T15:45:00'),
      status: 'REJECTED',
      notes: 'Appointment request rejected due to scheduling conflict',
    },
  })

  // Create patient reports for the appointments
  const report1 = await prisma.patientReport.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentId: appointment.id,
      reportType: 'DIAGNOSIS_REPORT',
      title: 'General Health Assessment',
      description: 'Comprehensive health check including vital signs, blood work, and physical examination.',
      diagnosis: 'Overall good health with minor vitamin D deficiency',
      treatment: 'Vitamin D supplements recommended',
      medications: 'Vitamin D3 2000 IU daily',
      recommendations: 'Continue healthy lifestyle, follow-up in 6 months',
      followUpDate: new Date('2024-07-10'),
      documentUrl: 'https://example.com/reports/general_health_john.pdf',
    },
  })

  const report2 = await prisma.patientReport.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      appointmentId: appointment2.id,
      reportType: 'TREATMENT_SUMMARY',
      title: 'Diabetes Management Follow-up',
      description: 'Regular follow-up for Type 2 diabetes management and medication adjustment.',
      diagnosis: 'Type 2 Diabetes Mellitus - Well controlled',
      treatment: 'Continue current medication regimen with dosage adjustment',
      medications: 'Metformin 1000mg twice daily, Lisinopril 10mg daily',
      recommendations: 'Continue low-carb diet, regular exercise, blood sugar monitoring',
      followUpDate: new Date('2024-04-15'),
      documentUrl: 'https://example.com/reports/diabetes_mary.pdf',
    },
  })

  const report3 = await prisma.patientReport.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor.id,
      appointmentId: appointment3.id,
      reportType: 'LAB_REPORT',
      title: 'Annual Physical Lab Results',
      description: 'Complete metabolic panel, lipid profile, and CBC results from annual physical.',
      diagnosis: 'Mild hyperlipidemia, otherwise normal',
      treatment: 'Dietary modifications and lifestyle changes',
      medications: 'None prescribed at this time',
      recommendations: 'Low-cholesterol diet, increase physical activity, recheck in 3 months',
      followUpDate: new Date('2024-04-20'),
      documentUrl: 'https://example.com/reports/annual_physical_robert.pdf',
    },
  })

  // Create additional report for recent appointment
  const report4 = await prisma.patientReport.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      appointmentId: appointment4.id,
      reportType: 'PRESCRIPTION_REPORT',
      title: 'Medication Adjustment Report',
      description: 'Review and adjustment of diabetes medications based on recent blood work.',
      diagnosis: 'Type 2 Diabetes - Medication adjustment needed',
      treatment: 'Increased Metformin dosage, added Glipizide',
      medications: 'Metformin 1000mg twice daily, Glipizide 5mg daily, Lisinopril 10mg daily',
      recommendations: 'Monitor blood glucose closely, follow-up in 2 months',
      followUpDate: new Date('2024-09-15'),
      documentUrl: 'https://example.com/reports/medication_adjustment_mary.pdf',
    },
  })

  // Doctor uploads a medical report for the appointment
  const document = await prisma.document.create({
    data: {
      type: 'MEDICAL_REPORT',
      filename: 'checkup_report_jan.pdf',
      originalName: 'Checkup_Report_Jan.pdf',
      url: 'https://example.com/reports/checkup_report_jan.pdf',
      size: 234567,
      mimeType: 'application/pdf',
      appointmentId: appointment.id,
      uploadedById: doctor.id,
    },
  })

  // Create a claim by the patient for this report
  const claim = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-006-DEMO-APPOINTMENTS',
      patientId: patient.id,
      doctorId: doctor.id,
      diagnosis: 'General Health Check',
      treatmentDate: new Date('2024-01-10'),
      claimAmount: 300.0,
      description: 'General health checkup, blood tests, and consultation.',
      status: 'APPROVED',
      approvedAmount: 275.0,
      submittedAt: new Date('2024-01-11'),
      approvedAt: new Date('2024-01-13'),
      documents: {
        connect: { id: document.id }, // Link the uploaded report to the claim
      },
    },
  })

  // Payment by bank for approved claim
  await prisma.payment.create({
    data: {
      claimId: claim.id,
      amount: 275.0,
      status: 'COMPLETED',
      paymentDate: new Date('2024-01-15'),
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-004-DEMO',
      notes: 'Reimbursement to patient via direct deposit.',
      processedAt: new Date('2024-01-15'),
      processedBy: bank.id,
    },
  })

  // Create additional test payments with different statuses
  // Find or create another approved claim for testing
  const additionalClaim = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-002-TEST',
      patientId: patient2.id,
      diagnosis: 'Regular Health Checkup',
      treatmentDate: new Date('2025-08-01'),
      claimAmount: '150.00',
      status: 'APPROVED',
      approvedAmount: '150.00',
      approvedAt: new Date('2025-08-02'),
    },
  })

  // Pending payment
  await prisma.payment.create({
    data: {
      claimId: additionalClaim.id,
      amount: 150.0,
      status: 'PENDING',
    },
  })

  // Processing payment
  const processingClaim = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-003-TEST',
      patientId: patient3.id,
      diagnosis: 'Physical Therapy Session',
      treatmentDate: new Date('2025-08-02'),
      claimAmount: '200.00',
      status: 'APPROVED',
      approvedAmount: '200.00',
      approvedAt: new Date('2025-08-03'),
    },
  })

  await prisma.payment.create({
    data: {
      claimId: processingClaim.id,
      amount: 200.0,
      status: 'PROCESSING',
      processedAt: new Date(),
      processedBy: bank.id,
      transactionId: 'TXN-005-PROCESSING',
    },
  })

  console.log('\n✅ Database seeded successfully!')
  console.log('Demo users:')
  console.log('🔹 Patient 1:  patient@demo.com / password123 (John Patient)')
  console.log('🔹 Patient 2:  patient2@demo.com / password123 (Mary Johnson)')
  console.log('🔹 Patient 3:  patient3@demo.com / password123 (Robert Brown)')
  console.log('🔹 Doctor:     doctor@demo.com / password123 (Dr. Sarah Wilson)')
  console.log('🔹 Insurance:  insurance@demo.com / password123')
  console.log('🔹 Bank:       bank@demo.com / password123')
  console.log('\n📋 Sample data includes:')
  console.log('• 4 completed/consulted appointments')
  console.log('• 4 patient reports with different types')
  console.log('• 1 approved claim with payment')
  console.log('\n🩺 To test the patient management system:')
  console.log('1. Login as doctor@demo.com')
  console.log('2. Go to "View My Patients" from dashboard')
  console.log('3. Click on any patient to view detailed information')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

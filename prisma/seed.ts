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

  // Create an appointment and mark it as accepted
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: new Date('2024-01-10T10:00:00'),
      status: 'ACCEPTED',
      notes: 'General checkup appointment',
    },
  })

  // Doctor uploads a medical report for the appointment
  const report = await prisma.document.create({
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
      claimNumber: 'CLM-004-DEMO',
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
        connect: { id: report.id }, // Link the uploaded report to the claim
      },
    },
  })

  // Payment by bank for approved claim
  await prisma.payment.create({
    data: {
      claimId: claim.id,
      amount: 275.0,
      paymentDate: new Date('2024-01-15'),
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-004-DEMO',
      notes: 'Reimbursement to patient via direct deposit.',
    },
  })

  console.log('\n✅ Database seeded successfully!')
  console.log('Demo users:')
  console.log('🔹 Patient:    patient@demo.com / password123')
  console.log('🔹 Doctor:     doctor@demo.com / password123')
  console.log('🔹 Insurance:  insurance@demo.com / password123')
  console.log('🔹 Bank:       bank@demo.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

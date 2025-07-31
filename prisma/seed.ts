import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hash password for demo accounts
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

  // Create some sample claims
  const claim1 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-001-DEMO',
      patientId: patient.id,
      doctorId: doctor.id,
      diagnosis: 'Annual Health Checkup',
      treatmentDate: new Date('2024-01-15'),
      claimAmount: 250.00,
      description: 'Routine annual physical examination including blood work and basic screening tests.',
      status: 'APPROVED',
      approvedAmount: 225.00,
      submittedAt: new Date('2024-01-16'),
      approvedAt: new Date('2024-01-18'),
    },
  })

  const claim2 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-002-DEMO',
      patientId: patient.id,
      doctorId: doctor.id,
      diagnosis: 'Flu Treatment',
      treatmentDate: new Date('2024-02-10'),
      claimAmount: 150.00,
      description: 'Treatment for seasonal flu including consultation and prescribed medication.',
      status: 'UNDER_REVIEW',
      submittedAt: new Date('2024-02-11'),
    },
  })

  const claim3 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-003-DEMO',
      patientId: patient.id,
      diagnosis: 'Dental Cleaning',
      treatmentDate: new Date('2024-03-05'),
      claimAmount: 120.00,
      description: 'Routine dental cleaning and oral examination.',
      status: 'DRAFT',
    },
  })

  // Create a payment for the approved claim
  await prisma.payment.create({
    data: {
      claimId: claim1.id,
      amount: 225.00,
      paymentDate: new Date('2024-01-20'),
      paymentMethod: 'Direct Deposit',
      transactionId: 'TXN-001-DEMO',
      notes: 'Payment processed successfully',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Demo accounts created:')
  console.log('- Patient: patient@demo.com / password123')
  console.log('- Doctor: doctor@demo.com / password123')
  console.log('- Insurance: insurance@demo.com / password123')
  console.log('- Bank: bank@demo.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
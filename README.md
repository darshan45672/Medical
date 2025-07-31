# 🏥 Insurance Claims Processing System

A comprehensive, full-stack web application for managing insurance claims with role-based access control for Patients, Doctors, Insurance companies, and Banks.

## ✨ Features

### 🔐 **Multi-Role Authentication**
- **Patients**: Submit and track claims
- **Doctors**: Review and approve medical claims
- **Insurance**: Process and approve claims
- **Banks**: Handle payments for approved claims

### 📋 **Claims Management**
- Create, edit, and track insurance claims
- Real-time status updates
- Document upload and management
- Approval workflow system

### 💰 **Financial Processing**
- Claim amount calculation
- Payment tracking
- Transaction history
- Financial reporting

### 🔒 **Security & Compliance**
- Role-based access control (RBAC)
- Secure authentication with NextAuth.js
- Data encryption and protection
- HIPAA-compliant document handling

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI
- **Authentication**: NextAuth.js with role-based access
- **Database**: Prisma ORM with PostgreSQL (Neon)
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **File Storage**: AWS S3 with signed URLs
- **Notifications**: Sonner (Toast notifications)
- **Forms**: React Hook Form with Zod validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Neon/Supabase)
- AWS S3 bucket (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insu-claim-again
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/insurance_claims"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # AWS S3 (for file uploads)
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="your-s3-bucket-name"
   ```

4. **Set up the database**
   ```bash
   # Push the schema to your database
   npm run db:push
   
   # Seed with demo data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 Demo Accounts

The application comes with pre-configured demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Patient | `patient@demo.com` | `password123` | Submit and track claims |
| Doctor | `doctor@demo.com` | `password123` | Review patient claims |
| Insurance | `insurance@demo.com` | `password123` | Approve/reject claims |
| Bank | `bank@demo.com` | `password123` | Process payments |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── claims/            # Claims management
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn UI components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions
```

## 🗄️ Database Schema

The application uses the following main entities:

- **Users**: Patients, Doctors, Insurance agents, Bank representatives
- **Claims**: Insurance claims with status tracking
- **Documents**: File attachments for claims
- **Payments**: Payment records for approved claims

## 🔄 Claim Workflow

1. **Patient** creates a new claim
2. **Doctor** reviews and adds medical notes
3. **Insurance** agent reviews and approves/rejects
4. **Bank** processes payment for approved claims
5. All parties receive real-time notifications

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control
- Protected API routes
- Secure file uploads
- Input validation and sanitization

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Prisma](https://prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Vercel](https://vercel.com/) - Deployment platform

---

Built with ❤️ using modern web technologies

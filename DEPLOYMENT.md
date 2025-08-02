# Deployment Configuration

## Vercel Deployment

### Required Environment Variables

1. **DATABASE_URL**: PostgreSQL connection string
   ```
   postgresql://username:password@hostname:port/database
   ```

2. **NEXTAUTH_SECRET**: Random secret for NextAuth.js
   ```
   # Generate with: openssl rand -base64 32
   your-secret-here
   ```

3. **NEXTAUTH_URL**: Your deployment URL
   ```
   https://your-app.vercel.app
   ```

4. **AWS S3 Configuration** (for file uploads):
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   ```

### Build Configuration

The project is configured with:
- Automatic Prisma Client generation during build
- Optimized build scripts
- Proper vercel.json configuration

### Database Setup

1. Create a PostgreSQL database (recommended: Vercel Postgres, Supabase, or PlanetScale)
2. Set the DATABASE_URL environment variable in Vercel
3. The database schema will be automatically applied during deployment

### Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set all required environment variables in Vercel dashboard
3. Deploy the application

The build process will automatically:
- Install dependencies
- Generate Prisma Client
- Build the Next.js application
- Deploy to Vercel

## Local Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Run development server
npm run dev
```

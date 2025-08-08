# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for your medical application.

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Your Medical App (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000` (for development) or your production domain
   - **Application description**: Medical claims management system
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

4. Click "Register application"
5. Copy the **Client ID** that appears
6. Click "Generate a new client secret" and copy the **Client Secret**

## Step 2: Update Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your GitHub OAuth credentials to `.env.local`:
   ```env
   GITHUB_CLIENT_ID="your-github-client-id-here"
   GITHUB_CLIENT_SECRET="your-github-client-secret-here"
   ```

3. Make sure you also have:
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-random-secret-string-here"
   ```

## Step 3: Test GitHub OAuth

1. Start your development server:
   ```bash
   npm run dev
   ```

2. **Sign In**: Go to `http://localhost:3000/auth/signin`
   - Click "Continue with GitHub" to sign in with existing GitHub account

3. **Sign Up**: Go to `http://localhost:3000/auth/signup`
   - Click "Continue with GitHub" to create a new account using GitHub
   - **New users** will be redirected to complete their profile after GitHub authentication
   - You'll need to provide: phone number, address, and select your account type

4. **Profile Completion**: New GitHub users will automatically be redirected to `/auth/complete-profile`
   - Fill in phone number and address
   - Select your account type (Patient, Doctor, Insurance, Bank)
   - Click "Complete Profile" to finish setup

5. After completing profile, you'll be redirected to the dashboard

## Important Notes

- **New GitHub users** are initially created with the `PATIENT` role but can change it during profile completion
- **Profile completion** is required for new GitHub users to collect phone and address information
- **Existing users** who sign in with GitHub will use their existing account if the email matches
- GitHub OAuth users don't have passwords in the database (password field will be null)
- Users can still use both GitHub OAuth and email/password authentication methods
- **Profile Guard**: Users with incomplete profiles are automatically redirected to complete them
- **Role changes**: GitHub users can select their preferred role during profile completion

## Production Setup

For production, update your GitHub OAuth app settings:
- **Homepage URL**: Your production domain (e.g., `https://yourdomain.com`)
- **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`
- Update `NEXTAUTH_URL` in your production environment variables

## Troubleshooting

- **"OAuth app not found"**: Check that your CLIENT_ID is correct
- **"Bad verification code"**: Check that your CLIENT_SECRET is correct
- **"Redirect URI mismatch"**: Make sure the callback URL in GitHub matches exactly
- **"Invalid client"**: Make sure your environment variables are loaded correctly

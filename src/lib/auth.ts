import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github') {
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            // Create new user with default role (PATIENT) and incomplete profile flag
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || user.email!,
                role: 'PATIENT',
                // Mark profile as incomplete for new OAuth users
                phone: null,
                address: null,
                // Don't set password for OAuth users
              },
            })
          }
          // If user exists, allow the sign in (this enables automatic account linking)
          return true
        } catch (error) {
          console.error('Error during GitHub sign in:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      // If this is a session update trigger, fetch fresh user data
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            role: true,
            phone: true,
            address: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id
          token.phone = dbUser.phone
          token.address = dbUser.address
        }
      }
      
      if (user) {
        if (account?.provider === 'github') {
          // For GitHub OAuth, get user info from database
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              role: true,
              phone: true,
              address: true,
            },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id
            token.phone = dbUser.phone
            token.address = dbUser.address
          }
        } else {
          // For credentials provider
          token.role = user.role
          token.id = user.id
          token.phone = user.phone
          token.address = user.address
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        // Add additional user data to session if available
        session.user.phone = token.phone as string || null
        session.user.address = token.address as string || null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If user is signing in/up and URL is not already auth-related
      if (url.startsWith(baseUrl)) {
        return url
      } else if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
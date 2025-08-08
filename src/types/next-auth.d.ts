import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      phone?: string | null
      address?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
    phone?: string | null
    address?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    phone?: string | null
    address?: string | null
    email?: string | null
  }
}
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  User, 
  LogOut, 
  Settings,
  FileText,
  Users,
  DollarSign,
  Briefcase
} from 'lucide-react'

export function Header() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <header className="border-b bg-white">
        <div className="flex h-16 items-center px-4">
          <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
        </div>
      </header>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return <User className="h-4 w-4" />
      case 'DOCTOR':
        return <Briefcase className="h-4 w-4" />
      case 'INSURANCE':
        return <FileText className="h-4 w-4" />
      case 'BANK':
        return <DollarSign className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return 'bg-blue-100 text-blue-800'
      case 'DOCTOR':
        return 'bg-green-100 text-green-800'
      case 'INSURANCE':
        return 'bg-purple-100 text-purple-800'
      case 'BANK':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">Insurance Claims</span>
          </Link>
        </div>

        {session?.user && (
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              {session.user.role === 'PATIENT' && (
                <Link href="/claims/new">
                  <Button variant="ghost" size="sm">
                    New Claim
                  </Button>
                </Link>
              )}
              {(session.user.role === 'INSURANCE' || session.user.role === 'BANK') && (
                <Link href="/users">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-1" />
                    Users
                  </Button>
                </Link>
              )}
            </nav>

            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-2">
              <Badge className={getRoleColor(session.user.role)}>
                {getRoleIcon(session.user.role)}
                <span className="ml-1">{session.user.role}</span>
              </Badge>
              
              <span className="text-sm font-medium">
                {session.user.name || session.user.email}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!session && (
          <div className="flex items-center space-x-2">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
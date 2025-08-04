'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PWAInstall } from '@/components/ui/pwa-install'
import { 
  Bell, 
  User, 
  LogOut, 
  FileText,
  Users,
  DollarSign,
  Briefcase,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (status === 'loading') {
    return (
      <header className="border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-200 dark:bg-slate-700 h-8 w-48 rounded"></div>
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
        return 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
      case 'DOCTOR':
        return 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200 border border-green-200 dark:border-green-800'
      case 'INSURANCE':
        return 'bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
      case 'BANK':
        return 'bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200 border border-orange-200 dark:border-orange-800'
      default:
        return 'bg-gray-50 text-gray-800 dark:bg-slate-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600'
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm">
      <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 lg:px-8 max-w-full overflow-hidden">
        {/* Logo */}
        <div className="flex items-center min-w-0 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 group">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="hidden min-[480px]:block font-bold text-sm sm:text-base lg:text-lg xl:text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
              <span className="hidden sm:inline">Insurance Claims</span>
              <span className="min-[480px]:inline sm:hidden">Claims</span>
            </span>
          </Link>
        </div>

        {session?.user && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                  Dashboard
                </Button>
              </Link>
              {session.user.role === 'PATIENT' && (
                <Link href="/claims/new">
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer">
                    New Claim
                  </Button>
                </Link>
              )}
              {(session.user.role === 'INSURANCE' || session.user.role === 'BANK') && (
                <Link href="/users">
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="hidden xl:inline">Users</span>
                  </Button>
                </Link>
              )}
            </nav>

            {/* Tablet Navigation */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 cursor-pointer">
                  <span className="text-xs">Dashboard</span>
                </Button>
              </Link>
              {session.user.role === 'PATIENT' && (
                <Link href="/claims/new">
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-colors px-2 cursor-pointer">
                    <span className="text-xs">New</span>
                  </Button>
                </Link>
              )}
              {(session.user.role === 'INSURANCE' || session.user.role === 'BANK') && (
                <Link href="/users">
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </nav>

            {/* Desktop User Actions */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
              <PWAInstall variant="button" />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              <div className="flex items-center space-x-2 xl:space-x-3">
                <Badge className={`${getRoleColor(session.user.role)} px-2 py-1 text-xs font-medium rounded-lg`}>
                  {getRoleIcon(session.user.role)}
                  <span className="ml-1 hidden xl:inline">{session.user.role}</span>
                </Badge>
                
                <div className="hidden xl:block max-w-32">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tablet User Actions */}
            <div className="hidden md:flex lg:hidden items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </Button>

              <Badge className={`${getRoleColor(session.user.role)} px-1.5 py-0.5 text-xs font-medium rounded-md`}>
                {getRoleIcon(session.user.role)}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-gray-700 dark:text-gray-300 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}

        {/* Unauthenticated State */}
        {!session && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors px-2 text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl px-2 text-xs">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {session?.user && isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg">
          <div className="px-3 py-3 space-y-2">
            {/* User Info */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Badge className={`${getRoleColor(session.user.role)} px-1.5 py-0.5 text-xs font-medium rounded-md flex-shrink-0`}>
                  {getRoleIcon(session.user.role)}
                  <span className="ml-1">{session.user.role}</span>
                </Badge>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {session.user.name || session.user.email}
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-left py-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                  <span className="text-sm">Dashboard</span>
                </Button>
              </Link>
              
              {session.user.role === 'PATIENT' && (
                <Link href="/claims/new" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-left py-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 cursor-pointer">
                    <span className="text-sm">New Claim</span>
                  </Button>
                </Link>
              )}
              
              {(session.user.role === 'INSURANCE' || session.user.role === 'BANK') && (
                <Link href="/users" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-left py-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">Users</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 py-1.5 px-2 cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span className="text-sm">Notifications</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  signOut({ callbackUrl: '/auth/signin' })
                }}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 py-1.5 px-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
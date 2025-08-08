'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProfileGuardProps {
  children: React.ReactNode
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user needs to complete profile
    // GitHub users without phone or address should complete their profile
    const user = session.user
    const needsProfileCompletion = !user.phone || !user.address

    if (needsProfileCompletion) {
      // Don't redirect if already on the complete-profile page
      const currentPath = window.location.pathname
      if (currentPath !== '/auth/complete-profile') {
        router.push('/auth/complete-profile')
      }
    } else if (window.location.pathname === '/auth/complete-profile') {
      // If profile is complete but user is still on complete-profile page, redirect to dashboard
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

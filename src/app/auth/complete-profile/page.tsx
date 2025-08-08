'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, User, Briefcase, Shield, DollarSign } from 'lucide-react'
import { UserRole } from '@/types'

const roles = [
  { value: 'PATIENT' as UserRole, label: 'Patient', icon: User, color: 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200 border-blue-200 dark:border-blue-800' },
  { value: 'DOCTOR' as UserRole, label: 'Doctor', icon: Briefcase, color: 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200 border-green-200 dark:border-green-800' },
  { value: 'INSURANCE' as UserRole, label: 'Insurance', icon: Shield, color: 'bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-200 border-purple-200 dark:border-purple-800' },
  { value: 'BANK' as UserRole, label: 'Bank', icon: DollarSign, color: 'bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200 border-orange-200 dark:border-orange-800' },
]

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    role: 'PATIENT' as UserRole,
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user already has complete profile
    if (session.user?.role && (session.user as any)?.phone && (session.user as any)?.address) {
      router.push('/dashboard')
      return
    }

    // Set current role if available
    if (session.user?.role) {
      setFormData(prev => ({ ...prev, role: session.user.role as UserRole }))
    }
  }, [session, status, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          address: formData.address,
          role: formData.role,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update the session to reflect the new user data
      await update()

      toast.success('Profile Completed!', {
        description: 'Your profile has been updated successfully. Welcome to the platform!',
        duration: 3000,
      })

      // Force a page reload to ensure session is properly updated
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch (error: any) {
      toast.error('Update Failed', {
        description: error.message || 'Failed to update profile. Please try again.',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 rounded-2xl shadow-lg">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Please provide additional information to complete your account setup
          </p>
        </div>

        {/* Profile Completion Form */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Additional Information
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Welcome {session.user?.name}! Please complete your profile to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="h-11 sm:h-12 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    className="h-11 sm:h-12 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account Type *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon
                    const isSelected = formData.role === role.value
                    
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleSelect(role.value)}
                        className={`group relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                          isSelected
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30'
                            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${
                            isSelected 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                          }`} />
                          <span className={`text-xs sm:text-sm font-medium transition-colors ${
                            isSelected 
                              ? 'text-blue-800 dark:text-blue-200' 
                              : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                          }`}>
                            {role.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full border-2 border-white dark:border-slate-800"></div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? 'Completing Profile...' : 'Complete Profile'}
                </Button>
              </div>
            </form>

            <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                <strong>Note:</strong> You can update this information later in your profile settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

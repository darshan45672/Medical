'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Authentication Failed', {
          description: 'Please check your email and password and try again.',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              // Focus back to email field
              document.getElementById('email')?.focus()
            },
          },
        })
      } else {
        toast.success('Welcome Back!', {
          description: 'You have been signed in successfully. Redirecting to dashboard...',
          duration: 3000,
        })
        await getSession()
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Connection Error', {
        description: 'Unable to connect to the server. Please check your internet connection.',
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => {
            handleSubmit(e)
          },
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 rounded-2xl shadow-lg">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Sign in to access your insurance claims portal
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Sign In
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  className="h-11 sm:h-12 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-11 sm:h-12 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Quick Access Demo Accounts
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button 
              onClick={() => {
                setEmail('patient@demo.com')
                setPassword('password123')
                toast.info('Demo credentials filled!', {
                  description: 'Patient portal credentials have been auto-filled.',
                  duration: 2000,
                })
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-3 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer text-left"
            >
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 group-hover:scale-125 transition-transform"></div>
                <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">Patient Portal</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-mono group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors">patient@demo.com</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">password123</p>
            </button>
            
            <button 
              onClick={() => {
                setEmail('doctor@demo.com')
                setPassword('password123')
                toast.info('Demo credentials filled!', {
                  description: 'Doctor portal credentials have been auto-filled.',
                  duration: 2000,
                })
              }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 p-3 sm:p-4 rounded-xl border border-green-200 dark:border-green-800/50 hover:shadow-lg hover:shadow-green-200/50 dark:hover:shadow-green-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer text-left"
            >
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 group-hover:scale-125 transition-transform"></div>
                <p className="font-semibold text-green-800 dark:text-green-200 text-sm group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors">Doctor Portal</p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 font-mono group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors">doctor@demo.com</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-mono group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">password123</p>
            </button>
            
            <button 
              onClick={() => {
                setEmail('insurance@demo.com')
                setPassword('password123')
                toast.info('Demo credentials filled!', {
                  description: 'Insurance portal credentials have been auto-filled.',
                  duration: 2000,
                })
              }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 p-3 sm:p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 hover:shadow-lg hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer text-left"
            >
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 group-hover:scale-125 transition-transform"></div>
                <p className="font-semibold text-purple-800 dark:text-purple-200 text-sm group-hover:text-purple-900 dark:group-hover:text-purple-100 transition-colors">Insurance Portal</p>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-mono group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors">insurance@demo.com</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-mono group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">password123</p>
            </button>
            
            <button 
              onClick={() => {
                setEmail('bank@demo.com')
                setPassword('password123')
                toast.info('Demo credentials filled!', {
                  description: 'Bank portal credentials have been auto-filled.',
                  duration: 2000,
                })
              }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 p-3 sm:p-4 rounded-xl border border-orange-200 dark:border-orange-800/50 hover:shadow-lg hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer text-left"
            >
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 group-hover:scale-125 transition-transform"></div>
                <p className="font-semibold text-orange-800 dark:text-orange-200 text-sm group-hover:text-orange-900 dark:group-hover:text-orange-100 transition-colors">Bank Portal</p>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 font-mono group-hover:text-orange-800 dark:group-hover:text-orange-200 transition-colors">bank@demo.com</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-mono group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">password123</p>
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click any demo account above to auto-fill credentials and test different user roles
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  FileText, 
  Shield, 
  Users, 
  Clock,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 dark:text-white bg-clip-text text-transparent">
                MedClaims Pro
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-sm sm:text-base px-3 sm:px-4 hover:bg-gray-100/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="text-sm sm:text-base px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-200 transform hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 backdrop-blur-sm">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Trusted by 10,000+ Healthcare Providers
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl dark:text-white lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-gray-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight px-4 sm:px-0">
            Insurance Claims
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            A comprehensive solution for patients, doctors, insurance companies, and banks 
            to manage insurance claims efficiently and transparently with cutting-edge technology.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-center px-4 sm:px-0">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 transition-all duration-300">
                Sign In
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 sm:mt-12 text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4 sm:px-0">
            No credit card required • 14-day free trial • Cancel anytime
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20 px-4 sm:px-0">
          <Card className="text-center group hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-blue-950/30">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Multi-Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Separate dashboards for patients, doctors, insurance agents, and bank representatives
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center group hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-green-900/20 transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-green-950/30">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Track claim status in real-time from submission to payment
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center group hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-purple-900/20 transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-950/30">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Secure & Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                HIPAA compliant with enterprise-grade security and data protection
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center group hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-orange-900/20 transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-orange-950/30">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Automated Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                Streamlined approval process with automated notifications and updates
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* User Roles Section */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-12 sm:mb-16 px-4 sm:px-0">
            <h2 className="text-3xl sm:text-4xl dark:text-white font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-4 sm:mb-6">
              Built for Every Stakeholder
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Tailored experiences for each role in the insurance ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-0">
            <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-0 hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="mb-4 sm:mb-6">
                <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold group-hover:scale-105 transition-transform duration-300">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Patient
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Patients</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-3 text-left text-sm sm:text-base">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Submit claims easily
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Upload medical documents
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Track claim status
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Receive notifications
                </li>
              </ul>
            </div>

            <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-0 hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-green-900/20 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="mb-4 sm:mb-6">
                <Badge className="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold group-hover:scale-105 transition-transform duration-300">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Doctor
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Doctors</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-3 text-left text-sm sm:text-base">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Review patient claims
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Add medical notes
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Upload supporting docs
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Approve treatments
                </li>
              </ul>
            </div>

            <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-0 hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-purple-900/20 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="mb-4 sm:mb-6">
                <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-800 dark:text-purple-200 border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold group-hover:scale-105 transition-transform duration-300">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Insurance
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Insurance</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-3 text-left text-sm sm:text-base">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Review submitted claims
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Approve/reject claims
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Set approved amounts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Manage policies
                </li>
              </ul>
            </div>

            <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-0 hover:shadow-2xl dark:hover:shadow-2xl dark:hover:shadow-orange-900/20 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="mb-4 sm:mb-6">
                <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 text-orange-800 dark:text-orange-200 border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold group-hover:scale-105 transition-transform duration-300">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Bank
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Banks</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-3 text-left text-sm sm:text-base">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Process payments
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Verify approved claims
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Track transactions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                  Generate reports
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-4 sm:mx-0 text-center bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 dark:from-slate-800 dark:via-slate-800/50 dark:to-indigo-950/50 rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 lg:p-16 border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl dark:text-white font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
              Ready to streamline your claims process?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed">
              Join thousands of healthcare providers and patients using our platform to 
              revolutionize their insurance claims experience
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 transition-all duration-300">
                  I Have an Account
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1.5 sm:mr-2" />
                Free 14-day trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1.5 sm:mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1.5 sm:mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

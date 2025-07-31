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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Insurance Claims Portal</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Streamlined Insurance Claims Processing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive solution for patients, doctors, insurance companies, and banks 
            to manage insurance claims efficiently and transparently.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Multi-Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Separate dashboards for patients, doctors, insurance agents, and bank representatives
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track claim status in real-time from submission to payment
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Secure & Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                HIPAA compliant with enterprise-grade security and data protection
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Automated Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Streamlined approval process with automated notifications and updates
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* User Roles Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Every Stakeholder</h2>
            <p className="text-lg text-gray-600">
              Tailored experiences for each role in the insurance ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Badge className="bg-blue-100 text-blue-800 mb-4">
                <Users className="h-4 w-4 mr-1" />
                Patient
              </Badge>
              <h3 className="text-lg font-semibold mb-2">Patients</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Submit claims easily</li>
                <li>• Upload medical documents</li>
                <li>• Track claim status</li>
                <li>• Receive notifications</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Badge className="bg-green-100 text-green-800 mb-4">
                <FileText className="h-4 w-4 mr-1" />
                Doctor
              </Badge>
              <h3 className="text-lg font-semibold mb-2">Doctors</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review patient claims</li>
                <li>• Add medical notes</li>
                <li>• Upload supporting docs</li>
                <li>• Approve treatments</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Badge className="bg-purple-100 text-purple-800 mb-4">
                <Shield className="h-4 w-4 mr-1" />
                Insurance
              </Badge>
              <h3 className="text-lg font-semibold mb-2">Insurance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review submitted claims</li>
                <li>• Approve/reject claims</li>
                <li>• Set approved amounts</li>
                <li>• Manage policies</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Badge className="bg-orange-100 text-orange-800 mb-4">
                <Star className="h-4 w-4 mr-1" />
                Bank
              </Badge>
              <h3 className="text-lg font-semibold mb-2">Banks</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Process payments</li>
                <li>• Verify approved claims</li>
                <li>• Track transactions</li>
                <li>• Generate reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to streamline your claims process?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of healthcare providers and patients using our platform
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8">
                I Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

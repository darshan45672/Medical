'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Banknote,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { UserRole, ClaimStatus } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface ClaimDetail {
  id: string
  claimNumber: string
  diagnosis: string
  description?: string
  treatmentDate: string
  claimAmount: string
  approvedAmount?: string
  status: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  paidAt?: string
  rejectionReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
  doctor?: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
    specialization?: string
  }
  documents: Array<{
    id: string
    type: string
    filename: string
    originalName: string
    url: string
    size: number
    uploadedAt: string
  }>
  claimReports: Array<{
    id: string
    attachedAt: string
    report: {
      id: string
      reportType: string
      title: string
      description: string
      diagnosis?: string
      treatment?: string
      medications?: string
      recommendations?: string
      documentUrl?: string
      createdAt: string
    }
  }>
  payments: Array<{
    id: string
    amount: string
    paymentDate: string
    paymentMethod?: string
    transactionId?: string
    notes?: string
  }>
}

interface ClaimPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClaimDetailPage({ params }: ClaimPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'reports' | 'payments'>('overview')
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null)
  const [claimId, setClaimId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setClaimId(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchClaimDetails = useCallback(async () => {
    if (!claimId) return

    try {
      setLoading(true)
      setError(null)
      console.log('Fetching claim details for ID:', claimId)
      const response = await fetch(`/api/claims/${claimId}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received claim data:', data)
        setClaim(data) // API returns claim directly, not wrapped in data.claim
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        
        if (response.status === 404) {
          setError('Claim not found')
          toast.error('Claim not found')
        } else if (response.status === 403) {
          setError('You do not have permission to view this claim')
          toast.error('You do not have permission to view this claim')
        } else {
          setError('Failed to fetch claim details')
          toast.error('Failed to fetch claim details')
        }
        console.error('Failed to fetch claim details, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching claim details:', error)
      setError('Error fetching claim details')
      toast.error('Error fetching claim details')
    } finally {
      setLoading(false)
    }
  }, [claimId])

  useEffect(() => {
    if (claimId && session?.user && (session.user.role === UserRole.PATIENT || session.user.role === UserRole.INSURANCE || session.user.role === UserRole.BANK)) {
      fetchClaimDetails()
    }
  }, [claimId, session, fetchClaimDetails])

  const handleViewDocument = async (document: any) => {
    try {
      // If the document has a URL (S3 URL), open it directly
      if (document.url) {
        window.open(document.url, '_blank')
        return
      }
      
      // Fallback to API endpoint if no S3 URL is available
      const response = await fetch(`/api/documents/${document.id}/view`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        window.URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to view document')
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      toast.error('Error viewing document')
    }
  }

  const handleDownloadDocument = async (document: any, filename: string) => {
    try {
      setDownloadingItem(document.id)
      
      // If the document has a URL (S3 URL), download it directly
      if (document.url) {
        const downloadLink = document.createElement('a')
        downloadLink.href = document.url
        downloadLink.download = filename
        downloadLink.target = '_blank'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        toast.success('Document downloaded successfully')
        return
      }
      
      // Fallback to API endpoint if no S3 URL is available
      const response = await fetch(`/api/documents/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Document downloaded successfully')
      } else {
        toast.error('Failed to download document')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Error downloading document')
    } finally {
      setDownloadingItem(null)
    }
  }

  const handleViewReport = async (report: any) => {
    try {
      // If the report has a documentUrl (S3 URL), open it directly
      if (report.documentUrl) {
        window.open(report.documentUrl, '_blank')
        return
      }
      
      // Fallback to API endpoint if no S3 URL is available
      const response = await fetch(`/api/reports/${report.id}/view`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        window.URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to view report')
      }
    } catch (error) {
      console.error('Error viewing report:', error)
      toast.error('Error viewing report')
    }
  }

  const handleDownloadReport = async (report: any, title: string) => {
    try {
      setDownloadingItem(report.id)
      
      // If the report has a documentUrl (S3 URL), download it directly
      if (report.documentUrl) {
        const link = document.createElement('a')
        link.href = report.documentUrl
        link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Report downloaded successfully')
        return
      }
      
      // Fallback to API endpoint if no S3 URL is available
      const response = await fetch(`/api/reports/${report.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded successfully')
      } else {
        toast.error('Failed to download report')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Error downloading report')
    } finally {
      setDownloadingItem(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ClaimStatus.DRAFT:
        return <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-950/30">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      case ClaimStatus.SUBMITTED:
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:bg-blue-950/30">
          <Clock className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      case ClaimStatus.UNDER_REVIEW:
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:bg-yellow-950/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      case ClaimStatus.APPROVED:
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      case ClaimStatus.REJECTED:
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-red-950/30">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      case ClaimStatus.PAID:
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30">
          <Banknote className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!session || (session.user.role !== UserRole.PATIENT && session.user.role !== UserRole.INSURANCE && session.user.role !== UserRole.BANK)) {
    router.push('/dashboard')
    return null
  }

  if (!claim || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {error || 'Claim not found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {error 
                  ? 'Please check the URL and try again, or go back to your claims list.'
                  : "The claim you're looking for doesn't exist or you don't have permission to view it."
                }
              </p>
              {claimId && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono">
                  Claim ID: {claimId}
                </p>
              )}
              <Link href={session?.user?.role === UserRole.INSURANCE || session?.user?.role === UserRole.BANK ? "/insurance/claims" : "/claims"}>
                <Button variant="outline" className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {session?.user?.role === UserRole.INSURANCE || session?.user?.role === UserRole.BANK ? "Back to All Claims" : "Back to My Claims"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={session?.user?.role === UserRole.INSURANCE || session?.user?.role === UserRole.BANK ? "/insurance/claims" : "/claims"}>
            <Button variant="ghost" className="mb-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">{session?.user?.role === UserRole.INSURANCE || session?.user?.role === UserRole.BANK ? "Back to All Claims" : "Back to My Claims"}</span>
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Claim Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {session?.user?.role === UserRole.INSURANCE || session?.user?.role === UserRole.BANK 
                  ? "Review claim information, documents, and reports for processing"
                  : "View your claim information, documents, and reports"
                }
              </p>
            </div>
            {getStatusBadge(claim.status)}
          </div>
        </div>

        {/* Quick Info Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 backdrop-blur-xl mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Claim Number</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100 font-mono">{claim.claimNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Claim Amount</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(parseFloat(claim.claimAmount))}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Treatment Date</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatDate(claim.treatmentDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {claim.documents?.length || 0} Files
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('overview')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'overview' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'documents' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('documents')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'documents' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Documents ({claim.documents?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'reports' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('reports')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'reports' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Reports ({claim.claimReports?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'payments' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('payments')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'payments' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <Banknote className="h-4 w-4 mr-2" />
                Payments ({claim.payments?.length || 0})
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Claim Information */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Claim Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(claim.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Claim ID</label>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-slate-700 p-2 rounded mt-1">
                      {claim.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Diagnosis</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-medium">
                    {claim.diagnosis}
                  </p>
                </div>

                {claim.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{claim.description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Treatment Date</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {formatDate(claim.treatmentDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {formatDate(claim.createdAt)}
                    </p>
                  </div>
                </div>

                {claim.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason</label>
                    <div className="mt-1 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200">{claim.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {claim.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{claim.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Claim Amount</span>
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(parseFloat(claim.claimAmount))}
                      </span>
                    </div>
                  </div>
                  
                  {claim.approvedAmount && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">Approved Amount</span>
                        <span className="text-lg font-bold text-green-900 dark:text-green-100">
                          {formatCurrency(parseFloat(claim.approvedAmount))}
                        </span>
                      </div>
                    </div>
                  )}

                  {claim.payments && claim.payments.length > 0 && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Total Paid</span>
                        <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                          {formatCurrency(
                            claim.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Important Dates */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Important Dates</h4>
                  {claim.submittedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Submitted</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(claim.submittedAt)}</span>
                    </div>
                  )}
                  {claim.approvedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(claim.approvedAt)}</span>
                    </div>
                  )}
                  {claim.rejectedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(claim.rejectedAt)}</span>
                    </div>
                  )}
                  {claim.paidAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(claim.paidAt)}</span>
                    </div>
                  )}
                </div>

                {/* Doctor Information */}
                {claim.doctor && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Doctor Information</h4>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {claim.doctor.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          Dr. {claim.doctor.name}
                        </h3>
                        {claim.doctor.specialization && (
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {claim.doctor.specialization}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {claim.doctor.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                Documents ({claim.documents?.length || 0})
              </CardTitle>
              <CardDescription>
                View and download claim-related documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!claim.documents || claim.documents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No documents available</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    No documents have been uploaded for this claim yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {claim.documents.map((document) => (
                    <Card key={document.id} className="border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {document.type}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {document.originalName}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Uploaded:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatDate(document.uploadedAt)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Size:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatFileSize(document.size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDocument(document)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadDocument(document, document.originalName)}
                            disabled={downloadingItem === document.id}
                            className="flex-1"
                          >
                            {downloadingItem === document.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Medical Reports ({claim.claimReports?.length || 0})
              </CardTitle>
              <CardDescription>
                View and download medical reports attached to this claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!claim.claimReports || claim.claimReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reports available</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    No medical reports have been attached to this claim yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {claim.claimReports.map((claimReport) => (
                    <Card key={claimReport.id} className="border border-gray-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {claimReport.report.title}
                              </h4>
                              <Badge variant="outline" className="mt-1">
                                {claimReport.report.reportType}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {claimReport.report.documentUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewReport(claimReport.report)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownloadReport(claimReport.report, claimReport.report.title)}
                              disabled={downloadingItem === claimReport.report.id}
                            >
                              {downloadingItem === claimReport.report.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
                              Download
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {claimReport.report.description}
                            </p>
                          </div>
                          {claimReport.report.diagnosis && (
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Diagnosis</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {claimReport.report.diagnosis}
                              </p>
                            </div>
                          )}
                        </div>

                        {claimReport.report.treatment && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Treatment</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {claimReport.report.treatment}
                            </p>
                          </div>
                        )}

                        {claimReport.report.medications && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Medications</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {claimReport.report.medications}
                            </p>
                          </div>
                        )}

                        {claimReport.report.recommendations && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Recommendations</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {claimReport.report.recommendations}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Report created: {formatDate(claimReport.report.createdAt)}</span>
                            <span>Attached: {formatDate(claimReport.attachedAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Payment History ({claim.payments?.length || 0})
              </CardTitle>
              <CardDescription>
                Track payments made for this claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!claim.payments || claim.payments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Banknote className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No payments yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    No payments have been made for this claim yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claim.payments.map((payment) => (
                    <Card key={payment.id} className="border border-gray-200 dark:border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                              <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                Payment #{payment.id.slice(0, 8)}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(payment.paymentDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(parseFloat(payment.amount))}
                            </p>
                            {payment.paymentMethod && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                via {payment.paymentMethod}
                              </p>
                            )}
                          </div>
                        </div>

                        {payment.transactionId && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Transaction ID: 
                              <span className="font-mono ml-1">{payment.transactionId}</span>
                            </p>
                          </div>
                        )}

                        {payment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-gray-100">{payment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

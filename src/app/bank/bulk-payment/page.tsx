'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading-spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { useClaims } from '@/hooks/use-claims'
import { usePayments } from '@/hooks/use-payments'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  CreditCard,
  AlertCircle,
  DollarSign,
  Users,
  Clock,
  PlayCircle,
  StopCircle,
  FileText,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkProcessingFilters {
  search: string
  minAmount: string
  maxAmount: string
  claimStatus: string
  sortBy: 'amount' | 'createdAt' | 'patient'
  sortOrder: 'asc' | 'desc'
}

export default function BulkPaymentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: claimsData, isLoading: isLoadingClaims, error: claimsError, refetch: refetchClaims } = useClaims()
  const { refetch: refetchPayments } = usePayments()
  
  const [filters, setFilters] = useState<BulkProcessingFilters>({
    search: '',
    minAmount: '',
    maxAmount: '',
    claimStatus: 'APPROVED',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  // Redirect if not bank user
  useEffect(() => {
    if (session && session.user.role !== 'BANK') {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchClaims()
      toast.success('Claims data refreshed')
    } catch {
      toast.error('Failed to refresh claims data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Filter and sort approved claims
  const filteredClaims = (Array.isArray(claimsData) ? claimsData : [])
    .filter((claim: any) => {
      // Only show approved claims that haven't been paid yet
      if (claim.status !== 'APPROVED') {
        return false
      }

      // Check if there's already a payment for this claim
      // This would need to be enhanced with actual payment checking logic
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const patientName = claim.patient?.name?.toLowerCase() || claim.patientName?.toLowerCase() || ''
        const claimNumber = claim.claimNumber?.toLowerCase() || ''
        const diagnosis = claim.diagnosis?.toLowerCase() || ''
        
        if (!patientName.includes(searchLower) && 
            !claimNumber.includes(searchLower) && 
            !diagnosis.includes(searchLower)) {
          return false
        }
      }

      // Amount filters
      const claimAmount = parseFloat(claim.approvedAmount || claim.claimAmount)
      if (filters.minAmount && claimAmount < parseFloat(filters.minAmount)) {
        return false
      }
      if (filters.maxAmount && claimAmount > parseFloat(filters.maxAmount)) {
        return false
      }

      return true
    })
    .sort((a: any, b: any) => {
      const modifier = filters.sortOrder === 'asc' ? 1 : -1
      
      switch (filters.sortBy) {
        case 'amount':
          const amountA = parseFloat(a.approvedAmount || a.claimAmount)
          const amountB = parseFloat(b.approvedAmount || b.claimAmount)
          return (amountA - amountB) * modifier
        case 'patient':
          const nameA = a.patient?.name || a.patientName || ''
          const nameB = b.patient?.name || b.patientName || ''
          return nameA.localeCompare(nameB) * modifier
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier
      }
    }) || []

  const selectedClaims = filteredClaims.filter((claim: any) => selectedClaimIds.has(claim.id))
  const totalSelectedAmount = selectedClaims.reduce((sum: number, claim: any) => 
    sum + parseFloat(claim.approvedAmount || claim.claimAmount), 0
  )

  const handleSelectAll = () => {
    if (selectedClaimIds.size === filteredClaims.length) {
      setSelectedClaimIds(new Set())
    } else {
      setSelectedClaimIds(new Set(filteredClaims.map((claim: any) => claim.id)))
    }
  }

  const handleSelectClaim = (claimId: string) => {
    const newSelected = new Set(selectedClaimIds)
    if (newSelected.has(claimId)) {
      newSelected.delete(claimId)
    } else {
      newSelected.add(claimId)
    }
    setSelectedClaimIds(newSelected)
  }

  const handleBulkProcess = async () => {
    if (selectedClaimIds.size === 0) {
      toast.error('Please select at least one claim to process')
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    
    try {
      const totalClaims = selectedClaimIds.size
      let processed = 0
      
      for (const claimId of selectedClaimIds) {
        const claim = selectedClaims.find((c: any) => c.id === claimId)
        if (!claim) continue

        try {
          // Create payment record
          const paymentResponse = await fetch('/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              claimId: claim.id,
              amount: parseFloat(claim.approvedAmount || claim.claimAmount),
              paymentMethod: 'BANK_TRANSFER',
              notes: `Bulk payment processed for claim ${claim.claimNumber || claim.id}`
            }),
          })

          if (!paymentResponse.ok) {
            throw new Error('Failed to create payment record')
          }

          // Update claim status to PAID
          const statusResponse = await fetch(`/api/claims/${claim.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'PAID' }),
          })

          if (!statusResponse.ok) {
            throw new Error('Failed to update claim status')
          }

          processed++
          setProcessingProgress((processed / totalClaims) * 100)
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Error processing claim ${claimId}:`, error)
          toast.error(`Failed to process claim ${claim.claimNumber || claimId}`)
        }
      }

      toast.success(`Successfully processed ${processed} out of ${totalClaims} claims`)
      setSelectedClaimIds(new Set())
      await Promise.all([refetchClaims(), refetchPayments()])
      
    } catch (error) {
      console.error('Bulk processing error:', error)
      toast.error('Bulk processing failed')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const handleViewClaimDetails = (claimId: string) => {
    // Implementation for viewing claim details
    console.log('Viewing claim details for:', claimId)
    toast.info('Claim details view coming soon')
  }

  if (!session || session.user.role !== 'BANK') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 border-gray-300 dark:border-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Bulk Payment Processing
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Process multiple approved claims in batch
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-300 dark:border-slate-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Selection Summary */}
        {selectedClaimIds.size > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      {selectedClaimIds.size} Claims Selected
                    </h3>
                    <p className="text-green-600 dark:text-green-300">
                      Total Amount: {formatCurrency(totalSelectedAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedClaimIds(new Set())}
                    variant="outline"
                    className="border-green-300 dark:border-green-600"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleBulkProcess}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Process Selected'}
                  </Button>
                </div>
              </div>
              {isProcessing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-700 dark:text-green-300">Processing payments...</span>
                    <span className="text-sm text-green-700 dark:text-green-300">{Math.round(processingProgress)}%</span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Available Claims</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {filteredClaims.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Value</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(
                      filteredClaims.reduce((sum: number, claim: any) => 
                        sum + parseFloat(claim.approvedAmount || claim.claimAmount), 0
                      )
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Selected</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {selectedClaimIds.size}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Avg Amount</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {formatCurrency(
                      filteredClaims.length > 0 
                        ? filteredClaims.reduce((sum: number, claim: any) => 
                            sum + parseFloat(claim.approvedAmount || claim.claimAmount), 0
                          ) / filteredClaims.length
                        : 0
                    )}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter approved claims for bulk processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search claims..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              {/* Min Amount */}
              <Input
                type="number"
                placeholder="Min amount"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              />

              {/* Max Amount */}
              <Input
                type="number"
                placeholder="Max amount"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              />

              {/* Sort */}
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="patient">Patient Name</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={filters.sortOrder} onValueChange={(value) => setFilters({ ...filters, sortOrder: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Approved Claims ({filteredClaims.length})
              </div>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-slate-600"
              >
                {selectedClaimIds.size === filteredClaims.length ? 'Deselect All' : 'Select All'}
              </Button>
            </CardTitle>
            <CardDescription>
              Select claims for bulk payment processing
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingClaims ? (
              <div className="flex justify-center py-12">
                <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading approved claims..." />
              </div>
            ) : claimsError ? (
              <div className="text-center py-12 px-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Claims</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{claimsError?.message || 'Unknown error occurred'}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="relative mx-auto w-32 h-32 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 rounded-full shadow-lg"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-gray-200 to-slate-200 dark:from-gray-800/50 dark:to-slate-800/50 rounded-full flex items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Approved Claims</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  No approved claims are available for processing. Claims will appear here once they are approved by insurance.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                    <TableRow className="border-gray-200 dark:border-slate-600">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedClaimIds.size === filteredClaims.length && filteredClaims.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Claim #</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Patient</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Diagnosis</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Amount</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Approved</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Status</TableHead>
                      <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim: any, index: number) => (
                      <TableRow 
                        key={claim.id} 
                        className={`border-gray-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 transition-all duration-200 ${
                          selectedClaimIds.has(claim.id) 
                            ? 'bg-blue-50 dark:bg-blue-950/20' 
                            : index % 2 === 0 
                              ? 'bg-white dark:bg-slate-800' 
                              : 'bg-gray-50/50 dark:bg-slate-800/50'
                        }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedClaimIds.has(claim.id)}
                            onCheckedChange={() => handleSelectClaim(claim.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                          {claim.claimNumber}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 font-medium">
                          {claim.patient?.name || claim.patientName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          <span className="line-clamp-2">{claim.diagnosis}</span>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 font-semibold">
                          {formatCurrency(parseFloat(claim.claimAmount))}
                        </TableCell>
                        <TableCell className="text-green-600 dark:text-green-400 font-semibold">
                          {formatCurrency(parseFloat(claim.approvedAmount || claim.claimAmount))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={claim.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClaimDetails(claim.id)}
                            className="border-gray-300 dark:border-slate-600"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

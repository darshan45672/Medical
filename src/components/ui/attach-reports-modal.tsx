'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { usePatientReports, useAttachReportToClaim } from '@/hooks/use-patient-reports'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { FileText, Calendar, User, AlertCircle } from 'lucide-react'

interface AttachReportsToClaimModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  claimNumber: string
  existingReportIds?: string[]
}

const reportTypeLabels = {
  DIAGNOSIS_REPORT: 'Diagnosis Report',
  TREATMENT_SUMMARY: 'Treatment Summary',
  PRESCRIPTION_REPORT: 'Prescription Report',
  LAB_REPORT: 'Lab Report',
  SCAN_REPORT: 'Scan Report',
  FOLLOW_UP_REPORT: 'Follow-up Report',
  DISCHARGE_SUMMARY: 'Discharge Summary',
}

export function AttachReportsToClaimModal({
  isOpen,
  onClose,
  claimId,
  claimNumber,
  existingReportIds = []
}: AttachReportsToClaimModalProps) {
  const { data: session } = useSession()
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([])
  const attachReport = useAttachReportToClaim()
  
  const { data: reportsData, isLoading } = usePatientReports({
    patientId: session?.user?.id,
    isActive: true,
    limit: 50 // Show more reports for selection
  })

  const availableReports = reportsData?.reports?.filter(
    report => !existingReportIds.includes(report.id)
  ) || []

  const handleReportToggle = (reportId: string) => {
    setSelectedReportIds(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  const handleAttachReports = async () => {
    if (selectedReportIds.length === 0) {
      toast.error('Please select at least one report to attach')
      return
    }

    try {
      // Attach reports one by one
      for (const reportId of selectedReportIds) {
        await attachReport.mutateAsync({ claimId, reportId })
      }
      
      toast.success(`${selectedReportIds.length} report(s) attached to claim ${claimNumber}`)
      setSelectedReportIds([])
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to attach reports')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attach Reports to Claim
          </DialogTitle>
          <DialogDescription>
            Select patient reports to attach to claim {claimNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : availableReports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
                <p className="text-gray-500">
                  You don&apos;t have any medical reports that can be attached to this claim.
                  Medical reports are created by your doctors during appointments.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableReports.map((report) => (
                <Card key={report.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`report-${report.id}`}
                        checked={selectedReportIds.includes(report.id)}
                        onCheckedChange={() => handleReportToggle(report.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{report.title}</h4>
                            <Badge variant="secondary" className="mt-1">
                              {reportTypeLabels[report.reportType]}
                            </Badge>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {report.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Dr. {report.doctor.name || report.doctor.email}
                          </div>
                          {report.appointment && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Appointment: {new Date(report.appointment.scheduledAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {report.diagnosis && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <strong>Diagnosis:</strong> {report.diagnosis}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                {selectedReportIds.length} of {availableReports.length} reports selected
              </div>
              
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAttachReports}
                  disabled={selectedReportIds.length === 0 || attachReport.isPending}
                >
                  {attachReport.isPending ? 'Attaching...' : `Attach ${selectedReportIds.length} Report(s)`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

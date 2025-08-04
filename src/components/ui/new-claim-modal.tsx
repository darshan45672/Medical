import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCreateClaim } from '@/hooks/use-claims'
import { useAppointments } from '@/hooks/use-appointments'
import { usePatientReports, useAttachReportToClaim } from '@/hooks/use-patient-reports'
import { useSession } from 'next-auth/react'
import { formatDate } from '@/lib/utils'
import { 
  FileText, 
  User, 
  Calendar,
  DollarSign,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  FileCheck
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface Appointment {
  id: string
  doctorId: string
  status: string
  scheduledAt: string
  notes?: string
  doctor: {
    id: string
    name: string
  }
}

interface NewClaimModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewClaimModal({ open, onOpenChange }: NewClaimModalProps) {
  const { data: session } = useSession()
  const createClaimMutation = useCreateClaim()
  const attachReportMutation = useAttachReportToClaim()
  const { data: appointmentsData } = useAppointments()
  
  // Fetch patient reports for the current user
  const { data: reportsData, isLoading: reportsLoading } = usePatientReports({
    patientId: session?.user?.id,
    isActive: true
  })
  
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentId: '',
    diagnosis: '',
    treatmentDate: '',
    claimAmount: '',
    description: ''
  })

  const [selectedReport, setSelectedReport] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAutoSelected, setHasAutoSelected] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        doctorId: '',
        appointmentId: '',
        diagnosis: '',
        treatmentDate: '',
        claimAmount: '',
        description: ''
      })
      setSelectedReport('')
      setIsSubmitting(false)
      setHasAutoSelected(false) // Reset auto-selection flag
    }
  }, [open])

  // Get completed appointments for claim creation
  const completedAppointments = useMemo(() => {
    const appointments = appointmentsData?.appointments || []
    return appointments.filter((appointment: Appointment) => appointment.status === 'COMPLETED')
  }, [appointmentsData])

  // Get unique doctors from completed appointments
  const availableDoctors = useMemo(() => {
    const doctorsMap = new Map()
    completedAppointments.forEach((appointment: Appointment) => {
      if (appointment.doctor && !doctorsMap.has(appointment.doctorId)) {
        doctorsMap.set(appointment.doctorId, {
          id: appointment.doctorId,
          name: appointment.doctor.name,
          appointments: completedAppointments.filter((apt: Appointment) => apt.doctorId === appointment.doctorId)
        })
      }
    })
    return Array.from(doctorsMap.values())
  }, [completedAppointments])

  // Get appointments for selected doctor
  const doctorAppointments = useMemo(() => {
    if (!formData.doctorId) return []
    return completedAppointments.filter((apt: Appointment) => apt.doctorId === formData.doctorId)
  }, [formData.doctorId, completedAppointments])

  // Auto-select report if there's only one available
  useEffect(() => {
    // Only proceed if modal is open, user is defined, reports are loaded, and we haven't auto-selected yet
    if (!open || !session?.user?.id || reportsLoading || hasAutoSelected) return
    
    const reports = reportsData?.reports || []
    
    // Auto-select if exactly one report exists and no report is currently selected
    if (reports.length === 1 && !selectedReport) {
      setSelectedReport(reports[0].id)
      setHasAutoSelected(true)
    }
  }, [open, session?.user?.id, reportsLoading, reportsData?.reports, hasAutoSelected, selectedReport])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.doctorId || !formData.appointmentId || !formData.diagnosis || !formData.treatmentDate || !formData.claimAmount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Determine if all details are complete
      const hasAllRequiredDetails = formData.doctorId && formData.diagnosis && formData.treatmentDate && formData.claimAmount
      const hasReport = !!selectedReport
      
      const claimData = {
        doctorId: formData.doctorId,
        diagnosis: formData.diagnosis,
        treatmentDate: formData.treatmentDate,
        claimAmount: parseFloat(formData.claimAmount),
        description: formData.description,
        hasReport: hasReport
      }

      // Create the claim first
      const createdClaim = await createClaimMutation.mutateAsync(claimData)
      
      // Attach selected report to the claim if provided
      if (selectedReport) {
        await attachReportMutation.mutateAsync({
          claimId: createdClaim.id,
          reportId: selectedReport
        })
      }
      
      // Show appropriate success message based on status
      if (hasAllRequiredDetails && hasReport) {
        toast.success('Claim submitted successfully! Your claim has been sent for review.')
      } else if (!hasReport) {
        toast.success('Claim saved as draft. Please attach a medical report to submit for review.')
      } else {
        toast.success('Claim saved as draft. Please complete all required details.')
      }
      
      onOpenChange(false)
      
      // Reset form
      setFormData({
        doctorId: '',
        appointmentId: '',
        diagnosis: '',
        treatmentDate: '',
        claimAmount: '',
        description: ''
      })
      setSelectedReport('')
    } catch (error) {
      console.error('Error creating claim:', error)
      toast.error('Failed to create claim')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDoctorChange = useCallback((doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      doctorId,
      appointmentId: '', // Reset appointment selection
      treatmentDate: '' // Reset treatment date
    }))
  }, [])

  const handleReportSelect = useCallback((reportId: string) => {
    setSelectedReport(prev => prev === reportId ? '' : reportId)
  }, [])

  const handleAppointmentChange = useCallback((appointmentId: string) => {
    const selectedAppointment = doctorAppointments.find((apt: Appointment) => apt.id === appointmentId)
    if (selectedAppointment) {
      setFormData(prev => ({
        ...prev,
        appointmentId,
        treatmentDate: new Date(selectedAppointment.scheduledAt).toISOString().split('T')[0]
      }))
    }
  }, [doctorAppointments])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Create New Claim
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Submit a new insurance claim for your completed appointment
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Information Notice */}
          <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Claim Status Information
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    You can only create claims for appointments that have been completed. 
                    Select the doctor who diagnosed you and the specific appointment for which you want to claim.
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-blue-600 dark:text-blue-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      <span><strong>SUBMITTED:</strong> Claims with all details and medical report attached</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span><strong>DRAFT:</strong> Claims without medical report (can be completed later)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {completedAppointments.length === 0 ? (
            <Card className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-4 text-center">
                <Calendar className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  No Completed Appointments
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You need to have completed appointments with doctors before you can create claims.
                  Please book and complete an appointment first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Doctor Selection */}
              <Card className="border border-gray-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Select Doctor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="doctor" className="text-sm font-medium">
                      Doctor who diagnosed you *
                    </Label>
                    <Select value={formData.doctorId} onValueChange={handleDoctorChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a doctor from your completed appointments" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDoctors.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.name} ({doctor.appointments.length} completed appointment{doctor.appointments.length !== 1 ? 's' : ''})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.doctorId && (
                    <div>
                      <Label htmlFor="appointment" className="text-sm font-medium">
                        Select Appointment *
                      </Label>
                      <Select value={formData.appointmentId} onValueChange={handleAppointmentChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select the appointment for this claim" />
                        </SelectTrigger>
                        <SelectContent>
                        {doctorAppointments.map((appointment: Appointment) => (
                            <SelectItem key={appointment.id} value={appointment.id}>
                              {formatDate(appointment.scheduledAt)} at {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {appointment.notes && ` - ${appointment.notes.substring(0, 50)}${appointment.notes.length > 50 ? '...' : ''}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Claim Details */}
              <Card className="border border-gray-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Claim Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="diagnosis" className="text-sm font-medium">
                      Diagnosis *
                    </Label>
                    <Input
                      id="diagnosis"
                      type="text"
                      placeholder="Enter the diagnosis provided by your doctor"
                      value={formData.diagnosis}
                      onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="treatmentDate" className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Treatment Date *
                    </Label>
                    <div className="relative">
                      <Input
                        id="treatmentDate"
                        type="date"
                        value={formData.treatmentDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, treatmentDate: e.target.value }))}
                        max={new Date().toISOString().split('T')[0]} // Can't be in the future
                        className="h-12 pl-4 pr-4 border-2 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 rounded-lg shadow-sm font-medium"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Select the date when you received treatment
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="claimAmount" className="text-sm font-medium">
                      Claim Amount *
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="claimAmount"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={formData.claimAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, claimAmount: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Reports Selection Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                        <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Select Medical Report (Optional)
                    </Label>
                    
                    {reportsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading your reports...</span>
                      </div>
                    ) : (
                      <>
                        {reportsData?.reports && reportsData.reports.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {reportsData.reports.length === 1 
                                ? 'Your report has been automatically selected. Claims with reports will be submitted for review.'
                                : selectedReport
                                  ? 'Report selected - your claim will be submitted for review.'
                                  : 'Select a report to submit your claim for review, or save without a report as draft.'
                              }
                            </p>
                            
                            <div className="grid gap-3 max-h-48 overflow-y-auto">
                              {reportsData.reports.map((report: any) => (
                                <div
                                  key={report.id}
                                  className={`relative flex items-start space-x-3 p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                    selectedReport === report.id
                                      ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                                      : 'border-gray-300 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-slate-800'
                                  }`}
                                  onClick={() => handleReportSelect(report.id)}
                                >
                                  <input
                                    type="radio"
                                    name="selectedReport"
                                    checked={selectedReport === report.id}
                                    onChange={() => {}}
                                    className="mt-0.5"
                                  />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {report.title}
                                      </h4>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {report.reportType}
                                      </Badge>
                                    </div>
                                    
                                    {report.diagnosis && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        Diagnosis: {report.diagnosis}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Dr. {report.doctor.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    
                                    {report.description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {report.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {selectedReport === report.id && (
                                    <div className="absolute top-2 right-2">
                                      <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {selectedReport && (
                              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-300">
                                  Report selected - claim will be submitted for review
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">No Medical Reports Available</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                              You can create a claim without a medical report, but it will be saved as a draft. 
                              To submit your claim for review, you&apos;ll need to add a medical report later.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Claims without reports are saved as drafts</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Additional Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide any additional details about the treatment or claim..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Form Actions */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex justify-between">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </Button>
            
            {completedAppointments.length > 0 && (
              <div className="flex gap-3">
                {/* Save as Draft Button - always available when appointments exist */}
                <Button
                  type="submit"
                  variant="outline"
                  className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={isSubmitting || createClaimMutation.isPending}
                >
                  {isSubmitting || createClaimMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {selectedReport ? 'Submit Claim' : 'Save as Draft'}
                    </>
                  )}
                </Button>
                
                {/* Info text about status */}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  {selectedReport ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Will be submitted for review</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span>Will be saved as draft without report</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {completedAppointments.length === 0 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Cannot create claim without completed appointments
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateClaim } from '@/hooks/use-claims'
import { useAppointments } from '@/hooks/use-appointments'
import { formatDate } from '@/lib/utils'
import { 
  FileText, 
  User, 
  Calendar,
  DollarSign,
  Stethoscope,
  AlertTriangle
} from 'lucide-react'
import { useState, useMemo } from 'react'
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
  const createClaimMutation = useCreateClaim()
  const { data: appointmentsData } = useAppointments()
  
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentId: '',
    diagnosis: '',
    treatmentDate: '',
    claimAmount: '',
    description: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.doctorId || !formData.appointmentId || !formData.diagnosis || !formData.treatmentDate || !formData.claimAmount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const claimData = {
        doctorId: formData.doctorId,
        diagnosis: formData.diagnosis,
        treatmentDate: formData.treatmentDate,
        claimAmount: parseFloat(formData.claimAmount),
        description: formData.description
      }

      await createClaimMutation.mutateAsync(claimData)
      toast.success('Claim created successfully')
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
    } catch (error) {
      toast.error('Failed to create claim')
    }
  }

  const handleDoctorChange = (doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      doctorId,
      appointmentId: '', // Reset appointment selection
      treatmentDate: '' // Reset treatment date
    }))
  }

  const handleAppointmentChange = (appointmentId: string) => {
    const selectedAppointment = doctorAppointments.find((apt: Appointment) => apt.id === appointmentId)
    if (selectedAppointment) {
      setFormData(prev => ({
        ...prev,
        appointmentId,
        treatmentDate: new Date(selectedAppointment.scheduledAt).toISOString().split('T')[0]
      }))
    }
  }

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
                    Important Information
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You can only create claims for appointments that have been completed. 
                    Select the doctor who diagnosed you and the specific appointment for which you want to claim.
                  </p>
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

                  <div>
                    <Label htmlFor="treatmentDate" className="text-sm font-medium">
                      Treatment Date *
                    </Label>
                    <Input
                      id="treatmentDate"
                      type="date"
                      value={formData.treatmentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, treatmentDate: e.target.value }))}
                      className="mt-1"
                      required
                    />
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
              className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            
            {completedAppointments.length > 0 && (
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                disabled={createClaimMutation.isPending}
              >
                {createClaimMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Claim
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

  'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { Calendar, Clock, User } from 'lucide-react'
import { useCreateAppointment } from '@/hooks/use-appointments'
import { useUsers } from '@/hooks/use-users'
import { UserRole } from '@/types'

interface BookAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AppointmentFormData {
  doctorId: string
  scheduledDate: string
  scheduledTime: string
  notes: string
}

export function BookAppointmentModal({ open, onOpenChange }: BookAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createAppointment = useCreateAppointment()
  const { data: doctorsResponse, isLoading: doctorsLoading, error: doctorsError } = useUsers({ role: UserRole.DOCTOR })
  
  // Extract doctors array from response
  const doctorsData = doctorsResponse?.users || []
  
  // Debug logging
  console.log('Doctors response:', doctorsResponse)
  console.log('Doctors data:', doctorsData)
  console.log('Is array:', Array.isArray(doctorsData))
  console.log('Doctors error:', doctorsError)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AppointmentFormData>({
    defaultValues: {
      doctorId: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: ''
    }
  })

  const selectedDoctorId = watch('doctorId')

  const onSubmit = async (data: AppointmentFormData) => {
    if (!data.doctorId) {
      toast.error('Please select a doctor')
      return
    }

    if (!data.scheduledDate || !data.scheduledTime) {
      toast.error('Please select date and time')
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}:00.000Z`).toISOString()
      
      await createAppointment.mutateAsync({
        doctorId: data.doctorId,
        scheduledAt,
        notes: data.notes || undefined
      })

      toast.success('Appointment booked successfully!')
      reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to book appointment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Book Appointment
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Schedule an appointment with one of our doctors. Please fill in all the required details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctorId" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Select Doctor *
            </Label>
            {doctorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : doctorsError ? (
              <div className="text-center py-4 text-red-600">
                <p>Error loading doctors. Please try again.</p>
              </div>
            ) : (
              <Select
                value={selectedDoctorId}
                onValueChange={(value: string) => setValue('doctorId', value)}
              >
                <SelectTrigger className="h-12 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Choose a doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctorsData && Array.isArray(doctorsData) && doctorsData.length > 0 ? (
                    doctorsData.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name || doctor.email}</span>
                          <span className="text-sm text-gray-500">{doctor.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-doctors" disabled>
                      No doctors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.doctorId && (
              <p className="text-sm text-red-600">{errors.doctorId.message}</p>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="scheduledDate" className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Appointment Date *
              </Label>
              <div className="relative">
                <Input
                  id="scheduledDate"
                  type="date"
                  min={today}
                  className={`h-12 pl-4 pr-4 border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 ${
                    errors.scheduledDate 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-800' 
                      : 'border-gray-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-200 dark:focus:ring-green-800 hover:border-green-400 dark:hover:border-green-500'
                  } focus:ring-2 rounded-lg shadow-sm font-medium`}
                  {...register('scheduledDate', { 
                    required: 'Please select an appointment date',
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (selectedDate < today) {
                        return 'Please select a future date';
                      }
                      return true;
                    }
                  })}
                />
              </div>
              {errors.scheduledDate && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                  <span className="text-red-500">⚠</span>
                  {errors.scheduledDate.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select your preferred appointment date
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="scheduledTime" className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                Appointment Time *
              </Label>
              <div className="relative">
                <Input
                  id="scheduledTime"
                  type="time"
                  className={`h-12 pl-4 pr-4 border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 ${
                    errors.scheduledTime 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-800' 
                      : 'border-gray-300 dark:border-slate-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-orange-200 dark:focus:ring-orange-800 hover:border-orange-400 dark:hover:border-orange-500'
                  } focus:ring-2 rounded-lg shadow-sm font-medium`}
                  {...register('scheduledTime', { 
                    required: 'Please select an appointment time'
                  })}
                />
              </div>
              {errors.scheduledTime && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                  <span className="text-red-500">⚠</span>
                  {errors.scheduledTime.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select your preferred appointment time
              </p>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or concerns..."
              className="min-h-[100px] border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 resize-none"
              {...register('notes')}
            />
            <p className="text-xs text-gray-500">
              Please describe your symptoms or reason for the visit
            </p>
          </div>

          {/* Time Availability Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              📅 Appointment Hours
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Monday - Friday: 9:00 AM - 5:00 PM</li>
              <li>• Weekend appointments available on request</li>
              <li>• Emergency consultations: Call clinic directly</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

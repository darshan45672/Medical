'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCreatePatientReport } from '@/hooks/use-patient-reports'
import { useAppointments } from '@/hooks/use-appointments'
import { ReportType, AppointmentStatus } from '@prisma/client'
import { toast } from 'sonner'
import { Calendar, FileText, User, Clock, Upload, X, FileImage, Stethoscope, ClipboardCheck, Plus, Eye } from 'lucide-react'

interface CreatePatientReportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UploadFile {
  id: string
  file: File
  preview?: string
  type: 'MEDICAL_REPORT' | 'PRESCRIPTION' | 'SCAN_REPORT'
}

interface Appointment {
  id: string
  scheduledAt: string
  status: AppointmentStatus
  patient: {
    id: string
    name: string | null
    email: string
  }
  doctor: {
    id: string
    name: string | null
    email: string
  }
}

const reportTypes = [
  { 
    value: 'DIAGNOSIS_REPORT', 
    label: 'Diagnosis Report', 
    description: 'Initial diagnosis and assessment',
    icon: '🩺',
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  { 
    value: 'TREATMENT_SUMMARY', 
    label: 'Treatment Summary', 
    description: 'Summary of treatment provided',
    icon: '🏥',
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  { 
    value: 'PRESCRIPTION_REPORT', 
    label: 'Prescription Report', 
    description: 'Medication prescriptions and instructions',
    icon: '💊',
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  { 
    value: 'LAB_REPORT', 
    label: 'Lab Report', 
    description: 'Laboratory test results and analysis',
    icon: '🧪',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  { 
    value: 'SCAN_REPORT', 
    label: 'Scan Report', 
    description: 'Medical imaging results and findings',
    icon: '📷',
    color: 'bg-red-50 border-red-200 text-red-800'
  },
  { 
    value: 'FOLLOW_UP_REPORT', 
    label: 'Follow-up Report', 
    description: 'Follow-up visit notes and progress',
    icon: '📋',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  },
  { 
    value: 'DISCHARGE_SUMMARY', 
    label: 'Discharge Summary', 
    description: 'Discharge instructions and summary',
    icon: '🏠',
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
]

export function CreatePatientReportModal({
  isOpen,
  onClose
}: CreatePatientReportModalProps) {
  const { data: session } = useSession()
  const createReport = useCreatePatientReport()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Fetch consulted appointments for the doctor
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments({
    doctorId: session?.user?.id,
    status: AppointmentStatus.CONSULTED,
    limit: 50
  })
  
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    reportType: '' as ReportType,
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    recommendations: '',
    followUpDate: ''
  })

  // File upload handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      type: 'MEDICAL_REPORT' as const
    }))

    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileType = (fileId: string, type: 'MEDICAL_REPORT' | 'PRESCRIPTION' | 'SCAN_REPORT') => {
    setUploadFiles(prev => prev.map(f => f.id === fileId ? { ...f, type } : f))
  }

  const uploadFilesToS3 = async (): Promise<string[]> => {
    if (uploadFiles.length === 0) return []

    const uploadedUrls: string[] = []
    
    for (const uploadFile of uploadFiles) {
      const formData = new FormData()
      formData.append('files', uploadFile.file)
      formData.append('appointmentId', selectedAppointmentId)
      formData.append('type', uploadFile.type)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload ${uploadFile.file.name}`)
      }

      const result = await response.json()
      if (result.documents && result.documents.length > 0) {
        uploadedUrls.push(result.documents[0].url)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAppointmentId || !formData.reportType || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields and select an appointment')
      return
    }

    setIsUploading(true)
    
    try {
      // Upload files to S3 first
      const uploadedUrls = await uploadFilesToS3()
      
      // Get selected appointment details
      const selectedAppointment = appointmentsData?.appointments.find((apt: Appointment) => apt.id === selectedAppointmentId)
      
      if (!selectedAppointment) {
        throw new Error('Selected appointment not found')
      }

      // Create the patient report
      await createReport.mutateAsync({
        patientId: selectedAppointment.patient.id,
        appointmentId: selectedAppointmentId,
        reportType: formData.reportType,
        title: formData.title,
        description: formData.description,
        diagnosis: formData.diagnosis || undefined,
        treatment: formData.treatment || undefined,
        medications: formData.medications || undefined,
        recommendations: formData.recommendations || undefined,
        followUpDate: formData.followUpDate || undefined,
        documentUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : undefined, // Store first uploaded file URL
      })

      toast.success('Patient report created successfully')
      
      // Reset form
      setFormData({
        reportType: '' as ReportType,
        title: '',
        description: '',
        diagnosis: '',
        treatment: '',
        medications: '',
        recommendations: '',
        followUpDate: ''
      })
      setSelectedAppointmentId('')
      setUploadFiles([])
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create report'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectedAppointment = appointmentsData?.appointments.find((apt: Appointment) => apt.id === selectedAppointmentId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-gray-50">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 -m-6 mb-0 p-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            Create Patient Report
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-2">
            Create a comprehensive medical report for a consulted patient with supporting documents
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 -m-6 mt-0 bg-gray-50">
          {appointmentsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-white rounded-full shadow-lg">
                <LoadingSpinner />
              </div>
              <p className="text-gray-600 mt-4 font-medium">Loading appointments...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Appointment Selection Section */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Patient Selection</h3>
                </div>
                
                <div>
                  <Label htmlFor="appointment" className="text-sm font-medium text-gray-700">
                    Select Patient Appointment *
                  </Label>
                  <Select value={selectedAppointmentId} onValueChange={setSelectedAppointmentId}>
                    <SelectTrigger className="mt-3 h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white hover:bg-gray-50 transition-colors">
                      <SelectValue placeholder="🔍 Choose a consulted appointment" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border-gray-300 shadow-xl">
                      {appointmentsData?.appointments.map((appointment: Appointment) => (
                        <SelectItem key={appointment.id} value={appointment.id} className="p-4 hover:bg-blue-50 focus:bg-blue-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {appointment.patient.name || appointment.patient.email}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {new Date(appointment.scheduledAt).toLocaleDateString()} at{' '}
                                {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {appointmentsData?.appointments.length === 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-amber-100 rounded-full">
                          <ClipboardCheck className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-amber-800 font-medium">
                            No consulted appointments found
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            Complete an appointment first to create reports.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Appointment Details */}
                {selectedAppointment && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {selectedAppointment.patient.name || selectedAppointment.patient.email}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-emerald-600" />
                              <span>{new Date(selectedAppointment.scheduledAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-emerald-600" />
                              <span>{new Date(selectedAppointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1 font-medium">
                        ✓ CONSULTED
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Report Type Selection */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Report Information</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="reportType" className="text-sm font-medium text-gray-700 mb-2 block">
                      Report Type *
                    </Label>
                    <Select value={formData.reportType} onValueChange={(value) => handleChange('reportType', value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="📋 Choose report type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 border-gray-300 shadow-xl">
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="p-4 hover:bg-indigo-50 focus:bg-indigo-50">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{type.icon}</span>
                              <div>
                                <div className="font-medium text-gray-900">{type.label}</div>
                                <div className="text-sm text-gray-500">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                        Report Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter descriptive report title"
                        className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white hover:bg-gray-50 transition-colors"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="followUpDate" className="text-sm font-medium text-gray-700 mb-2 block">
                        Follow-up Date
                      </Label>
                      <Input
                        id="followUpDate"
                        type="datetime-local"
                        value={formData.followUpDate}
                        onChange={(e) => handleChange('followUpDate', e.target.value)}
                        className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white hover:bg-gray-50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Provide a comprehensive description of the medical findings, observations, and assessment"
                      className="min-h-[100px] border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none bg-white hover:bg-gray-50 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Medical Details Section */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Medical Details</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="diagnosis" className="text-sm font-medium text-gray-700 mb-2 block">
                      Diagnosis
                    </Label>
                    <Textarea
                      id="diagnosis"
                      value={formData.diagnosis}
                      onChange={(e) => handleChange('diagnosis', e.target.value)}
                      placeholder="Primary and secondary diagnoses"
                      className="min-h-[100px] border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none bg-white hover:bg-gray-50 transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="treatment" className="text-sm font-medium text-gray-700 mb-2 block">
                      Treatment Provided
                    </Label>
                    <Textarea
                      id="treatment"
                      value={formData.treatment}
                      onChange={(e) => handleChange('treatment', e.target.value)}
                      placeholder="Procedures, therapies, and interventions"
                      className="min-h-[100px] border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none bg-white hover:bg-gray-50 transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medications" className="text-sm font-medium text-gray-700 mb-2 block">
                      Medications
                    </Label>
                    <Textarea
                      id="medications"
                      value={formData.medications}
                      onChange={(e) => handleChange('medications', e.target.value)}
                      placeholder="Prescribed medications, dosages, and instructions"
                      className="min-h-[100px] border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none bg-white hover:bg-gray-50 transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recommendations" className="text-sm font-medium text-gray-700 mb-2 block">
                      Recommendations
                    </Label>
                    <Textarea
                      id="recommendations"
                      value={formData.recommendations}
                      onChange={(e) => handleChange('recommendations', e.target.value)}
                      placeholder="Follow-up care, lifestyle changes, and additional recommendations"
                      className="min-h-[100px] border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none bg-white hover:bg-gray-50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Upload className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
                  <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-300">
                    {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    dragOver 
                      ? 'border-green-400 bg-green-50 scale-105 shadow-lg' 
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PDF, Images, and Documents (Max 10MB per file)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files List */}
                {uploadFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">
                        Uploaded Files ({uploadFiles.length})
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadFiles([])}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {uploadFiles.map((uploadFile) => (
                        <div key={uploadFile.id} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            {uploadFile.preview ? (
                              <div className="relative group">
                                <img
                                  src={uploadFile.preview}
                                  alt="Preview"
                                  className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-sm"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                                  <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileImage className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {uploadFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB • {uploadFile.file.type || 'Unknown type'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={uploadFile.type}
                              onValueChange={(value: 'MEDICAL_REPORT' | 'PRESCRIPTION' | 'SCAN_REPORT') =>
                                updateFileType(uploadFile.id, value)
                              }
                            >
                              <SelectTrigger className="w-40 h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEDICAL_REPORT">📋 Medical Report</SelectItem>
                                <SelectItem value="PRESCRIPTION">💊 Prescription</SelectItem>
                                <SelectItem value="SCAN_REPORT">📷 Scan Report</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uploadFile.id)}
                              className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    className="order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUploading || createReport.isPending || !selectedAppointmentId}
                    className="order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500"
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Uploading...</span>
                      </>
                    ) : createReport.isPending ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Creating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Create Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

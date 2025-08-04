'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppointments } from '@/hooks/use-appointments'
import { 
  Upload, 
  X, 
  FileText, 
  User, 
  Calendar, 
  FileImage,
  FilePlus,
  Check
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AddReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UploadFile {
  id: string
  file: File
  preview?: string
  type: 'MEDICAL_REPORT' | 'PRESCRIPTION' | 'SCAN_REPORT'
}

export function AddReportModal({ open, onOpenChange }: AddReportModalProps) {
  const { data: session } = useSession()
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get appointments where the current doctor has accepted appointments
  const { data: appointmentsData, isLoading } = useAppointments()
  const doctorAcceptedAppointments = appointmentsData?.appointments?.filter(
    (appointment: any) => 
      appointment.doctorId === session?.user?.id && 
      appointment.status === 'ACCEPTED'
  ) || []

  // Get unique patients from accepted appointments
  const patients = doctorAcceptedAppointments.reduce((acc: any[], appointment: any) => {
    if (!acc.find(p => p.id === appointment.patient?.id)) {
      acc.push({
        ...appointment.patient,
        lastAppointment: appointment.scheduledAt,
        appointmentId: appointment.id
      })
    }
    return acc
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFiles = (files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      type: 'MEDICAL_REPORT' // Default type
    }))
    
    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const updateFileType = (fileId: string, type: UploadFile['type']) => {
    setUploadFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, type } : f)
    )
  }

  const handleSubmit = async () => {
    if (!selectedPatientId || uploadFiles.length === 0) return

    setIsUploading(true)
    try {
      // Find the selected patient's appointment ID
      const selectedPatient = patients.find((p: any) => p.id === selectedPatientId)
      
      if (!selectedPatient?.appointmentId) {
        throw new Error('Appointment ID not found for selected patient')
      }

      // Create FormData for file upload
      const formData = new FormData()
      
      // Add appointment and patient IDs
      formData.append('appointmentId', selectedPatient.appointmentId)
      formData.append('patientId', selectedPatientId)
      
      // Add files with their types
      uploadFiles.forEach((uploadFile, index) => {
        formData.append('files', uploadFile.file)
        formData.append(`type_${index}`, uploadFile.type)
      })

      // Upload to server
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        // Success - show success message and close modal
        toast.success(`Successfully uploaded ${result.documents.length} document(s)!`)
        
        // Reset form and close modal
        setSelectedPatientId('')
        setUploadFiles([])
        onOpenChange(false)
      } else {
        // Error from server
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedPatientId('')
      setUploadFiles([])
      onOpenChange(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FileImage
    return FileText
  }

  const getTypeColor = (type: UploadFile['type']) => {
    switch (type) {
      case 'MEDICAL_REPORT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PRESCRIPTION': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'SCAN_REPORT': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Add Medical Report
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload medical reports for your patients
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Select Patient *
            </Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No accepted appointments found</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  You can only add reports for patients whose appointments you have accepted
                </p>
              </div>
            ) : patients.length <= 3 ? (
              // Checkbox approach for 3 or fewer patients
              <div className="grid gap-3">
                {patients.map((patient: any) => (
                  <div
                    key={patient.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedPatientId === patient.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {patient.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {patient.email}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Appointment: {formatDate(patient.lastAppointment)}
                          </div>
                          <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            Accepted Appointment
                          </div>
                        </div>
                      </div>
                      {selectedPatientId === patient.id && (
                        <div className="p-1 bg-blue-500 rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Dropdown approach for more than 3 patients
              <div className="space-y-3">
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a patient from your accepted appointments" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {patients.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center space-x-3 py-2">
                          <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
                            <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {patient.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {patient.email}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(patient.lastAppointment)}
                              <span className="ml-2 text-green-600 dark:text-green-400">• Accepted</span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPatientId && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Selected: {patients.find((p: any) => p.id === selectedPatientId)?.name}
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {patients.find((p: any) => p.id === selectedPatientId)?.email}
                        </p>
                        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Appointment: {formatDate(patients.find((p: any) => p.id === selectedPatientId)?.lastAppointment)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Upload Reports *
            </Label>
            
            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragOver(false)
              }}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-800 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Drag and drop your files here
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    or click to browse files
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-300 dark:border-slate-600 cursor-pointer"
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: PDF, JPEG, PNG, DOC, DOCX (Max 10MB each)
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(Array.from(e.target.files))
                }
              }}
            />
          </div>

          {/* Uploaded Files */}
          {uploadFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Uploaded Files ({uploadFiles.length})
              </Label>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {uploadFiles.map((uploadFile) => {
                  const FileIcon = getFileIcon(uploadFile.file)
                  return (
                    <div
                      key={uploadFile.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      {/* File Preview/Icon */}
                      <div className="flex-shrink-0">
                        {uploadFile.preview ? (
                          <Image
                            src={uploadFile.preview}
                            alt="Preview"
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            <FileIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {uploadFile.file.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {/* Report Type Selection */}
                      <div className="flex-shrink-0">
                        <select
                          value={uploadFile.type}
                          onChange={(e) => updateFileType(uploadFile.id, e.target.value as UploadFile['type'])}
                          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="MEDICAL_REPORT">Medical Report</option>
                          <option value="PRESCRIPTION">Prescription</option>
                          <option value="SCAN_REPORT">Scan Report</option>
                        </select>
                      </div>

                      {/* Type Badge */}
                      <Badge className={getTypeColor(uploadFile.type)}>
                        {uploadFile.type.replace('_', ' ')}
                      </Badge>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="border-gray-300 dark:border-slate-600 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPatientId || uploadFiles.length === 0 || isUploading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Uploading Reports...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Reports ({uploadFiles.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

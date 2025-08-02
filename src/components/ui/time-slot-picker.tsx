'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TimeSlotPickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  slots?: string[]
  minTime?: string
  maxTime?: string
  interval?: number // in minutes
  className?: string
  required?: boolean
  error?: string
  helperText?: string
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
  disabled?: boolean
}

export function TimeSlotPicker({
  value = '',
  onChange,
  label,
  slots,
  minTime = '09:00',
  maxTime = '17:00',
  interval = 30,
  className,
  required = false,
  error,
  helperText,
  colorScheme = 'blue',
  disabled = false
}: TimeSlotPickerProps) {
  const [selectedTime, setSelectedTime] = useState(value)

  const colorSchemes = {
    blue: {
      icon: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      selected: 'bg-blue-500 text-white border-blue-500',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-500'
    },
    green: {
      icon: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      selected: 'bg-green-500 text-white border-green-500',
      hover: 'hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-400 dark:hover:border-green-500'
    },
    purple: {
      icon: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      selected: 'bg-purple-500 text-white border-purple-500',
      hover: 'hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-400 dark:hover:border-purple-500'
    },
    orange: {
      icon: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      selected: 'bg-orange-500 text-white border-orange-500',
      hover: 'hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-400 dark:hover:border-orange-500'
    }
  }

  const scheme = colorSchemes[colorScheme]

  const generateTimeSlots = () => {
    if (slots) return slots

    const times = []
    const start = new Date(`2000-01-01T${minTime}:00`)
    const end = new Date(`2000-01-01T${maxTime}:00`)

    while (start <= end) {
      times.push(start.toTimeString().slice(0, 5))
      start.setMinutes(start.getMinutes() + interval)
    }

    return times
  }

  const timeSlots = generateTimeSlots()

  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleTimeSelect = (time: string) => {
    if (disabled) return
    setSelectedTime(time)
    onChange?.(time)
  }

  const getSlotAvailability = (time: string) => {
    // This could be extended to check actual availability from an API
    // For now, we'll simulate some unavailable slots
    const hour = parseInt(time.split(':')[0])
    const isLunchTime = hour >= 12 && hour < 13
    const isBreakTime = hour === 15
    
    return {
      available: !isLunchTime && !isBreakTime,
      reason: isLunchTime ? 'Lunch Break' : isBreakTime ? 'Break' : ''
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <div className={cn('p-1.5 rounded-md', scheme.icon)}>
            <Clock className={cn('h-4 w-4', scheme.iconColor)} />
          </div>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Card className="border-2 border-gray-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {timeSlots.map((time) => {
              const { available, reason } = getSlotAvailability(time)
              const isSelected = selectedTime === time
              const isDisabled = disabled || !available

              return (
                <div key={time} className="relative">
                  <Button
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full h-12 text-sm font-medium border-2 transition-all duration-200 relative',
                      isSelected && scheme.selected,
                      !isSelected && !isDisabled && cn(
                        'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100',
                        scheme.hover
                      ),
                      isDisabled && !available && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-400 dark:text-red-500 cursor-not-allowed',
                      isDisabled && available && 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold">
                        {formatTimeForDisplay(time)}
                      </span>
                      {!available && reason && (
                        <span className="text-xs opacity-75">
                          {reason}
                        </span>
                      )}
                    </div>
                  </Button>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  )}
                </div>
              )
            })}
          </div>

          {selectedTime && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Selected time:</span> {formatTimeForDisplay(selectedTime)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
          <span className="text-red-500">⚠</span>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  )
}

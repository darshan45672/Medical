'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  placeholder?: string
  minDate?: string
  maxDate?: string
  showTime?: boolean
  timeSlots?: string[]
  className?: string
  required?: boolean
  error?: string
  helperText?: string
  icon?: React.ReactNode
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
}

export function DateTimePicker({
  value = '',
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  showTime = false,
  timeSlots,
  className,
  required = false,
  error,
  helperText,
  icon,
  colorScheme = 'blue'
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const colorSchemes = {
    blue: {
      icon: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500 dark:border-blue-400',
      ring: 'ring-blue-200 dark:ring-blue-800',
      hover: 'hover:border-blue-400 dark:hover:border-blue-500',
      button: 'hover:bg-blue-50 dark:hover:bg-blue-950/30'
    },
    green: {
      icon: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      border: 'border-green-500 dark:border-green-400',
      ring: 'ring-green-200 dark:ring-green-800',
      hover: 'hover:border-green-400 dark:hover:border-green-500',
      button: 'hover:bg-green-50 dark:hover:bg-green-950/30'
    },
    purple: {
      icon: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500 dark:border-purple-400',
      ring: 'ring-purple-200 dark:ring-purple-800',
      hover: 'hover:border-purple-400 dark:hover:border-purple-500',
      button: 'hover:bg-purple-50 dark:hover:bg-purple-950/30'
    },
    orange: {
      icon: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500 dark:border-orange-400',
      ring: 'ring-orange-200 dark:ring-orange-800',
      hover: 'hover:border-orange-400 dark:hover:border-orange-500',
      button: 'hover:bg-orange-50 dark:hover:bg-orange-950/30'
    }
  }

  const scheme = colorSchemes[colorScheme]

  useEffect(() => {
    if (value) {
      if (showTime) {
        const [date, time] = value.split('T')
        setSelectedDate(date)
        setSelectedTime(time?.slice(0, 5) || '')
      } else {
        setSelectedDate(value)
      }
    }
  }, [value, showTime])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    const newValue = showTime && selectedTime 
      ? `${date}T${selectedTime}` 
      : date
    onChange?.(newValue)
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      onChange?.(showTime ? `${selectedDate}T${time}` : selectedDate)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

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

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isSelected = selectedDate === dateStr
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const isDisabled = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            if (!isDisabled) {
              handleDateChange(dateStr)
              setShowCalendar(false)
            }
          }}
          disabled={!!isDisabled}
          className={cn(
            'p-2 text-sm rounded-lg transition-colors font-medium',
            isSelected && `bg-${colorScheme}-500 text-white`,
            !isSelected && !isDisabled && `hover:bg-${colorScheme}-50 dark:hover:bg-${colorScheme}-950/30`,
            isToday && !isSelected && `bg-gray-100 dark:bg-slate-700`,
            isDisabled && 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
          {icon && (
            <div className={cn('p-1.5 rounded-md', scheme.icon)}>
              {icon}
            </div>
          )}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="space-y-3">
        {/* Date Input */}
        <div className="relative">
          <div
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              'h-12 px-4 border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 rounded-lg shadow-sm font-medium cursor-pointer flex items-center justify-between',
              error 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-800' 
                : cn('border-gray-300 dark:border-slate-600 focus:ring-2', scheme.border, scheme.ring, scheme.hover)
            )}
          >
            <span className={selectedDate ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              {selectedDate ? formatDateForDisplay(selectedDate) : placeholder || 'Select date'}
            </span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>

          {showCalendar && (
            <Card className="absolute top-full left-0 mt-2 z-50 w-80 shadow-xl border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Time Input */}
        {showTime && (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className={cn(
                  'h-12 pl-4 pr-4 border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 rounded-lg shadow-sm font-medium',
                  error 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-800' 
                    : cn('border-gray-300 dark:border-slate-600 focus:ring-2', scheme.border, scheme.ring, scheme.hover)
                )}
              />
            </div>

            {/* Quick Time Slots */}
            {timeSlots && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTimeChange(time)}
                    className={cn(
                      'h-9 text-xs font-medium border-gray-300 dark:border-slate-600 transition-all duration-200',
                      scheme.button,
                      selectedTime === time && `border-${colorScheme}-500 bg-${colorScheme}-50 dark:bg-${colorScheme}-950/30`
                    )}
                  >
                    {formatTimeForDisplay(time)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

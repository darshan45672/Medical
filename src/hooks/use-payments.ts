import { useState, useEffect } from 'react'
import { PaymentStatus } from '@/types'

interface Payment {
  id: string
  amount: number
  status: PaymentStatus
  paymentDate?: string
  paymentMethod?: string
  transactionId?: string
  notes?: string
  failureReason?: string
  createdAt: string
  claim: {
    id: string
    claimNumber: string
    diagnosis: string
    patient: {
      id: string
      name: string
      email: string
    }
  }
}

interface UsePaymentsParams {
  status?: PaymentStatus
  limit?: number
}

export function usePayments({ status, limit = 50 }: UsePaymentsParams = {}) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (limit) params.append('limit', limit.toString())

      const response = await fetch(`/api/payments?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }

      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch payments')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePaymentStatus = async (
    paymentId: string,
    newStatus: PaymentStatus,
    transactionId?: string,
    failureReason?: string,
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          transactionId,
          failureReason,
          notes
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment')
      }

      const updatedPayment = await response.json()
      
      // Update local state
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId ? updatedPayment : payment
        )
      )

      return updatedPayment
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  const createPayment = async (
    claimId: string,
    amount: number,
    paymentMethod?: string,
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId,
          amount,
          paymentMethod,
          notes
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      const newPayment = await response.json()
      
      // Add to local state
      setPayments(prev => [newPayment, ...prev])

      return newPayment
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [status, limit])

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPayments,
    updatePaymentStatus,
    createPayment
  }
}

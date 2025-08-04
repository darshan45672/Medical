'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone, Monitor, Tablet } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallProps {
  className?: string
  variant?: 'banner' | 'button' | 'card'
  showDismiss?: boolean
}

export function PWAInstall({ 
  className = '', 
  variant = 'banner',
  showDismiss = true 
}: PWAInstallProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'tablet' | 'unknown'>('unknown')

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches
    
    setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome)

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      if (/ipad|tablet/i.test(userAgent)) {
        setPlatform('tablet')
      } else {
        setPlatform('mobile')
      }
    } else {
      setPlatform('desktop')
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Don't show if already dismissed in this session
      const dismissed = sessionStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowInstallPrompt(true)
      }
    }

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      toast.success('App installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      if (platform === 'mobile' && /iphone|ipad/i.test(navigator.userAgent.toLowerCase())) {
        toast.info('To install this app on iOS: tap the Share button and then "Add to Home Screen"')
      } else {
        toast.info('This app can be installed from your browser\'s menu')
      }
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false)
        toast.success('App installation started!')
      } else {
        toast.info('App installation was cancelled')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error during app installation:', error)
      toast.error('Failed to install app')
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />
      case 'tablet':
        return <Tablet className="h-5 w-5" />
      case 'desktop':
        return <Monitor className="h-5 w-5" />
      default:
        return <Download className="h-5 w-5" />
    }
  }

  const getInstallText = () => {
    switch (platform) {
      case 'mobile':
        return 'Install Medical App on your phone'
      case 'tablet':
        return 'Install Medical App on your tablet'
      case 'desktop':
        return 'Install Medical App on your computer'
      default:
        return 'Install Medical App'
    }
  }

  // Don't show if already installed or no prompt available and not on supported platform
  if (isInstalled || (!showInstallPrompt && !deferredPrompt && variant === 'banner')) {
    return null
  }

  if (variant === 'button') {
    return (
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 cursor-pointer ${className}`}
        disabled={isInstalled}
      >
        {getPlatformIcon()}
        Install App
      </Button>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={`border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {getPlatformIcon()}
            Install Medical App
          </CardTitle>
          <CardDescription>
            Get quick access to your medical claims and appointments by installing our app
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="flex items-center gap-2 cursor-pointer">
              <Download className="h-4 w-4" />
              Install Now
            </Button>
            {showDismiss && (
              <Button onClick={handleDismiss} variant="outline" size="sm" className="cursor-pointer">
                Maybe Later
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Banner variant (default)
  if (!showInstallPrompt) return null

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {getPlatformIcon()}
          <div>
            <p className="font-medium">{getInstallText()}</p>
            <p className="text-sm text-blue-100">
              Access your medical information offline and get faster loading times
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstallClick}
            variant="secondary"
            size="sm"
            className="bg-white text-blue-600 hover:bg-blue-50 cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
          {showDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for checking PWA installation status
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches
    
    setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return { isInstalled, canInstall }
}

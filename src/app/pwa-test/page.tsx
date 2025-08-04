'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor,
  Download,
  Settings,
  Globe
} from 'lucide-react'
import { PWAInstall } from '@/components/ui/pwa-install'

export default function PWATestPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [userAgent, setUserAgent] = useState('')
  const [serviceWorker, setServiceWorker] = useState<{
    supported: boolean
    registered: boolean
    error?: string
  }>({ supported: false, registered: false })

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if running as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Get user agent
    setUserAgent(navigator.userAgent)

    // Check service worker
    if ('serviceWorker' in navigator) {
      setServiceWorker(prev => ({ ...prev, supported: true }))
      
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          if (registration) {
            setServiceWorker(prev => ({ ...prev, registered: true }))
          } else {
            setServiceWorker(prev => ({ ...prev, registered: false }))
          }
        })
        .catch(error => {
          setServiceWorker(prev => ({ 
            ...prev, 
            registered: false, 
            error: error.message 
          }))
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const features = [
    {
      name: 'Service Worker',
      supported: serviceWorker.supported,
      active: serviceWorker.registered,
      description: 'Enables offline functionality and caching'
    },
    {
      name: 'Web App Manifest',
      supported: true, // We know we have this
      active: true,
      description: 'Enables installation and native app-like experience'
    },
    {
      name: 'Online Status',
      supported: true,
      active: isOnline,
      description: 'Network connectivity detection'
    },
    {
      name: 'Standalone Mode',
      supported: true,
      active: isStandalone,
      description: 'Running as installed PWA'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-4">
            PWA Test & Diagnostics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test Progressive Web App capabilities and installation
          </p>
        </div>

        {/* PWA Install Component Tests */}
        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                PWA Install Components
              </CardTitle>
              <CardDescription>
                Test different PWA install component variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Banner Variant</h4>
                <PWAInstall variant="banner" />
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Button Variant</h4>
                <PWAInstall variant="button" />
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Card Variant</h4>
                <PWAInstall variant="card" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PWA Features Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                PWA Features
              </CardTitle>
              <CardDescription>
                Current status of PWA capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{feature.name}</span>
                        {feature.supported ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                    <Badge variant={feature.active ? "default" : "secondary"}>
                      {feature.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Environment Info
              </CardTitle>
              <CardDescription>
                Browser and device information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isStandalone ? (
                    <Smartphone className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Monitor className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm">
                    {isStandalone ? "Standalone App" : "Browser Mode"}
                  </span>
                </div>
                
                {serviceWorker.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Service Worker Error: {serviceWorker.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                <h4 className="font-semibold text-sm mb-2">User Agent</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                  {userAgent}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
            <CardDescription>
              How to install and test the PWA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Development Testing:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PWA features are limited in development mode. For full testing, build and serve the production version.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Production Build:</h4>
                <pre className="text-xs bg-gray-100 dark:bg-slate-800 p-2 rounded border overflow-x-auto">
                  npm run build && npm start
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold">Browser Installation:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Chrome: Look for install icon in address bar</li>
                  <li>• Edge: Click &quot;Install&quot; button in address bar</li>
                  <li>• Safari: Add to Home Screen from share menu</li>
                  <li>• Firefox: Add to Home Screen (mobile)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

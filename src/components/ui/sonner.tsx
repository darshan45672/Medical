"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={20}
      expand={true}
      visibleToasts={4}
      closeButton={true}
      richColors={false}
      toastOptions={{
        style: {
          background: theme === 'dark' 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          border: theme === 'dark' 
            ? '1px solid rgba(71, 85, 105, 0.3)' 
            : '1px solid rgba(226, 232, 240, 0.8)',
          color: theme === 'dark' 
            ? 'rgb(241, 245, 249)' 
            : 'rgb(15, 23, 42)',
          fontSize: '14px',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: theme === 'dark'
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          minHeight: '60px',
          minWidth: '320px',
          maxWidth: '420px',
        },
        className: 'group toast enhanced-toast',
        descriptionClassName: 'group-[.toast]:text-muted-foreground text-sm mt-1',
        actionButtonStyle: {
          background: 'rgb(59, 130, 246)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: '500',
        },
        cancelButtonStyle: {
          background: theme === 'dark' 
            ? 'rgba(71, 85, 105, 0.5)' 
            : 'rgba(226, 232, 240, 0.8)',
          color: theme === 'dark' 
            ? 'rgb(148, 163, 184)' 
            : 'rgb(71, 85, 105)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: '500',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

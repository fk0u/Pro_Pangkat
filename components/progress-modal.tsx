import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

export type ProgressStatus = 'loading' | 'success' | 'error' | 'warning'

interface ProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  progress: number
  current: number
  total: number
  status: ProgressStatus
  statusMessage?: string
  disableClose?: boolean
}

export function ProgressModal({
  open,
  onOpenChange,
  title,
  description,
  progress,
  current,
  total,
  status,
  statusMessage,
  disableClose = false
}: ProgressModalProps) {
  // Auto-close on success after a delay
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (status === 'success' && !disableClose) {
      timeout = setTimeout(() => {
        onOpenChange(false)
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [status, onOpenChange, disableClose])

  return (
    <Dialog open={open} onOpenChange={disableClose ? () => {} : onOpenChange}>
      <DialogContent 
        className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        onInteractOutside={(e) => {
          if (disableClose) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (disableClose) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {status === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Progress indicator with enhanced animation */}
          <div className="relative overflow-hidden rounded-full">
            <Progress value={progress} className="h-3" />
            
            {/* Animated gradient that slides from left to right */}
            <motion.div 
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" 
              animate={{ 
                x: ["0%", "100%"],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "linear"
              }}
              style={{ width: "30%" }}
            />
            
            {/* Additional shimmering effect to enhance visibility */}
            <motion.div 
              className="absolute top-0 left-0 h-3 w-full"
              style={{ 
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
                transform: 'translateX(-100%)'
              }}
              animate={{ 
                x: ['0%', '100%']
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.5, 
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>
          
          {/* Progress stats with animation */}
          <motion.div 
            className="flex justify-between text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-gray-600 dark:text-gray-400">
              {current} dari {total} selesai
            </span>
            <motion.span 
              className="font-medium"
              key={progress} // Remount on progress change
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {Math.round(progress)}%
            </motion.span>
          </motion.div>
          
          {/* Status message with improved animation */}
          <AnimatePresence mode="wait">
            {statusMessage && (
              <motion.div
                key={`${status}-${statusMessage}`}
                initial={{ opacity: 0, y: 10, x: -5 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.4, 
                  type: "spring", 
                  stiffness: 100,
                  damping: 10
                }}
                className={`mt-2 p-3 rounded-md text-sm ${
                  status === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  status === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  status === 'warning' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}
              >
                {statusMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Success animation - enhanced with staggered effects */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div 
                className="flex justify-center mt-4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15,
                  duration: 0.6
                }}
              >
                <motion.div 
                  className="bg-green-100 dark:bg-green-900/50 rounded-full p-3 relative"
                  animate={{ boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.2)', '0 0 0 10px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)'] }}
                  transition={{ 
                    repeat: 2,
                    duration: 1.5,
                    ease: "easeOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
                  
                  {/* Radiating success circles */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-500"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 1.2,
                      ease: "easeOut"
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Error animation - enhanced with shake and pulse effects */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.div 
                className="flex justify-center mt-4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15 
                }}
              >
                <motion.div 
                  className="bg-red-100 dark:bg-red-900/50 rounded-full p-3"
                  initial={{ rotate: -10 }}
                  animate={{ 
                    rotate: [0, -5, 5, -5, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                >
                  <XCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Warning animation */}
          <AnimatePresence>
            {status === 'warning' && (
              <motion.div 
                className="flex justify-center mt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <motion.div 
                  className="bg-yellow-100 dark:bg-yellow-900/50 rounded-full p-3"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ 
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                >
                  <AlertCircle className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

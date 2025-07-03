"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  gradient?: string
}

export function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  gradient = "from-blue-500 to-purple-600" 
}: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
    >
      <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white`}>
        <div className="flex items-center mb-4">
          <Icon className="h-8 w-8 mr-3" />
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-blue-100">{subtitle}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

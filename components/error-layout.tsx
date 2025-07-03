import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface ErrorLayoutProps {
  children: ReactNode
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  title: string
  description: string
  errorCode?: string | number
  className?: string
}

export function ErrorLayout({
  children,
  icon: Icon,
  iconColor = "text-red-600 dark:text-red-400",
  iconBgColor = "bg-red-100 dark:bg-red-900/20",
  title,
  description,
  errorCode,
  className = ""
}: ErrorLayoutProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 ${className}`}>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconBgColor}`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          {errorCode && (
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {errorCode}
            </div>
          )}
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

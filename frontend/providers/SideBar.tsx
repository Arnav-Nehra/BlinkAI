'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect, useState } from "react"

interface MobileAwareSidebarProviderProps {
  children: React.ReactNode
}

export default function ResponsiveSidebarProvider({ children }: MobileAwareSidebarProviderProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  useEffect(() => {
   
    if (isMobile !== undefined) {
      setOpen(!isMobile)
    }
  }, [isMobile])

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      {children}
    </SidebarProvider>
  )
}

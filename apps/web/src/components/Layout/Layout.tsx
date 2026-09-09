import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <div className="relative isolate overflow-hidden min-h-screen">
        {children}
      </div>
    </div>
  )
}

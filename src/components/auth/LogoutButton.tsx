'use client'

import { useAuth } from './AuthProvider'
import Button from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const { signOut, user } = useAuth()

  if (!user) return null

  return (
    <Button
      onClick={signOut}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  )
}
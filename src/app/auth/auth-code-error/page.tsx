import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Authentication Error
          </h1>
          
          <p className="text-slate-400 mb-6">
            There was an error processing your authentication. This could be due to an expired or invalid link.
          </p>
          
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full">
                Try Signing In Again
              </Button>
            </Link>
            
            <p className="text-sm text-slate-500">
              If you continue to have issues, please check your email for a new confirmation link.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
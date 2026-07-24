import React, { useState } from "react"
import { X, ArrowLeft, Plus, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Lead } from "@/types"
import { useEmailStore } from "@/store/emailStore"

interface EmailHeaderProps {
  lead: Lead
  onClose: () => void
  onCompose: () => void
  isThreadActive: boolean
  onBack: () => void
}

export function EmailHeader({ lead, onClose, onCompose, isThreadActive, onBack }: EmailHeaderProps) {
  const { syncEmails } = useEmailStore()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    await syncEmails(lead.email)
    setSyncing(false)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-3 min-w-0">
        {isThreadActive ? (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 -ml-2 text-slate-500 hover:bg-slate-100 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Avatar className="h-10 w-10 border-2 border-blue-100 shrink-0">
            <AvatarFallback className="bg-blue-50 text-blue-700 font-bold">
              {lead.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="min-w-0 pr-2">
          <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{lead.name}</p>
          <div className="flex items-center gap-2 mt-0.5 truncate">
            <span className="text-xs text-slate-500 font-medium truncate">{lead.email || 'No Email'}</span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-blue-600 font-medium">Email Ready</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {!isThreadActive && (
          <>
            <Button variant="ghost" size="icon" onClick={handleSync} disabled={syncing} title="Sync Emails" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-blue-500' : ''}`} />
            </Button>
            <Button onClick={onCompose} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 px-2.5 ml-1">
              <Plus size={14} /> <span className="text-xs font-medium">Compose</span>
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
          </>
        )}
        
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

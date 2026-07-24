import React from "react"
import { Loader2, Mail } from "lucide-react"
import { Lead } from "@/types"
import { useEmailStore } from "@/store/emailStore"

interface EmailConversationListProps {
  lead: Lead
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function EmailConversationList({ lead }: EmailConversationListProps) {
  const { conversations, loadingConversations, setActiveThread } = useEmailStore()

  if (loadingConversations && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="text-sm font-medium">Loading threads...</span>
      </div>
    )
  }

  if (!loadingConversations && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 p-8 text-center">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-slate-300" />
        </div>
        <div>
          <h4 className="text-slate-600 font-semibold mb-1">No Emails Found</h4>
          <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
            There are no email threads associated with {lead.email || 'this lead'}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {conversations.map(conv => {
        // Strip out pure email addresses from participants for clean display
        const participantNames = conv.participants.map(p => p.match(/<([^>]+)>/)?.[1] || p)
        // Ensure the lead's email is visually distinguished or filtered out if we just want to see "who else"
        
        return (
          <div 
            key={conv._id} 
            onClick={() => setActiveThread(conv.threadId)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-1.5 gap-2">
              <h4 className="font-semibold text-sm text-slate-800 line-clamp-1 flex-1 group-hover:text-blue-700 transition-colors">
                {conv.subject || '(No Subject)'}
              </h4>
              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                {formatTime(conv.lastMessageAt)}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
              {conv.lastMessageSnippet}
            </p>
            
            <div className="flex gap-1.5 flex-wrap">
              {participantNames.slice(0, 3).map((p, i) => (
                <span key={i} className="text-[9px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-[120px] border border-slate-200">
                  {p}
                </span>
              ))}
              {participantNames.length > 3 && (
                <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                  +{participantNames.length - 3}
                </span>
              )}
            </div>
          </div>
        )
      })}
      
      {/* Infinite Scroll loading indicator could go here */}
      {loadingConversations && conversations.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  )
}

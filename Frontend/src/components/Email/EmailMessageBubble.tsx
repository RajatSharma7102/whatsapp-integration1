import React from "react"
import { Check, CheckCheck, FileText, Download } from "lucide-react"

interface EmailMessageBubbleProps {
  msg: any
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function EmailMessageBubble({ msg }: EmailMessageBubbleProps) {
  const isIncoming = msg.direction === 'incoming'
  const senderName = msg.sender.match(/<([^>]+)>/)?.[1] || msg.sender

  return (
    <div className={`flex flex-col max-w-[88%] ${isIncoming ? 'self-start items-start' : 'self-end items-end'}`}>
      
      {/* Sender & Time Info */}
      <div className="flex items-center gap-2 mb-1 px-1.5">
        <span className="text-[10px] font-semibold text-slate-500 tracking-wide">
          {isIncoming ? senderName : 'You'}
        </span>
        <span className="text-[9px] text-slate-400 font-medium">{formatTime(msg.sentAt)}</span>
      </div>
      
      {/* Bubble */}
      <div className={`p-3.5 rounded-2xl text-[13.5px] shadow-sm relative group leading-relaxed ${
        isIncoming 
          ? 'bg-white border border-slate-200 rounded-tl-sm text-slate-800' 
          : 'bg-blue-600 border border-blue-600 rounded-tr-sm text-white'
      }`}>
        
        {/* HTML or Plain text */}
        {msg.htmlBody ? (
          <div 
            className={`email-content prose prose-sm max-w-none ${isIncoming ? 'prose-slate' : 'prose-invert'} [&>p]:my-1 [&>div]:my-1`}
            dangerouslySetInnerHTML={{ __html: msg.htmlBody }}
          />
        ) : (
          <div className="whitespace-pre-wrap">{msg.plainBody}</div>
        )}
        
        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className={`mt-3 pt-3 flex flex-wrap gap-2 ${isIncoming ? 'border-t border-slate-100' : 'border-t border-blue-500/30'}`}>
            {msg.attachments.map((att: any, i: number) => (
              <div 
                key={i} 
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border shadow-sm transition-colors cursor-pointer ${
                  isIncoming 
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' 
                    : 'bg-blue-700/50 border-blue-500/50 hover:bg-blue-700/80'
                }`}
              >
                <FileText className={`h-4 w-4 ${isIncoming ? 'text-slate-400' : 'text-blue-200'}`} />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-medium truncate max-w-[120px] ${isIncoming ? 'text-slate-700' : 'text-white'}`}>
                    {att.filename}
                  </span>
                  <span className={`text-[9px] ${isIncoming ? 'text-slate-400' : 'text-blue-200'}`}>
                    {Math.round(att.size / 1024)} KB
                  </span>
                </div>
                <Download className={`h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${isIncoming ? 'text-slate-400' : 'text-blue-200'}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status marks for outgoing messages */}
      {!isIncoming && (
        <div className="flex items-center gap-1 mt-1 px-1">
          {msg.status === "Sent" && <Check className="h-3 w-3 text-slate-400" />}
          {msg.status === "Delivered" && <CheckCheck className="h-3 w-3 text-slate-400" />}
          {msg.status === "Read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
          {msg.status === "Failed" && <span className="text-[9px] text-red-500 font-medium">Failed</span>}
        </div>
      )}
    </div>
  )
}

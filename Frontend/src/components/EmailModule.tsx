import React, { useEffect, useState, useRef, FormEvent } from "react"
import { useEmailStore } from "@/store/emailStore"
import { Loader2, ArrowLeft, Send, Search, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Lead } from "@/types"
import { emailService } from "@/services/email.service"
import { useSocketStore } from "@/store/socketStore"

interface EmailModuleProps {
  lead: Lead;
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return formatTime(dateStr)
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function EmailModule({ lead }: EmailModuleProps) {
  const { 
    conversations, 
    loadingConversations, 
    fetchConversations, 
    activeThreadId, 
    setActiveThread, 
    messages, 
    loadingMessages, 
    syncEmails
  } = useEmailStore()

  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { socket } = useSocketStore()

  useEffect(() => {
    if (lead?.email) {
      fetchConversations(lead.email)
    }
  }, [lead])

  useEffect(() => {
    if (socket) {
      socket.on('new_email', (data: any) => {
        if (data.threadId === activeThreadId) {
          fetchMessages(activeThreadId)
        } else {
          fetchConversations(lead.email)
        }
      })
      
      return () => {
        socket.off('new_email')
      }
    }
  }, [socket, activeThreadId, lead.email])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSync = async () => {
    setSyncing(true)
    await syncEmails(lead.email)
    setSyncing(false)
  }

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !lead?.email) return
    
    const text = inputText.trim()
    setInputText("")
    setSending(true)

    try {
      // Find active conversation to get threadId
      const conv = conversations.find(c => c.threadId === activeThreadId)
      
      await emailService.sendEmail({
        to: lead.email,
        subject: conv ? conv.subject : 'Reply',
        text: text,
        threadId: activeThreadId || undefined,
        conversationId: conv ? conv._id : undefined
      })
      
      // Refresh messages
      if (activeThreadId) {
        useEmailStore.getState().fetchMessages(activeThreadId)
      } else {
        useEmailStore.getState().fetchConversations(lead.email)
      }
    } catch (err) {
      console.error("Failed to send", err)
      setInputText(text) // Restore on failure
    } finally {
      setSending(false)
    }
  }

  // List View
  if (!activeThreadId) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-700 text-sm">Email Threads</h3>
          <Button variant="ghost" size="icon" onClick={handleSync} disabled={syncing} className="h-7 w-7 text-slate-500">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loadingConversations ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm">
              No email threads found for this lead.
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv._id} 
                onClick={() => setActiveThread(conv.threadId)}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-violet-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm text-slate-800 line-clamp-1 flex-1">{conv.subject || '(No Subject)'}</h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{formatDate(conv.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{conv.lastMessageSnippet}</p>
                <div className="mt-2 flex gap-1">
                  {conv.participants.map((p, i) => {
                    const emailOnly = p.match(/<([^>]+)>/)?.[1] || p;
                    return (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                        {emailOnly}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Chat View
  const activeConv = conversations.find(c => c.threadId === activeThreadId)

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-white shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setActiveThread(null)} className="h-8 w-8 -ml-1 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{activeConv?.subject || '(No Subject)'}</h3>
          <p className="text-[10px] text-slate-400 truncate">Thread ID: {activeThreadId}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isIncoming = msg.direction === 'incoming'
            return (
              <div key={msg._id} className={`flex flex-col max-w-[85%] ${isIncoming ? 'self-start items-start' : 'self-end items-end'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-medium text-slate-500">
                    {msg.sender.match(/<([^>]+)>/)?.[1] || msg.sender}
                  </span>
                  <span className="text-[9px] text-slate-400">{formatTime(msg.sentAt)}</span>
                </div>
                
                <div className={`p-3 rounded-2xl text-sm shadow-sm border ${
                  isIncoming 
                    ? 'bg-white border-slate-200 rounded-tl-sm text-slate-800' 
                    : 'bg-violet-50 border-violet-100 rounded-tr-sm text-slate-800'
                }`}>
                  {msg.htmlBody ? (
                    <div 
                      className="email-content text-[13px] prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: msg.htmlBody }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-[13px]">{msg.plainBody}</div>
                  )}
                  
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-600 truncate max-w-[120px]">{att.filename}</span>
                          <span className="text-[9px] text-slate-400">({Math.round(att.size / 1024)}kb)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Footer */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-violet-300 focus-within:ring-1 focus-within:ring-violet-300 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your reply..."
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none py-1.5 text-sm focus:outline-none text-slate-700 placeholder-slate-400 min-h-[32px] max-h-[120px]"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="h-9 w-9 rounded-full shrink-0 bg-violet-600 hover:bg-violet-700 text-white shadow-sm p-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-[-1px]" />}
          </Button>
        </form>
      </div>
    </div>
  )
}

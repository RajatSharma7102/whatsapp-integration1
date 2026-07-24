import React, { useRef, useEffect, useState, FormEvent } from "react"
import { Loader2, Send, Paperclip, ArrowDown } from "lucide-react"
import { Lead } from "@/types"
import { useEmailStore } from "@/store/emailStore"
import { emailService } from "@/services/email.service"
import { EmailMessageBubble } from "./EmailMessageBubble"
import { Button } from "@/components/ui/button"

interface EmailChatViewProps {
  lead: Lead
}

export function EmailChatView({ lead }: EmailChatViewProps) {
  const { 
    activeThreadId, 
    conversations, 
    messages, 
    loadingMessages 
  } = useEmailStore()

  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.threadId === activeThreadId)

  // Smart scrolling
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Check if we were near bottom. Increase threshold to 500 to account for the height of the newly rendered message
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 500
    
    if (isNearBottom || messages.length <= 20) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setShowScrollButton(false)
    } else {
      setShowScrollButton(true)
    }
  }, [messages])

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (isNearBottom) {
      setShowScrollButton(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowScrollButton(false)
  }

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !lead?.email || !activeThreadId) return
    
    const text = inputText.trim()
    setInputText("")
    setSending(true)

    try {
      await emailService.sendEmail({
        to: lead.email,
        subject: activeConv ? activeConv.subject : 'Reply',
        text: text,
        threadId: activeThreadId,
        conversationId: activeConv ? activeConv._id : undefined
      })
      // Ensure UI updates reliably even if Socket is slow
      useEmailStore.getState().fetchMessages(activeThreadId)
    } catch (err) {
      console.error("Failed to send", err)
      setInputText(text) // Restore on failure
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      
      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth relative"
      >
        {loadingMessages && messages.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          messages.map(msg => (
            <EmailMessageBubble key={msg._id} msg={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-[80px] right-4 z-20">
          <Button 
            onClick={scrollToBottom}
            size="sm" 
            className="rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 shadow-md flex items-center gap-1.5 px-3 border border-blue-200"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="text-xs font-semibold">New Messages</span>
          </Button>
        </div>
      )}

      {/* Reply Footer (Fixed) */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0 z-10 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
        <form 
          onSubmit={handleSend} 
          className="flex items-end gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
        >
          <Button variant="ghost" size="icon" type="button" className="h-8 w-8 rounded-full shrink-0 text-slate-400 hover:text-slate-600 mb-0.5">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your reply here..."
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none py-2 text-sm focus:outline-none text-slate-800 placeholder-slate-400 min-h-[36px] max-h-[150px] leading-relaxed"
          />
          
          <Button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="h-10 w-10 rounded-full shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md p-0 flex items-center justify-center transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 ml-[-2px]" />}
          </Button>
        </form>
      </div>
    </div>
  )
}

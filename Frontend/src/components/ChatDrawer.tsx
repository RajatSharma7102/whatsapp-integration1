import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Paperclip, Send, Smile, Check, CheckCheck, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lead } from "@/types"
import { conversationService } from "@/services/conversation.service"
import { useConversationStore } from "@/store/conversationStore"

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function ChatDrawer({ isOpen, onClose, lead }: ChatDrawerProps) {
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    loadingMessages,
    sendingMessage,
    setActiveConversation,
    sendMessage,
    takeOverConversation,
    activeConversation
  } = useConversationStore()

  useEffect(() => {
    if (!isOpen || !lead) {
      setActiveConversation(null, null)
      return
    }

    const initChat = async () => {
      try {
        const res = await conversationService.getByLead(lead._id)
        if (res.data) {
          setActiveConversation(res.data, lead)
        } else {
          setActiveConversation(null, lead)
        }
      } catch (err) {
        console.error('Failed to init chat', err)
        setActiveConversation(null, lead)
      }
    }

    initChat()
  }, [isOpen, lead, setActiveConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!inputText.trim() || !lead) return
    const text = inputText.trim()
    setInputText("")
    
    await sendMessage(lead._id, text)
    // Refresh conversation if it's new
    if (!activeConversation) {
       try {
         const res = await conversationService.getByLead(lead._id)
         if (res.data) setActiveConversation(res.data, lead)
       } catch (e) {}
    }
  }

  const handleTakeOver = () => {
    if (activeConversation) {
      takeOverConversation(activeConversation._id)
    }
  }

  if (!isOpen || !lead) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-emerald-100">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name.replace(" ", "")}`} />
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold">
                    {lead.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">{lead.phone}</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* ── Lead Info Bar ── */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0 space-y-3">
              <div className="flex gap-1.5 flex-wrap items-center justify-between">
                <div className="flex gap-1.5">
                  {lead.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] h-5 rounded-md">{tag}</Badge>
                  ))}
                  <Badge className="text-[10px] h-5 rounded-md bg-sky-100 text-sky-700 hover:bg-sky-100 border-sky-200 border">
                    {lead.status}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400">
                  Agent: <span className="font-medium text-slate-600">{lead.assignedTo?.name || 'Unassigned'}</span>
                </span>
              </div>
              
              {/* Bot Info & Take Over */}
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-semibold">Service</span>
                    <span className="text-slate-700 font-medium">{lead.selectedService || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-semibold">Requirement</span>
                    <span className="text-slate-700 font-medium line-clamp-1">{lead.requirement || '—'}</span>
                  </div>
                </div>
                {activeConversation?.botStatus === 'BOT_ACTIVE' ? (
                  <Button onClick={handleTakeOver} size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                    Take Over
                  </Button>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">Human Assigned</Badge>
                )}
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto bg-[#ECE5DD]/30 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg, idx) => {
                    const isAgent = msg.direction === "outgoing"
                    const text = msg.message
                    const time = formatTime(msg.sentAt)
                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex flex-col max-w-[80%] ${isAgent ? "self-end items-end" : "self-start items-start"}`}
                      >
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                            isAgent
                              ? "bg-[#dcf8c6] text-slate-800 rounded-br-sm"
                              : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                          }`}
                        >
                          {text}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 px-1">
                          <span className="text-[10px] text-slate-400">{time}</span>
                          {isAgent && (
                            <span>
                              {msg.status === "sent" && <Check className="h-3 w-3 text-slate-400" />}
                              {msg.status === "delivered" && <CheckCheck className="h-3 w-3 text-slate-400" />}
                              {msg.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
                              {msg.status === "failed" && <span className="text-[9px] text-red-400">Failed</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-end gap-2 bg-slate-100 rounded-2xl px-3 py-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0 text-slate-400 hover:text-slate-600">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0 text-slate-400 hover:text-slate-600">
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
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent border-0 resize-none py-1.5 text-sm focus:outline-none text-slate-700 placeholder-slate-400 min-h-[32px] max-h-[100px]"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sendingMessage}
                  className="h-9 w-9 rounded-full shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm p-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-[-1px]" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lead } from "@/types"
import { useEmailStore } from "@/store/emailStore"
import { useSocketStore } from "@/store/socketStore"
import { EmailHeader } from "./EmailHeader"
import { EmailConversationList } from "./EmailConversationList"
import { EmailChatView } from "./EmailChatView"
import { ComposeEmailModal } from "./ComposeEmailModal"

interface EmailDrawerProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
}

export function EmailDrawer({ isOpen, onClose, lead }: EmailDrawerProps) {
  const { 
    fetchConversations, 
    activeThreadId, 
    setActiveThread, 
    fetchMessages,
    addMessage
  } = useEmailStore()
  
  const { socket } = useSocketStore()
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  // Fetch threads when opened
  useEffect(() => {
    if (isOpen && lead?.email) {
      fetchConversations(lead.email)
    }
    if (!isOpen) {
      setActiveThread(null)
    }
  }, [isOpen, lead])

  // Socket listener for auto-sync
  useEffect(() => {
    if (socket) {
      const handleNewEmail = (data: any) => {
        if (isOpen && lead?.email) {
          const participants = [data.message.sender, ...(data.message.recipients || [])];
          const isRelatedToLead = participants.some((p: string) => p && p.toLowerCase().includes(lead.email!.toLowerCase()));

          if (isRelatedToLead) {
            // Always refresh conversation list to update snippets and sort order
            fetchConversations(lead.email);

            // If we are actively looking at this thread, append it
            const currentActiveThread = useEmailStore.getState().activeThreadId;
            if (currentActiveThread === data.threadId) {
              useEmailStore.getState().addMessage(data.threadId, data.message);
            }
          }
        }
      }
      
      socket.on('email:new-message', handleNewEmail)
      return () => {
        socket.off('email:new-message', handleNewEmail)
      }
    }
  }, [socket, isOpen, activeThreadId, lead?.email, addMessage, fetchConversations])

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
            className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Unified Header */}
            <EmailHeader 
              lead={lead} 
              onClose={onClose} 
              onCompose={() => setIsComposeOpen(true)}
              isThreadActive={!!activeThreadId}
              onBack={() => setActiveThread(null)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              {activeThreadId ? (
                <EmailChatView lead={lead} />
              ) : (
                <EmailConversationList lead={lead} />
              )}
            </div>
          </motion.div>
          
          {/* Compose Modal (Overlay on top of drawer) */}
          <ComposeEmailModal 
            isOpen={isComposeOpen} 
            onClose={() => setIsComposeOpen(false)} 
            lead={lead} 
          />
        </>
      )}
    </AnimatePresence>
  )
}

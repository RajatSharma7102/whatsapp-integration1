import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Lead } from "@/types"
import { emailService } from "@/services/email.service"
import { useEmailStore } from "@/store/emailStore"

interface ComposeEmailModalProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
}

export function ComposeEmailModal({ isOpen, onClose, lead }: ComposeEmailModalProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const { fetchConversations } = useEmailStore()

  if (!isOpen || !lead) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim() || !lead.email) return

    setSending(true)
    try {
      await emailService.sendEmail({
        to: lead.email,
        subject: subject.trim(),
        text: body.trim() // Using text instead of HTML for simple textarea
      })
      
      // Refresh list
      fetchConversations(lead.email)
      
      // Reset & Close
      setSubject("")
      setBody("")
      onClose()
    } catch (err) {
      console.error("Failed to send email", err)
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-800">New Email</h3>
              <p className="text-[11px] text-slate-500 font-medium">To: {lead.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="flex flex-col flex-1">
            <div className="p-5 space-y-4">
              
              {/* Subject */}
              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-sm font-medium border-0 border-b border-slate-200 focus:border-blue-500 focus:ring-0 px-1 py-2 text-slate-800 placeholder-slate-400 bg-transparent transition-colors"
                  required
                />
              </div>
              
              {/* Body */}
              <div className="pt-2">
                <textarea
                  placeholder="Write your email here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full text-sm border-0 focus:ring-0 px-1 py-2 text-slate-700 placeholder-slate-400 bg-transparent resize-none leading-relaxed"
                  required
                />
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 h-9 px-3 gap-2">
                <Paperclip className="h-4 w-4" />
                <span>Attach File</span>
              </Button>
              
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 h-9">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={sending || !subject.trim() || !body.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 shadow-sm transition-all"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Email
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

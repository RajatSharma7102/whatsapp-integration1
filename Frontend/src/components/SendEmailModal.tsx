import React, { useState } from "react"
import { XCircle, Send, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface SendEmailModalProps {
  isOpen: boolean
  onClose: () => void
  recipientEmail: string
}

export function SendEmailModal({ isOpen, onClose, recipientEmail }: SendEmailModalProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      await api.post("/email/send", {
        to: recipientEmail,
        subject: subject,
        text: body
      })
      setSuccessMsg("Email sent successfully!")
      setTimeout(() => {
        onClose()
        setSubject("")
        setBody("")
        setSuccessMsg("")
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to send email")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Send Email to {recipientEmail}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSend} className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="Following up on your query"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                required
                rows={6}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !subject || !body}
              className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import { LeadTable } from "@/components/LeadTable"
import { ChatDrawer } from "@/components/ChatDrawer"
import { Lead } from "@/types"
import { useLeadStore } from "@/store/leadStore"
import { useSocketStore } from "@/store/socketStore"
import { CreateLeadModal } from "@/components/CreateLeadModal"

export default function Leads() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { leads, total, fetchLeads } = useLeadStore()
  const { connect, disconnect } = useSocketStore()

  useEffect(() => {
    fetchLeads()
    connect()
    return () => {
      disconnect()
    }
  }, [fetchLeads, connect, disconnect])

  const handleOpenChat = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDrawerOpen(true)
  }

  const handleCloseChat = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedLead(null), 300)
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage and track your leads from all sources in one place.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
          + Create Lead
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads", value: total.toString(), color: "from-violet-500 to-purple-600", icon: "👥" },
          { label: "New", value: leads.filter(l => l.status === "New").length.toString(), color: "from-sky-500 to-blue-600", icon: "✨" },
          { label: "Interested", value: leads.filter(l => l.status === "Interested").length.toString(), color: "from-emerald-500 to-teal-600", icon: "💚" },
          { label: "Follow Up", value: leads.filter(l => l.status === "Follow Up").length.toString(), color: "from-amber-500 to-orange-500", icon: "🔔" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Lead Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <LeadTable leads={leads} onOpenChat={handleOpenChat} />
      </div>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={isDrawerOpen} onClose={handleCloseChat} lead={selectedLead} />

      {/* Create Lead Modal */}
      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

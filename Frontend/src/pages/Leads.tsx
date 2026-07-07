import { useState, useEffect } from "react"
import { LeadTable } from "@/components/LeadTable"
import { ChatDrawer } from "@/components/ChatDrawer"
import { Lead } from "@/types"
import { useLeadStore } from "@/store/leadStore"
import { useSocketStore } from "@/store/socketStore"
import { useTeamStore } from "@/store/teamStore"
import { CreateLeadModal } from "@/components/CreateLeadModal"
import { Users } from "lucide-react"

export default function Leads() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { leads, total, fetchLeads, updateLead, teamFilter, setTeamFilter } = useLeadStore()
  const { connect, disconnect } = useSocketStore()
  const { teams, fetchTeams } = useTeamStore()

  useEffect(() => {
    fetchLeads()
    fetchTeams()
    connect()
    return () => { disconnect() }
  }, [fetchLeads, fetchTeams, connect, disconnect])

  const handleOpenChat = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDrawerOpen(true)
    if ((lead.unreadCount ?? 0) > 0) {
      updateLead(lead._id, { unreadCount: 0 })
    }
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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

      {/* Team Filter Bar */}
      {teams.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Users size={13} /> Filter by Team:
          </span>
          <button
            onClick={() => setTeamFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !teamFilter
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Teams
          </button>
          {teams.map(team => (
            <button
              key={team._id}
              onClick={() => setTeamFilter(teamFilter === team._id ? '' : team._id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                teamFilter === team._id ? 'text-white' : 'text-white/80 hover:opacity-100'
              }`}
              style={{
                backgroundColor: teamFilter === team._id ? team.color : `${team.color}99`,
              }}
            >
              <Users size={10} />
              {team.name}
              {team.leadCount ? <span className="ml-0.5 opacity-80">({team.leadCount})</span> : null}
            </button>
          ))}
        </div>
      )}

      {/* Lead Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <LeadTable leads={leads} onOpenChat={handleOpenChat} onLeadUpdate={updateLead} />
      </div>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={isDrawerOpen} onClose={handleCloseChat} lead={selectedLead} onLeadUpdate={updateLead} />

      {/* Create Lead Modal */}
      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

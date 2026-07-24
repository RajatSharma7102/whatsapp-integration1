import { useState, useEffect } from "react"
import { LeadTable } from "@/components/LeadTable"
import { ChatDrawer } from "@/components/ChatDrawer"
import { Lead } from "@/types"
import { useLeadStore } from "@/store/leadStore"
import { useSocketStore } from "@/store/socketStore"
import { useTeamStore } from "@/store/teamStore"
import { CreateLeadModal } from "@/components/CreateLeadModal"
import { EmailDrawer } from "@/components/Email/EmailDrawer"
import {
  Users, TrendingUp, Target, Clock, AlertCircle,
  UserX, Zap, BarChart3, Plus, Filter, ChevronDown
} from "lucide-react"

const STAGES = [
  "New Query", "Assigned", "Contacted", "Qualified",
  "Demo Scheduled", "Proposal Sent", "Negotiation",
  "Decision Pending", "Won / Converted", "Lost", "On Hold",
  "Not Interested", "Callback Requested"
]

export default function Leads() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [emailLead, setEmailLead] = useState<Lead | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"own" | "team" | "all">("all")

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
    if ((lead.unreadCount ?? 0) > 0) updateLead(lead._id, { unreadCount: 0 })
  }

  const handleCloseChat = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedLead(null), 300)
  }

  const handleOpenEmail = (lead: Lead) => {
    setEmailLead(lead)
    setIsEmailDrawerOpen(true)
  }

  const handleCloseEmail = () => {
    setIsEmailDrawerOpen(false)
    setTimeout(() => setEmailLead(null), 300)
  }

  // Stage counts
  const stageCounts: Record<string, number> = {}
  leads.forEach(l => {
    stageCounts[l.status] = (stageCounts[l.status] || 0) + 1
  })

  const newCount = leads.filter(l => l.status === "New").length
  const qualifiedCount = leads.filter(l => l.status === "Qualified").length
  const unassignedCount = leads.filter(l => !l.assignedTo).length

  const stats = [
    { label: "Total Queries", value: total.toString(), icon: BarChart3, iconBg: "bg-slate-800", iconColor: "text-white" },
    { label: "New Queries", value: newCount.toString(), icon: Zap, iconBg: "bg-violet-600", iconColor: "text-white" },
    { label: "Qualified", value: qualifiedCount.toString(), icon: Target, iconBg: "bg-blue-600", iconColor: "text-white" },
    { label: "Unassigned", value: unassignedCount.toString(), icon: UserX, iconBg: "bg-orange-500", iconColor: "text-white" },
    { label: "Open Queries", value: leads.filter(l => l.isActive).length.toString(), icon: Zap, iconBg: "bg-orange-500", iconColor: "text-white" },
    { label: "Follow Up", value: leads.filter(l => l.status === "Follow Up").length.toString(), icon: Clock, iconBg: "bg-blue-600", iconColor: "text-white" },
    { label: "Interested", value: leads.filter(l => l.status === "Interested").length.toString(), icon: TrendingUp, iconBg: "bg-emerald-600", iconColor: "text-white" },
    { label: "Teams Active", value: teams.length.toString(), icon: Users, iconBg: "bg-violet-600", iconColor: "text-white" },
  ]

  return (
    <>
      {/* ── Header Row ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Query Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track and manage all your queries in one place</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #ec4899)' }}
        >
          <Plus size={16} /> New Query
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className={`h-9 w-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
              <stat.icon size={16} className={stat.iconColor} />
            </div>
            <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{stat.value}</p>
            <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Stage Pipeline ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stages</span>
            <span className="text-xs text-slate-400">{leads.length} matching queries</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
          {STAGES.map(stage => (
            <div key={stage} className="flex items-center justify-between py-1.5 border-b border-slate-100 group">
              <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors truncate pr-2">{stage}</span>
              <span className="text-sm font-bold text-slate-800 shrink-0">{stageCounts[stage] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs + Team Filter ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0 border-b border-slate-100">
          <div className="flex items-center gap-1">
            {[
              { key: "own", label: "Own Queries", count: leads.length },
              { key: "team", label: "My Team", count: leads.length },
              { key: "all", label: "All Queries", count: total },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
                  activeTab === tab.key
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Team filter pills */}
          {teams.length > 0 && (
            <div className="flex items-center gap-1.5 pb-2">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Users size={11} /> Team:
              </span>
              <button
                onClick={() => setTeamFilter('')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  !teamFilter ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >All</button>
              {teams.map(team => (
                <button
                  key={team._id}
                  onClick={() => setTeamFilter(teamFilter === team._id ? '' : team._id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: teamFilter === team._id ? team.color : `${team.color}99` }}
                >
                  {team.name} {team.leadCount ? `(${team.leadCount})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lead Table */}
        <LeadTable leads={leads} onOpenChat={handleOpenChat} onOpenEmail={handleOpenEmail} onLeadUpdate={updateLead} />
      </div>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={isDrawerOpen} onClose={handleCloseChat} lead={selectedLead} onLeadUpdate={updateLead} />

      {/* Create Lead Modal */}
      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Email Drawer */}
      <EmailDrawer isOpen={isEmailDrawerOpen} onClose={handleCloseEmail} lead={emailLead} />
    </>
  )
}

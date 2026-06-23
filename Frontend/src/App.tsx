import React, { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { LeadTable } from "@/components/LeadTable"
import { ChatDrawer } from "@/components/ChatDrawer"
import { Lead } from "@/types"
import { useLeadStore } from "@/store/leadStore"
import { useSocketStore } from "@/store/socketStore"
import { useAuthStore } from "@/store/authStore"
import { AuthRoute } from "@/components/AuthRoute"
import { CreateLeadModal } from "@/components/CreateLeadModal"
import Login from "@/pages/Login"
import { LogOut } from "lucide-react"

function Dashboard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { leads, total, fetchLeads } = useLeadStore()
  const { connect, disconnect } = useSocketStore()
  const { user, logout } = useAuthStore()

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">MB</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">Marketing Bugs</span>
              <span className="ml-2 text-xs text-slate-400 font-medium hidden sm:inline">CRM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">
              Welcome back, <span className="font-medium text-slate-700">{user?.name || 'User'}</span>
            </span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <button onClick={logout} className="ml-2 p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage and track your leads from all sources in one place.</p>
          </div>
          {/* Create Lead Button will go here */}
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
      </main>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={isDrawerOpen} onClose={handleCloseChat} lead={selectedLead} />

      {/* Create Lead Modal */}
      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App

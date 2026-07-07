import React, { useState } from 'react'
import { useTeamStore } from '@/store/teamStore'
import { useLeadStore } from '@/store/leadStore'
import { Team } from '@/types'
import { leadService } from '@/services/lead.service'
import { Loader2, Trash2, Edit2, X, Check, Users, Plus } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface TeamModalProps {
  team?: Team | null
  onClose: () => void
}

function TeamModal({ team, onClose }: TeamModalProps) {
  const { createTeam, updateTeam } = useTeamStore()
  const [name, setName] = useState(team?.name || '')
  const [description, setDescription] = useState(team?.description || '')
  const [color, setColor] = useState(team?.color || '#6366f1')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (team) {
        await updateTeam(team._id, { name, description, color })
      } else {
        await createTeam({ name, description, color })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{team ? 'Edit Team' : 'Create Team'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Support Team"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this team handle?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Team Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#1e293b' : 'transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-500">Preview:</span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              <Users size={10} />
              {name || 'Team Name'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {team ? 'Save Changes' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TeamsSection() {
  const { teams, loading, fetchTeams, deleteTeam } = useTeamStore()
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  React.useEffect(() => { fetchTeams() }, [fetchTeams])

  const handleDelete = async (team: Team) => {
    if (!window.confirm(`Delete "${team.name}"? Leads assigned to this team will be unassigned.`)) return
    setDeletingId(team._id)
    try {
      await deleteTeam(team._id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Teams</h2>
          <p className="text-sm text-slate-500">Create teams and assign leads to specific groups.</p>
        </div>
        <button
          onClick={() => { setEditingTeam(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Team
        </button>
      </div>

      {loading && teams.length === 0 ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-500 text-sm">No teams yet. Create one to get started.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {teams.map(team => (
            <li key={team._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${team.color}20` }}>
                  <Users size={18} style={{ color: team.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name}
                    </span>
                    <span className="text-xs text-slate-400">{team.leadCount ?? 0} leads</span>
                  </div>
                  {team.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{team.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingTeam(team); setShowModal(true) }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(team)}
                  disabled={deletingId === team._id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === team._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <TeamModal
          team={editingTeam}
          onClose={() => { setShowModal(false); setEditingTeam(null) }}
        />
      )}
    </div>
  )
}

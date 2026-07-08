import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Users, X, MessageCircle, Phone } from "lucide-react"
import { WhatsAppButton } from "@/components/WhatsAppButton"
import { Lead } from "@/types"
import { useTeamStore } from "@/store/teamStore"
import { leadService } from "@/services/lead.service"

interface LeadRowProps {
  lead: Lead
  onOpenChat: (lead: Lead) => void
  onLeadUpdate?: (id: string, updates: Partial<Lead>) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  New:              { label: "New Lead",     className: "bg-sky-50 text-sky-700 border-sky-200" },
  Interested:       { label: "Interested",   className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Follow Up":      { label: "Follow Up",    className: "bg-amber-50 text-amber-700 border-amber-200" },
  Qualified:        { label: "Qualified",    className: "bg-violet-50 text-violet-700 border-violet-200" },
  Closed:           { label: "Closed",       className: "bg-slate-100 text-slate-500 border-slate-200" },
  Assigned:         { label: "Assigned",     className: "bg-blue-50 text-blue-700 border-blue-200" },
  Contacted:        { label: "Contacted",    className: "bg-teal-50 text-teal-700 border-teal-200" },
  "Demo Scheduled": { label: "Demo",         className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "Proposal Sent":  { label: "Proposal",     className: "bg-purple-50 text-purple-700 border-purple-200" },
  Negotiation:      { label: "Negotiation",  className: "bg-orange-50 text-orange-700 border-orange-200" },
  Lost:             { label: "Lost",         className: "bg-red-50 text-red-600 border-red-200" },
  Won:              { label: "Won ✓",        className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
}

const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
  Website:   { label: "Website",   color: "text-violet-700", bg: "bg-violet-50" },
  WhatsApp:  { label: "WhatsApp",  color: "text-emerald-700", bg: "bg-emerald-50" },
  Facebook:  { label: "Facebook",  color: "text-blue-700", bg: "bg-blue-50" },
  Instagram: { label: "Instagram", color: "text-pink-700", bg: "bg-pink-50" },
  Google:    { label: "Google",    color: "text-amber-700", bg: "bg-amber-50" },
  Manual:    { label: "Manual",    color: "text-slate-600", bg: "bg-slate-50" },
}

export function LeadRow({ lead, onOpenChat, onLeadUpdate }: LeadRowProps) {
  const { teams, fetchTeams } = useTeamStore()
  const status = statusConfig[lead.status] || { label: lead.status, className: "bg-slate-100 text-slate-600 border-slate-200" }
  const source = sourceConfig[lead.source] ?? { label: lead.source, color: "text-slate-600", bg: "bg-slate-50" }
  const createdDate = new Date(lead.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })

  const handleAssignTeam = async (teamId: string | null) => {
    try {
      await leadService.updateLead(lead._id, { teamId } as any)
      const teamObj = teamId ? teams.find(t => t._id === teamId) || null : null
      onLeadUpdate?.(lead._id, { teamId: teamObj })
      fetchTeams()
    } catch (e) {
      console.error("Failed to assign team", e)
    }
  }

  return (
    <TableRow className="group hover:bg-violet-50/30 transition-colors border-b border-slate-100 last:border-0">

      {/* Name */}
      <TableCell className="pl-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name.replace(" ", "")}`} />
            <AvatarFallback className="text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {lead.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">{lead.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-[11px] text-slate-400">{lead.assignedTo?.name || "Unassigned"}</p>
              {lead.teamId && typeof lead.teamId === 'object' && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: lead.teamId.color }}
                >
                  <Users size={8} />
                  {lead.teamId.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Contact */}
      <TableCell className="py-3 hidden md:table-cell">
        <div className="space-y-0.5">
          {lead.phone && (
            <p className="text-xs text-slate-600 font-mono flex items-center gap-1">
              <Phone size={10} className="text-slate-400" />
              {lead.phone}
            </p>
          )}
          {lead.email && (
            <p className="text-xs text-slate-400 truncate max-w-[160px]">{lead.email}</p>
          )}
        </div>
      </TableCell>

      {/* Source */}
      <TableCell className="py-3 hidden md:table-cell">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${source.color} ${source.bg}`}>
          {source.label}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-3">
        <Badge className={`${status.className} text-[11px] font-semibold border px-2 py-0.5 rounded-lg`}>
          {status.label}
        </Badge>
      </TableCell>

      {/* Created */}
      <TableCell className="py-3 hidden lg:table-cell">
        <span className="text-xs text-slate-400">{createdDate}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3 pr-5 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <WhatsAppButton lead={lead} onClick={() => onOpenChat(lead)} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">

              {teams.length > 0 && (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-sm">
                      <Users className="h-3.5 w-3.5 text-violet-500" />
                      <span>Assign Team</span>
                      {lead.teamId && typeof lead.teamId === 'object' && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: lead.teamId.color }}>
                          {lead.teamId.name}
                        </span>
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44">
                      {lead.teamId && (
                        <>
                          <DropdownMenuItem onClick={() => handleAssignTeam(null)} className="gap-2 text-sm text-slate-500">
                            <X className="h-3.5 w-3.5" /> Remove Team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {teams.map(team => (
                        <DropdownMenuItem key={team._id} onClick={() => handleAssignTeam(team._id)}
                          className="gap-2 text-sm font-medium">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                          {team.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem className="gap-2 text-sm">
                <Edit className="h-3.5 w-3.5" /> Edit Lead
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-sm text-red-600 focus:text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

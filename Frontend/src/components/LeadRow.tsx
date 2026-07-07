import React, { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Users, X } from "lucide-react"
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
  New: {
    label: "New",
    className: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
  Interested: {
    label: "Interested",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  "Follow Up": {
    label: "Follow Up",
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  Closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
  },
}

const sourceConfig: Record<string, { emoji: string; color: string }> = {
  Website: { emoji: "🌐", color: "text-violet-600" },
  WhatsApp: { emoji: "💬", color: "text-emerald-600" },
  Facebook: { emoji: "📘", color: "text-blue-600" },
  Instagram: { emoji: "📸", color: "text-pink-600" },
  Google: { emoji: "🔍", color: "text-amber-600" },
}

export function LeadRow({ lead, onOpenChat, onLeadUpdate }: LeadRowProps) {
  const { teams } = useTeamStore()
  const status = statusConfig[lead.status] || { label: lead.status, className: "bg-slate-100 text-slate-600" }
  const source = sourceConfig[lead.source] ?? { emoji: "📋", color: "text-slate-600" }
  const createdDate = new Date(lead.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const handleAssignTeam = async (teamId: string | null) => {
    try {
      await leadService.updateLead(lead._id, { teamId } as any)
      const teamObj = teamId ? teams.find(t => t._id === teamId) || null : null
      onLeadUpdate?.(lead._id, { teamId: teamObj })
    } catch (e) {
      console.error("Failed to assign team", e)
    }
  }

  return (
    <TableRow className="group hover:bg-slate-50/70 transition-colors border-slate-100">
      {/* Name */}
      <TableCell className="pl-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name.replace(" ", "")}`} />
            <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 font-semibold text-sm">
              {lead.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">{lead.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
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

      {/* Email */}
      <TableCell className="py-4">
        <a href={`mailto:${lead.email}`} className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
          {lead.email}
        </a>
      </TableCell>

      {/* Phone */}
      <TableCell className="py-4 hidden sm:table-cell">
        <span className="text-sm text-slate-600 font-mono">{lead.phone}</span>
      </TableCell>

      {/* Source */}
      <TableCell className="py-4 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{source.emoji}</span>
          <span className={`text-sm font-medium ${source.color}`}>{lead.source}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4">
        <Badge className={`${status.className} text-xs font-semibold border px-2.5 py-0.5`}>
          {status.label}
        </Badge>
      </TableCell>

      {/* Created Date */}
      <TableCell className="py-4 hidden lg:table-cell">
        <span className="text-sm text-slate-500">{createdDate}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-4 pr-6 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <WhatsAppButton lead={lead} onClick={() => onOpenChat(lead)} />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">

              {/* Assign Team submenu */}
              {teams.length > 0 && (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-sm">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Assign Team</span>
                      {lead.teamId && typeof lead.teamId === 'object' && (
                        <span
                          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: lead.teamId.color }}
                        >
                          {lead.teamId.name}
                        </span>
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44">
                      {lead.teamId && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleAssignTeam(null)}
                            className="gap-2 text-sm text-slate-500"
                          >
                            <X className="h-3.5 w-3.5" /> Remove Team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {teams.map(team => (
                        <DropdownMenuItem
                          key={team._id}
                          onClick={() => handleAssignTeam(team._id)}
                          className="gap-2 text-sm font-medium"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: team.color }}
                          />
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

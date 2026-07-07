import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LeadRow } from "@/components/LeadRow"
import { Lead } from "@/types"

interface LeadTableProps {
  leads: Lead[]
  onOpenChat: (lead: Lead) => void
  onLeadUpdate?: (id: string, updates: Partial<Lead>) => void
}

export function LeadTable({ leads, onOpenChat, onLeadUpdate }: LeadTableProps) {
  return (
    <div>
      {/* Table Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-800 text-base">All Leads</h2>
          <p className="text-xs text-slate-400 mt-0.5">{leads.length} leads found</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            + Add Lead
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide pl-6">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Phone</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Source</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadRow key={lead._id} lead={lead} onOpenChat={onOpenChat} onLeadUpdate={onLeadUpdate} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

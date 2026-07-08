import React from "react"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { LeadRow } from "@/components/LeadRow"
import { Lead } from "@/types"
import { Search, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { useLeadStore } from "@/store/leadStore"

interface LeadTableProps {
  leads: Lead[]
  onOpenChat: (lead: Lead) => void
  onLeadUpdate?: (id: string, updates: Partial<Lead>) => void
}

export function LeadTable({ leads, onOpenChat, onLeadUpdate }: LeadTableProps) {
  const [search, setSearch] = useState("")
  const { setFilters } = useLeadStore()

  const handleSearch = (val: string) => {
    setSearch(val)
    setFilters({ search: val })
  }

  return (
    <div>
      {/* Table toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, phone..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{leads.length} leads</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-medium transition-colors">
            <SlidersHorizontal size={13} /> Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-100">
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-5 py-3">Name</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 hidden md:table-cell">Contact</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 hidden md:table-cell">Source</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Status</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right pr-5 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <LeadRow key={lead._id} lead={lead} onOpenChat={onOpenChat} onLeadUpdate={onLeadUpdate} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

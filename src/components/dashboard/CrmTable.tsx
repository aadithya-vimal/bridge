import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Plus, TrendingUp } from "lucide-react";

interface CrmTableProps {
  leads: any[] | undefined;
  onOpenModal: (mode: "create" | "edit", data?: any) => void;
}

export function CrmTable({ leads, onOpenModal }: CrmTableProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Active Opportunities</CardTitle>
        <Button 
          size="sm" 
          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          onClick={() => onOpenModal("create")}
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Add Opportunity
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">Client</TableHead>
              <TableHead className="text-zinc-500">Stage</TableHead>
              <TableHead className="text-zinc-500">Value</TableHead>
              <TableHead className="text-zinc-500">Probability</TableHead>
              <TableHead className="text-right text-zinc-500">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads === undefined ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                      <TrendingUp className="w-6 h-6 text-zinc-600" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">No active opportunities</p>
                    <p className="text-xs text-zinc-500 mt-1">New leads will appear here.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.map((lead) => (
              <TableRow key={lead._id} className="border-white/5 hover:bg-white/5 group">
                <TableCell className="font-medium text-zinc-200">{lead.client_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    {lead.stage}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(lead.value)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${lead.win_probability > 80 ? 'bg-emerald-500' : lead.win_probability < 50 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                        style={{ width: `${lead.win_probability}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">{lead.win_probability}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-400 hover:text-white"
                    onClick={() => onOpenModal("edit", lead)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
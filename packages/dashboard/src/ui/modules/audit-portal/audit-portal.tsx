"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSecurity } from "@/application/hooks/use-security";
import { Input } from "@/ui/components/input";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { Button } from "@/ui/components/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/ui/components/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/ui/components/table";
import {
    Search,
    User,
    Clock,
    Filter,
    ShieldAlert,
    ShieldCheck
} from "lucide-react";
// Removed shadcn pagination imports for a simpler manual implementation

interface AuditPortalProps {
    orgId: string;
    projectId?: string;
}

function TimestampCell({ date }: { date: string | Date }) {
    const [showFull, setShowFull] = useState(false);
    const d = new Date(date);
    
    return (
        <TableCell 
            className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-muted/30 transition-colors select-none group"
            onClick={() => setShowFull(!showFull)}
            title={showFull ? "Click to see relative time" : d.toLocaleString()}
        >
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
                <Clock className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                {showFull ? d.toLocaleString() : formatDistanceToNow(d, { addSuffix: true })}
            </div>
        </TableCell>
    );
}

export function AuditPortal({ orgId, projectId }: AuditPortalProps) {
    const {
        auditLogs,
        auditMetadata,
        isLogsLoading,
        auditAction,
        setAuditAction,
        page,
        setPage
    } = useSecurity(orgId, projectId);

    return (
        <div className="space-y-6">
            {/* Status & Filter Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-muted/30 border border-border p-3 rounded-xl mb-6">
                <div className="flex items-start gap-4 flex-1">
                    <div className="mt-0.5 p-2 rounded-lg bg-background border border-border shrink-0">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-xs font-bold text-foreground">Database Persistence Active</h3>
                        <p className="text-[10px] text-muted-foreground leading-tight font-medium max-w-2xl">
                            System activities are being logged to the secure vault for permanent auditing. 
                            Records are immutable and cryptographically protected for forensic integrity.
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-4">
                    <Select value={auditAction} onValueChange={setAuditAction}>
                        <SelectTrigger className="h-9 w-full lg:w-[220px] bg-background border-border rounded-lg text-xs font-semibold hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
                                <SelectValue placeholder="All Activities" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-border">
                            <SelectItem value="all" className="text-xs">All Activities</SelectItem>
                            <SelectItem value="SECRET_READ" className="text-xs">Secret Read</SelectItem>
                            <SelectItem value="SECRET_WRITE" className="text-xs">Secret Write</SelectItem>
                            <SelectItem value="KEY_ROTATION" className="text-xs">Key Rotation</SelectItem>
                            <SelectItem value="ORG_UPDATE" className="text-xs">Organization Updated</SelectItem>
                            <SelectItem value="PROJECT_CREATE" className="text-xs">Project Create</SelectItem>
                            <SelectItem value="PROJECT_DELETE" className="text-xs">Project Delete</SelectItem>
                            <SelectItem value="ENVIRONMENT_CREATE" className="text-xs">Environment Create</SelectItem>
                            <SelectItem value="ENVIRONMENT_DELETE" className="text-xs">Environment Delete</SelectItem>
                            <SelectItem value="SERVICE_CREATE" className="text-xs">Service Create</SelectItem>
                            <SelectItem value="SERVICE_DELETE" className="text-xs">Service Delete</SelectItem>
                            <SelectItem value="MCP_TOKEN_GENERATE" className="text-xs">Agent Created</SelectItem>
                            <SelectItem value="MCP_TOKEN_REVOKE" className="text-xs">Agent Revoked</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Forensic Data Table */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs uppercase font-bold px-6 h-12 w-[220px]">Timestamp</TableHead>
                            <TableHead className="text-xs uppercase font-bold px-6 h-12">Actor</TableHead>
                            <TableHead className="text-xs uppercase font-bold px-6 h-12">Action</TableHead>
                            <TableHead className="text-xs uppercase font-bold px-6 h-12 text-right">Severity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLogsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-60" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <>
                                {auditLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                                <ShieldAlert className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-sm font-medium text-muted-foreground">No logs found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {auditLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                        <TimestampCell date={log.timestamp} />
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{log.actorName}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold">{log.action.replace("_", " ")}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 h-4 shadow-none">
                                                        {log.targetType}
                                                    </Badge>
                                                    {log.metadata?.envId && (
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 border-indigo-500/20 bg-indigo-500/5 text-indigo-500 shadow-none">
                                                            {log.envName ? `ENV: ${log.envName}` : (log.metadata.envId.length > 8 ? `ENV: ${log.metadata.envId.slice(0, 4)}` : `ENV: ${log.metadata.envId}`)}
                                                        </Badge>
                                                    )}
                                                    {log.metadata?.serviceId && (
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 shadow-none">
                                                            {log.serviceName ? `SVC: ${log.serviceName}` : "SVC"}
                                                        </Badge>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">{log.targetId}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <Badge className={`text-[10px] font-bold ${log.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                log.severity === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {log.severity}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Simplified Pagination Controls */}
            {!isLogsLoading && auditMetadata.total > 0 && (
                <div className="flex items-center justify-between gap-4 px-2 py-2">
                    <p className="text-xs text-muted-foreground">
                        Showing <span className="font-semibold">{Math.min(auditMetadata.total, (page - 1) * 10 + 1)}</span> to <span className="font-semibold">{Math.min(page * 10, auditMetadata.total)}</span> of <span className="font-semibold">{auditMetadata.total}</span> logs
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="h-8 w-8 p-0"
                        >
                            {"<"}
                        </Button>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-medium px-2 py-1 bg-muted rounded-md min-w-[32px] text-center">
                                {page}
                            </span>
                            <span className="text-sm text-muted-foreground mx-1">/</span>
                            <span className="text-sm text-muted-foreground">
                                {auditMetadata.totalPages}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === auditMetadata.totalPages}
                            onClick={() => setPage(page + 1)}
                            className="h-8 w-8 p-0"
                        >
                            {">"}
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}

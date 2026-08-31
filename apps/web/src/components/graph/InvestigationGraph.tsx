"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
  EdgeMouseHandler,
  MarkerType,
} from "@xyflow/react";
import {
  Layers,
  Filter,
  Search,
  Maximize2,
  X,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ShieldAlert,
  GitFork,
} from "lucide-react";
import { AccountNode, DeviceNode, EntityNode } from "./CustomNodes";
import { TransactionEdge } from "./CustomEdges";
import { RiskBadge } from "@/components/RiskBadge";
import { MoneyHopResponse, AccountSummaryResponse } from "@tracefuse/shared";
import { FollowMoneyController } from "./FollowMoneyController";

const nodeTypes = {
  account: AccountNode,
  device: DeviceNode,
  person: EntityNode,
  merchant: EntityNode,
  default: AccountNode,
};

const edgeTypes = {
  transaction: TransactionEdge,
  default: TransactionEdge,
};

interface InvestigationGraphProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  investigationId?: string;
  accounts?: AccountSummaryResponse[];
  className?: string;
}

export const InvestigationGraph: React.FC<InvestigationGraphProps> = ({
  initialNodes,
  initialEdges,
  investigationId,
  accounts = [],
  className = "",
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showDevices, setShowDevices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFollowMoney, setShowFollowMoney] = useState(false);

  // Active path highlight state
  const [activeHop, setActiveHop] = useState<MoneyHopResponse | null>(null);
  const [allHops, setAllHops] = useState<MoneyHopResponse[]>([]);

  const getAccountName = (accId: string) => {
    const found = accounts.find((a) => a.id === accId);
    return found?.holder_name || accId;
  };

  // Filter nodes & edges based on visibility toggles, search query, and active path highlights
  const filteredNodes = useMemo(() => {
    const hopAccountIds = new Set<string>();
    if (activeHop) {
      hopAccountIds.add(activeHop.from_account_id);
      hopAccountIds.add(activeHop.to_account_id);
    }

    return initialNodes
      .filter((node) => {
        if (!showDevices && node.type === "device") {
          return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const label = String(node.data?.label || "").toLowerCase();
          const id = String(node.id).toLowerCase();
          const holder = String(node.data?.holder_name || "").toLowerCase();
          return label.includes(q) || id.includes(q) || holder.includes(q);
        }
        return true;
      })
      .map((node) => {
        const isHopActive = hopAccountIds.has(node.id);
        return {
          ...node,
          selected: isHopActive ? true : node.selected,
        };
      });
  }, [initialNodes, showDevices, searchQuery, activeHop]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

    return initialEdges
      .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map((edge) => {
        // Check if edge is active hop
        const isCurrentHop =
          activeHop &&
          ((edge.source === activeHop.from_account_id && edge.target === activeHop.to_account_id) ||
            edge.id.includes(activeHop.transaction_id));

        const isPathEdge = allHops.some(
          (h) =>
            (edge.source === h.from_account_id && edge.target === h.to_account_id) ||
            edge.id.includes(h.transaction_id)
        );

        return {
          ...edge,
          animated: Boolean(isCurrentHop || isPathEdge),
          data: {
            ...(edge.data || {}),
            is_highlighted: Boolean(isCurrentHop),
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCurrentHop ? "#1F3A5F" : "#627d98",
            width: 16,
            height: 16,
          },
          style: {
            stroke: isCurrentHop ? "#1F3A5F" : isPathEdge ? "#334e68" : "#829ab1",
            strokeWidth: isCurrentHop ? 4 : isPathEdge ? 2.5 : 2,
          },
        };
      });
  }, [initialEdges, filteredNodes, activeHop, allHops]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const closeSidebar = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleHopSelect = (hop: MoneyHopResponse | null, hops: MoneyHopResponse[]) => {
    setActiveHop(hop);
    setAllHops(hops);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-border-warm rounded-xl shadow-sm text-xs font-sans">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter node or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-border-warm rounded-lg text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy text-xs w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Toggle Device Nodes */}
          <button
            onClick={() => setShowDevices(!showDevices)}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showDevices
                ? "bg-navy-subtle text-navy border border-navy/20"
                : "bg-slate-50 text-ink-secondary border border-border-warm hover:text-ink-primary"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{showDevices ? "Hardware Nodes (ON)" : "Hardware Nodes (OFF)"}</span>
          </button>

          {/* Follow Money Controller Toggle */}
          {investigationId && (
            <button
              onClick={() => setShowFollowMoney(!showFollowMoney)}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showFollowMoney
                  ? "bg-navy text-white shadow-sm"
                  : "bg-slate-50 text-ink-secondary border border-border-warm hover:text-ink-primary"
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Trace Money Trail</span>
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-ink-secondary font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-severity-critical" />
            <span>Critical Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-severity-suspicious" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-navy" />
            <span>Standard Node</span>
          </div>
        </div>
      </div>

      {/* Optional In-Graph Follow Money Controller */}
      {showFollowMoney && investigationId && (
        <FollowMoneyController
          investigationId={investigationId}
          accounts={accounts}
          onHopSelect={handleHopSelect}
        />
      )}

      {/* Main Canvas Area */}
      <div className="relative w-full h-[620px] bg-linen border border-border-warm rounded-2xl overflow-hidden shadow-sm">
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.0}
        >
          <Background color="#E5E0D6" gap={20} size={1} />
          <Controls className="!left-3 !bottom-3 !top-auto" />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "device") return "#829ab1";
              const sev = (n.data?.severity as string)?.toLowerCase();
              if (sev === "critical") return "#8C2F2F";
              if (sev === "high") return "#B8792F";
              if (sev === "medium") return "#B8792F";
              return "#1F3A5F";
            }}
            maskColor="rgba(247, 244, 238, 0.7)"
            className="!right-3 !bottom-3"
          />
        </ReactFlow>

        {/* Entity Inspection Drawer */}
        {selectedNode && (
          <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-border-warm rounded-xl p-5 shadow-xl z-20 flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-border-warm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-secondary font-medium">
                  Entity Inspector
                </div>
                <h4 className="text-base font-bold text-ink-primary font-serif mt-0.5">
                  {String(selectedNode.data?.holder_name || selectedNode.data?.label || selectedNode.id)}
                </h4>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  ID: {selectedNode.id}
                </div>
              </div>
              <button
                onClick={closeSidebar}
                className="p-1 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-sans">
              {/* Risk & Identifier Info */}
              <div className="p-3 bg-slate-50 rounded-lg border border-border-warm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary text-[11px]">Node Type:</span>
                  <span className="text-navy uppercase font-semibold text-[11px]">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary text-[11px]">Account ID:</span>
                  <span className="font-mono text-ink-primary font-medium">{selectedNode.id}</span>
                </div>
                {Boolean((selectedNode.data as Record<string, any>)?.severity) && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-ink-secondary text-[11px]">Risk Level:</span>
                    <RiskBadge level={String((selectedNode.data as Record<string, any>).severity)} showScore={false} />
                  </div>
                )}
              </div>

              {/* Account Specific Info */}
              {selectedNode.type === "account" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-border-warm space-y-1.5 text-[11px]">
                    <div className="text-ink-secondary">Account Number:</div>
                    <div className="text-ink-primary font-semibold font-mono">
                      {String(selectedNode.data?.account_number || "AC-99482910")}
                    </div>
                    <div className="text-ink-secondary pt-1">Account Type:</div>
                    <div className="text-ink-primary capitalize font-medium">
                      {String(selectedNode.data?.account_type || "Savings")}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-navy-subtle border border-navy/15 text-ink-primary text-xs leading-relaxed">
                    <span className="font-semibold text-navy">Topological Context: </span>
                    Identified as a critical transit node within the multi-hop fund dispersion flow.
                  </div>
                </div>
              )}

              {/* Device Specific Info */}
              {selectedNode.type === "device" && (
                <div className="p-3 rounded-lg bg-slate-50 border border-border-warm text-xs space-y-2">
                  <div className="font-semibold text-navy flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Shared Hardware Binding
                  </div>
                  <p className="text-ink-secondary leading-relaxed font-sans">
                    Fingerprint correlated with multiple mule accounts operating concurrently across the syndicate.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edge Inspection Drawer */}
        {selectedEdge && (
          <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-border-warm rounded-xl p-5 shadow-xl z-20 flex flex-col animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-border-warm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-secondary font-medium">
                  Transaction Edge Inspector
                </div>
                <h4 className="text-base font-bold text-ink-primary font-serif mt-0.5">
                  Transaction Flow
                </h4>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {String(selectedEdge.id)}
                </div>
              </div>
              <button
                onClick={closeSidebar}
                className="p-1 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs font-sans">
              <div className="p-3 bg-slate-50 rounded-lg border border-border-warm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary">Transfer Amount:</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    ₹{Number(selectedEdge.data?.amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex flex-col pt-1 border-t border-border-warm">
                  <span className="text-ink-secondary text-[11px]">Source Account:</span>
                  <span className="font-semibold text-slate-900">{getAccountName(selectedEdge.source)}</span>
                  <span className="font-mono text-[10px] text-slate-500">({selectedEdge.source})</span>
                </div>
                <div className="flex flex-col pt-1 border-t border-border-warm">
                  <span className="text-ink-secondary text-[11px]">Destination Account:</span>
                  <span className="font-semibold text-slate-900">{getAccountName(selectedEdge.target)}</span>
                  <span className="font-mono text-[10px] text-slate-500">({selectedEdge.target})</span>
                </div>
              </div>

              {Boolean((selectedEdge.data as Record<string, any>)?.timestamp) && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-border-warm text-[11px] text-ink-secondary font-mono">
                  Timestamp: <span className="text-ink-primary font-medium">{String((selectedEdge.data as Record<string, any>).timestamp)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

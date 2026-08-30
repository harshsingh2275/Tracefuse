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
} from "lucide-react";
import { AccountNode, DeviceNode, EntityNode } from "./CustomNodes";
import { TransactionEdge } from "./CustomEdges";
import { RiskBadge } from "@/components/RiskBadge";

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
  className?: string;
}

export const InvestigationGraph: React.FC<InvestigationGraphProps> = ({
  initialNodes,
  initialEdges,
  className = "",
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showDevices, setShowDevices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter nodes & edges based on visibility toggles and search query
  const filteredNodes = useMemo(() => {
    return initialNodes.filter((node) => {
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
    });
  }, [initialNodes, showDevices, searchQuery]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return initialEdges
      .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map((edge) => ({
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
          width: 16,
          height: 16,
        },
      }));
  }, [initialEdges, filteredNodes]);

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

  return (
    <div className={`relative w-full h-[650px] bg-[#0d121d] rounded-xl border border-[#1f293d] overflow-hidden shadow-2xl ${className}`}>
      {/* Top Filter & Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Filter Group */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#111622]/90 backdrop-blur-md border border-[#1f293d] p-1.5 rounded-xl shadow-lg">
          <div className="relative">
            <input
              type="text"
              placeholder="Search node ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#0a0d14] border border-[#1f293d] rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowDevices(!showDevices)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              showDevices
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-gray-800/60 text-gray-400 border-gray-700 hover:text-gray-200"
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>{showDevices ? "Hide Devices" : "Show Devices"}</span>
          </button>
        </div>

        {/* Legend Pill */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-[#111622]/90 backdrop-blur-md border border-[#1f293d] rounded-xl text-[11px] font-mono text-gray-400 pointer-events-auto shadow-lg">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical Node
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Shared Device
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Transaction Edge
          </span>
        </div>
      </div>

      {/* Main React Flow Canvas */}
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
        <Background color="#1f293d" gap={18} size={1} />
        <Controls className="!left-3 !bottom-3 !top-auto" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "device") return "#a855f7";
            const sev = (n.data?.severity as string)?.toLowerCase();
            if (sev === "critical") return "#ef4444";
            if (sev === "high") return "#f97316";
            if (sev === "medium") return "#f59e0b";
            return "#3b82f6";
          }}
          maskColor="rgba(10, 13, 20, 0.7)"
          className="!right-3 !bottom-3"
        />
      </ReactFlow>

      {/* Entity Inspection Drawer (Section 19) */}
      {selectedNode && (
        <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-[#111622]/95 backdrop-blur-md border border-[#1f293d] rounded-xl p-5 shadow-2xl z-20 flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-gray-800">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                Entity Inspector
              </div>
              <h4 className="text-base font-bold text-white font-mono mt-0.5">
                {String(selectedNode.data?.holder_name || selectedNode.data?.label || selectedNode.id)}
              </h4>
            </div>
            <button
              onClick={closeSidebar}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs font-sans">
            {/* Risk & Identifier Info */}
            <div className="p-3 bg-[#0a0d14] rounded-lg border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-[11px]">Node Type:</span>
                <span className="font-mono text-blue-400 uppercase font-semibold">
                  {selectedNode.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-[11px]">Node ID:</span>
                <span className="font-mono text-gray-200">{selectedNode.id}</span>
              </div>
              {Boolean((selectedNode.data as Record<string, any>)?.severity) && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-400 font-mono text-[11px]">Risk Level:</span>
                  <RiskBadge level={String((selectedNode.data as Record<string, any>).severity)} showScore={false} />
                </div>
              )}
            </div>

            {/* Account Specific Info */}
            {selectedNode.type === "account" && (
              <div className="space-y-3">
                <div className="p-3 bg-[#0a0d14] rounded-lg border border-gray-800 space-y-1.5 font-mono text-[11px]">
                  <div className="text-gray-400">Account Number:</div>
                  <div className="text-white font-semibold">
                    {String(selectedNode.data?.account_number || "AC-99482910")}
                  </div>
                  <div className="text-gray-400 pt-1">Account Type:</div>
                  <div className="text-gray-200 capitalize">
                    {String(selectedNode.data?.account_type || "Savings")}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-gray-300 text-[11px] leading-relaxed">
                  <span className="font-semibold text-blue-400">Topological Context: </span>
                  Identified as a critical transit node within the multi-hop fund dispersion flow.
                </div>
              </div>
            )}

            {/* Device Specific Info */}
            {selectedNode.type === "device" && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] space-y-2">
                <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Shared Hardware Binding
                </div>
                <p className="text-gray-300 leading-relaxed font-sans">
                  Fingerprint correlated with multiple mule accounts operating concurrently across the syndicate.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edge Inspection Drawer */}
      {selectedEdge && (
        <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-[#111622]/95 backdrop-blur-md border border-[#1f293d] rounded-xl p-5 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-gray-800">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                Transaction Edge Inspector
              </div>
              <h4 className="text-base font-bold text-white font-mono mt-0.5">
                {String(selectedEdge.id)}
              </h4>
            </div>
            <button
              onClick={closeSidebar}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#0a0d14] rounded-lg border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-base font-bold text-emerald-400">
                  ₹{Number(selectedEdge.data?.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Source:</span>
                <span className="text-gray-200">{selectedEdge.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Destination:</span>
                <span className="text-gray-200">{selectedEdge.target}</span>
              </div>
            </div>

            {Boolean((selectedEdge.data as Record<string, any>)?.timestamp) && (
              <div className="p-2.5 bg-[#0a0d14] rounded-lg border border-gray-800 text-[11px] text-gray-400">
                Timestamp: <span className="text-white">{String((selectedEdge.data as Record<string, any>).timestamp)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

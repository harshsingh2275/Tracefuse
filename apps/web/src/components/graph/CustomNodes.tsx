import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  User,
  Smartphone,
  CreditCard,
  Building2,
  AlertOctagon,
  Flame,
  ShieldCheck,
  Fingerprint,
} from "lucide-react";

// Account Node Component
export const AccountNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const severity = (nodeData.severity || "low").toLowerCase();
  const label = nodeData.label || "Account";
  const holderName = nodeData.holder_name || label;
  const accountNumber = nodeData.account_number || "";
  const accountType = nodeData.account_type || "savings";
  const isSuspicious = severity === "critical" || severity === "high";

  let borderStyle = "border-[#1f293d] bg-[#111622]";
  let ringStyle = "";
  let badgeBg = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  let RiskIcon = ShieldCheck;

  if (severity === "critical") {
    borderStyle = "border-red-500/60 bg-[#1a0f14]";
    ringStyle = "shadow-[0_0_15px_rgba(239,68,68,0.25)]";
    badgeBg = "bg-red-500/20 text-red-400 border-red-500/40";
    RiskIcon = Flame;
  } else if (severity === "high") {
    borderStyle = "border-orange-500/60 bg-[#1c130e]";
    ringStyle = "shadow-[0_0_12px_rgba(249,115,22,0.2)]";
    badgeBg = "bg-orange-500/20 text-orange-400 border-orange-500/40";
    RiskIcon = AlertOctagon;
  } else if (severity === "medium") {
    borderStyle = "border-amber-500/60 bg-[#19150d]";
    badgeBg = "bg-amber-500/20 text-amber-400 border-amber-500/40";
    RiskIcon = AlertOctagon;
  }

  return (
    <div
      className={`px-3 py-2.5 rounded-xl border ${borderStyle} ${ringStyle} ${
        selected ? "ring-2 ring-blue-500" : ""
      } min-w-[200px] max-w-[240px] text-xs font-sans transition-all duration-150 relative cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-blue-500 !w-2 !h-2" />

      {/* Header with Icon and Severity Badge */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-800/80">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
            {accountType}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-mono font-medium ${badgeBg}`}
        >
          <RiskIcon className="w-2.5 h-2.5" />
          <span className="capitalize">{severity}</span>
        </span>
      </div>

      {/* Account Info */}
      <div className="pt-2 space-y-0.5">
        <div className="font-bold text-white text-xs truncate" title={holderName}>
          {holderName}
        </div>
        <div className="font-mono text-[10px] text-gray-500 truncate">
          {accountNumber || nodeData.id}
        </div>
      </div>
    </div>
  );
});

AccountNode.displayName = "AccountNode";


// Device Node Component (Shared Hardware Fingerprint)
export const DeviceNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const fingerprint = nodeData.device_fingerprint || nodeData.label || "Hardware Device";

  return (
    <div
      className={`px-3 py-2 rounded-xl border border-purple-500/40 bg-[#161224] ${
        selected ? "ring-2 ring-purple-400" : ""
      } min-w-[170px] max-w-[200px] text-xs font-sans shadow-[0_0_12px_rgba(168,85,247,0.15)] relative cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-purple-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-purple-400 !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-[10px] font-mono text-purple-300 font-semibold uppercase tracking-wider">
            Shared Device
          </div>
          <div className="font-mono text-[10px] text-gray-400 truncate" title={fingerprint}>
            {fingerprint.length > 16 ? `${fingerprint.slice(0, 14)}...` : fingerprint}
          </div>
        </div>
      </div>
    </div>
  );
});

DeviceNode.displayName = "DeviceNode";


// Entity Node Component (Owner / Person / Merchant)
export const EntityNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const name = nodeData.name || nodeData.label || "Entity";
  const entityType = nodeData.type || "person";
  const isMerchant = entityType === "merchant";

  return (
    <div
      className={`px-3 py-2 rounded-xl border border-blue-500/30 bg-[#0e1626] ${
        selected ? "ring-2 ring-blue-400" : ""
      } min-w-[160px] text-xs font-sans relative cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
          {isMerchant ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
        </div>
        <div className="overflow-hidden">
          <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
            {entityType}
          </div>
          <div className="font-semibold text-white truncate" title={name}>
            {name}
          </div>
        </div>
      </div>
    </div>
  );
});

EntityNode.displayName = "EntityNode";

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
} from "lucide-react";

// Account Node Component
export const AccountNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const severity = (nodeData.severity || "low").toLowerCase();
  const label = nodeData.label || "Account";
  const holderName = nodeData.holder_name || label;
  const accountNumber = nodeData.account_number || "";
  const accountType = nodeData.account_type || "savings";

  let borderStyle = "border-border-warm bg-white";
  let ringStyle = "";
  let badgeBg = "bg-slate-100 text-slate-700 border-border-warm";
  let RiskIcon = ShieldCheck;

  if (severity === "critical") {
    borderStyle = "border-severity-critical/70 bg-red-50/40";
    ringStyle = "shadow-md ring-1 ring-severity-critical/30";
    badgeBg = "bg-severity-critical-bg text-severity-critical border-severity-critical-border";
    RiskIcon = Flame;
  } else if (severity === "high") {
    borderStyle = "border-severity-suspicious/70 bg-amber-50/40";
    ringStyle = "shadow-sm ring-1 ring-severity-suspicious/30";
    badgeBg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
    RiskIcon = AlertOctagon;
  } else if (severity === "medium") {
    borderStyle = "border-severity-suspicious/50 bg-amber-50/20";
    badgeBg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
    RiskIcon = AlertOctagon;
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border ${borderStyle} ${ringStyle} ${
        selected ? "ring-2 ring-navy shadow-lg" : "shadow-sm"
      } min-w-[200px] max-w-[240px] text-xs font-sans transition-all duration-150 relative cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-navy !w-2 !h-2" />

      {/* Header with Icon and Severity Badge */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border-warm">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-navy-subtle text-navy border border-navy/20">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans text-[11px] text-ink-secondary uppercase font-medium">
            {accountType}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-sans font-semibold ${badgeBg}`}
        >
          <RiskIcon className="w-2.5 h-2.5" />
          <span className="capitalize">{severity}</span>
        </span>
      </div>

      {/* Account Info */}
      <div className="pt-2 space-y-0.5">
        <div className="font-semibold text-slate-900 text-xs truncate" title={holderName}>
          {holderName}
        </div>
        <div className="font-mono text-[10px] text-slate-500 truncate">
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
      className={`px-3 py-2 rounded-xl border border-border-warm bg-white ${
        selected ? "ring-2 ring-navy shadow-md" : "shadow-sm"
      } min-w-[170px] max-w-[200px] text-xs font-sans relative cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-navy !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-slate-100 text-navy border border-border-warm shrink-0">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-[10px] font-semibold text-navy uppercase">
            Shared Device
          </div>
          <div className="font-mono text-[10px] text-slate-500 truncate" title={fingerprint}>
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
      className={`px-3 py-2 rounded-xl border border-border-warm bg-white ${
        selected ? "ring-2 ring-navy shadow-md" : "shadow-sm"
      } min-w-[160px] text-xs font-sans relative cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-navy-subtle text-navy border border-navy/20 shrink-0">
          {isMerchant ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
        </div>
        <div className="overflow-hidden">
          <div className="text-[10px] font-sans font-semibold text-navy uppercase">
            {entityType}
          </div>
          <div className="font-semibold text-slate-900 truncate" title={name}>
            {name}
          </div>
        </div>
      </div>
    </div>
  );
});

EntityNode.displayName = "EntityNode";

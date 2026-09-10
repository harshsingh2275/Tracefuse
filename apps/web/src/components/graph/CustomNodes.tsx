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
import { formatAccountCode, formatEntityCode } from "@/lib/formatters";

// Account Node Component
export const AccountNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const severity = (nodeData.severity || "low").toLowerCase();
  const label = nodeData.label || "Account";
  const holderName = nodeData.holder_name || label;
  const accountNumber = nodeData.account_number || "";
  const accountType = nodeData.account_type || "savings";
  const accountCode = formatAccountCode(nodeData.id);

  let borderStyle = "border-border-warm bg-[#0a0d14]";
  let ringStyle = "";
  let badgeBg = "bg-severity-normal-bg text-severity-normal border-severity-normal-border";
  let RiskIcon = ShieldCheck;

  if (severity === "critical") {
    borderStyle = "border-severity-critical/70 bg-[#0a0d14]";
    ringStyle = "shadow-md ring-1 ring-severity-critical/30";
    badgeBg = "bg-severity-critical-bg text-severity-critical border-severity-critical-border";
    RiskIcon = Flame;
  } else if (severity === "high") {
    borderStyle = "border-severity-suspicious/70 bg-[#0a0d14]";
    ringStyle = "shadow-sm ring-1 ring-severity-suspicious/30";
    badgeBg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
    RiskIcon = AlertOctagon;
  } else if (severity === "medium") {
    borderStyle = "border-severity-suspicious/50 bg-[#0a0d14]";
    badgeBg = "bg-severity-suspicious-bg text-severity-suspicious border-severity-suspicious-border";
    RiskIcon = AlertOctagon;
  }

  return (
    <div
      className={`relative z-40 px-3.5 py-2.5 rounded-xl border ${borderStyle} ${ringStyle} ${
        selected ? "ring-2 ring-indigo-500 shadow-lg" : "shadow-sm"
      } min-w-[200px] max-w-[240px] text-xs font-sans transition-all duration-150 cursor-pointer bg-[#0a0d14]`}
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
        <div className="font-semibold text-ink-primary text-xs truncate" title={holderName}>
          {holderName}
        </div>
        <div className="font-mono text-[10px] text-ink-secondary truncate" title={nodeData.id}>
          {accountNumber ? `${accountNumber} • ${accountCode}` : accountCode}
        </div>
      </div>
    </div>
  );
});

AccountNode.displayName = "AccountNode";


// Device Node Component (Shared Hardware Fingerprint)
export const DeviceNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const deviceCode = formatEntityCode(nodeData.id, "device");
  const fingerprint = nodeData.device_fingerprint || nodeData.label || "";

  return (
    <div
      className={`relative z-40 px-3 py-2.5 rounded-xl border border-border-warm bg-[#0a0d14] ${
        selected ? "ring-2 ring-indigo-500 shadow-md" : "shadow-sm"
      } min-w-[180px] max-w-[220px] text-xs font-sans cursor-pointer`}
      title={fingerprint ? `Hardware Fingerprint: ${fingerprint}` : undefined}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-navy !w-2 !h-2" />

      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-navy-subtle text-navy border border-navy/20 shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="overflow-hidden space-y-0.5">
          <div className="text-xs font-semibold text-ink-primary truncate">
            Shared Device
          </div>
          <div className="font-mono text-[10px] text-ink-secondary font-medium">
            {deviceCode}
          </div>
        </div>
      </div>
    </div>
  );
});

DeviceNode.displayName = "DeviceNode";


// Entity Node Component (Owner / Person / Merchant / Beneficiary)
export const EntityNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const entityType = String(nodeData.type || nodeData.nodeType || "person").toLowerCase();
  const isMerchant = entityType === "merchant";
  const isBeneficiary = entityType === "beneficiary";
  const name = nodeData.name || nodeData.label || (isMerchant ? "Merchant Entity" : isBeneficiary ? "Beneficiary Entity" : "Individual");
  const code = formatEntityCode(nodeData.id, entityType);

  return (
    <div
      className={`relative z-40 px-3 py-2.5 rounded-xl border border-border-warm bg-[#0a0d14] ${
        selected ? "ring-2 ring-indigo-500 shadow-md" : "shadow-sm"
      } min-w-[170px] max-w-[210px] text-xs font-sans cursor-pointer`}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-navy !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-navy !w-2 !h-2" />

      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-navy-subtle text-navy border border-navy/20 shrink-0">
          {isMerchant ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="overflow-hidden space-y-0.5">
          <div className="font-semibold text-ink-primary text-xs truncate" title={name}>
            {name}
          </div>
          <div className="font-mono text-[10px] text-ink-secondary font-medium truncate" title={nodeData.id}>
            {code}
          </div>
        </div>
      </div>
    </div>
  );
});

EntityNode.displayName = "EntityNode";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from "@xyflow/react";

export const TransactionEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as Record<string, any> | undefined;
  const edgeType = String(edgeData?.edgeType || "").toLowerCase();
  const amount = Number(edgeData?.amount || 0);

  // Strictly check if edge is a financial transaction
  const isTransaction =
    edgeType === "transaction" ||
    (amount > 0 && edgeType !== "uses" && edgeType !== "owns" && edgeType !== "linked_to") ||
    String(id).startsWith("txn_");

  // Format label: only show rupee amount for actual monetary transactions with amount > 0
  const formattedAmount = isTransaction && amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "";

  const isHighlighted = selected || edgeData?.is_highlighted;
  const strokeColor = isHighlighted
    ? "#1F3A5F"
    : isTransaction
    ? "#829ab1"
    : "#cbd5e1"; // Muted dashed/subtle tone for structural edges
  const strokeWidth = isHighlighted ? 3 : isTransaction ? 2 : 1.5;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: !isTransaction ? "4,4" : undefined,
        }}
      />
      {Boolean(formattedAmount) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold transition-all ${
                isHighlighted
                  ? "bg-navy text-white border-navy shadow-md shadow-navy/30 scale-105"
                  : "bg-white/95 text-ink-primary border-border-warm shadow-sm hover:border-navy"
              }`}
            >
              {formattedAmount}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

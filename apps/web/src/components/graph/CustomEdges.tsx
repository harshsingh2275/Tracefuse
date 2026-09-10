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
    ? "var(--accent)"
    : isTransaction
    ? "var(--text-secondary)"
    : "var(--border)";
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
              zIndex: 10,
            }}
            className="nodrag nopan z-10 pointer-events-auto"
          >
            <div
              className={`bg-[#0a0d14] px-2 py-0.5 rounded-md border text-xs font-mono font-semibold shadow-md whitespace-nowrap transition-all ${
                isHighlighted
                  ? "border-indigo-500 text-indigo-300 ring-1 ring-indigo-500 shadow-lg scale-105"
                  : "border-slate-700 text-slate-200 hover:border-slate-500"
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

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
  const amount = edgeData?.amount;
  const formattedAmount =
    amount !== undefined
      ? `₹${Number(amount).toLocaleString("en-IN")}`
      : edgeData?.label || "";

  const isHighlighted = selected || edgeData?.is_highlighted;
  const strokeColor = isHighlighted ? "#1F3A5F" : "#829ab1";
  const strokeWidth = isHighlighted ? 3 : 2;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
        }}
      />
      {formattedAmount && (
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

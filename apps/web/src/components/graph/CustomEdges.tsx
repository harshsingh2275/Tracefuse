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
  const strokeColor = isHighlighted ? "#38bdf8" : "#3b82f6";
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
              className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium transition-all ${
                isHighlighted
                  ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/40 scale-105"
                  : "bg-[#111622]/90 text-blue-300 border-[#1f293d] hover:border-blue-500/60"
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

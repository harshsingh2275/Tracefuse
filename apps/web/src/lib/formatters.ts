/**
 * Format raw investigation IDs into clean, professional case codes (e.g. TF-091)
 */
export function formatCaseCode(id: string): string {
  if (!id) return "TF-001";
  if (id === "inv_flagship_demo") return "TF-091";
  if (id === "inv_fanout_network") return "TF-104";
  if (id === "inv_fanin_aggregation") return "TF-108";
  if (id === "inv_rapid_passthrough") return "TF-215";
  if (id === "inv_circular_cycle") return "TF-330";
  if (id === "inv_mule_ring_device") return "TF-412";
  if (id === "inv_new_intermediary") return "TF-526";

  // Deterministic fallback for any dynamic case ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = (hash % 900) + 100;
  return `TF-${code}`;
}

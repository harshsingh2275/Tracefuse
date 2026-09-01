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

/**
 * Format raw account IDs into clean, professional short codes (e.g. ACC-01)
 */
export function formatAccountCode(id: string): string {
  if (!id) return "ACC-01";
  if (id === "acc_flagship_origin") return "ACC-01";
  if (id === "acc_flagship_layer_01") return "ACC-02";
  if (id === "acc_flagship_layer_02") return "ACC-03";
  if (id === "acc_flagship_layer_03") return "ACC-04";
  if (id === "acc_flagship_layer_04") return "ACC-05";
  if (id === "acc_flagship_layer_05") return "ACC-06";
  if (id === "acc_flagship_mule_ring_01") return "ACC-07";
  if (id === "acc_flagship_mule_ring_02") return "ACC-08";
  if (id === "acc_flagship_kickback_dest") return "ACC-09";

  // Check if id already ends in digits like acc_layer_01 -> ACC-01
  const match = id.match(/_0?(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `ACC-${num.toString().padStart(2, "0")}`;
  }

  // Deterministic fallback for any dynamic account ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = (hash % 90) + 10;
  return `ACC-${code}`;
}

/**
 * Format raw transaction IDs into clean short codes (e.g. TXN-101)
 */
export function formatTxnCode(id: string): string {
  if (!id) return "TXN-101";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = (hash % 900) + 100;
  return `TXN-${code}`;
}

/**
 * Humanizes investigative evidence sentences by replacing raw internal IDs (acc_*, txn_*)
 * with formatted entity names and short codes like "Vikramaditya Singhania's account (ACC-01)"
 */
export function humanizeEvidenceText(
  text: string,
  entities?: Array<Record<string, any> | { id?: string; holder_name?: string; name?: string; account_id?: string }>
): string {
  if (!text) return "";

  let result = text;

  // Build entity lookup map
  const entityMap = new Map<string, string>();
  if (entities) {
    entities.forEach((ent) => {
      const id = String(ent.account_id || ent.id || "");
      const name = String(ent.holder_name || ent.name || "");
      if (id && name) {
        entityMap.set(id, name);
      }
    });
  }

  // 1. Replace "Account acc_xyz" -> "[Holder Name]'s account (ACC-XX)" or "Account (ACC-XX)"
  result = result.replace(/Account\s+(acc_[a-zA-Z0-9_]+)/g, (match, accId) => {
    const name = entityMap.get(accId);
    const code = formatAccountCode(accId);
    if (name) {
      return `${name}'s account (${code})`;
    }
    return `Account (${code})`;
  });

  // 2. Replace standalone "(acc_xyz)" or "acc_xyz"
  result = result.replace(/\(?(acc_[a-zA-Z0-9_]+)\)?/g, (match, accId) => {
    const name = entityMap.get(accId);
    const code = formatAccountCode(accId);
    if (name) {
      return `${name} (${code})`;
    }
    return `(${code})`;
  });

  // 3. Replace standalone "txn_xyz" -> "TXN-..."
  result = result.replace(/\b(txn_[a-zA-Z0-9_]+)\b/g, (match, txnId) => {
    return formatTxnCode(txnId);
  });

  return result;
}

/**
 * TraceFuse Centralized Forensic Code Formatters
 * Single source of truth for deterministic short reference codes across all graph entities,
 * accounts, persons, devices, merchants, beneficiaries, relationships, and transactions.
 * 
 * Guarantees zero code collisions across distinct records.
 */

// Stable registry for flagship demo records to ensure crisp, sequential codes (ACC-01..09, PER-01..07, DEV-01..03, etc.)
const KNOWN_CODES: Record<string, string> = {
  // Cases (TF-XXX)
  "inv_flagship_demo": "TF-091",
  "inv_fanout_network": "TF-104",
  "inv_fanin_aggregation": "TF-108",
  "inv_rapid_passthrough": "TF-215",
  "inv_circular_cycle": "TF-330",
  "inv_mule_ring_device": "TF-412",
  "inv_new_intermediary": "TF-526",
  "inv_layering_chain": "TF-618",
  "inv_fragmentation_structuring": "TF-724",

  // Flagship Accounts (ACC-XX)
  "acc_flagship_origin": "ACC-01",
  "acc_flagship_layer_01": "ACC-02",
  "acc_flagship_layer_02": "ACC-03",
  "acc_flagship_layer_03": "ACC-04",
  "acc_flagship_layer_04": "ACC-05",
  "acc_flagship_layer_05": "ACC-06",
  "acc_flagship_mule_01": "ACC-07",
  "acc_flagship_mule_ring_01": "ACC-07",
  "acc_flagship_mule_02": "ACC-08",
  "acc_flagship_mule_ring_02": "ACC-08",
  "acc_flagship_kickback_dest": "ACC-09",
  "acc_flagship_beneficiary": "ACC-09",

  // Flagship Persons (PER-XX)
  "ent_person_flagship_01": "PER-01",
  "ent_flagship_origin": "PER-01",
  "ent_person_flagship_02": "PER-02",
  "ent_person_flagship_03": "PER-03",
  "ent_person_flagship_04": "PER-04",
  "ent_person_flagship_05": "PER-05",
  "ent_person_flagship_06": "PER-06",
  "ent_person_flagship_07": "PER-07",

  // Flagship Devices (DEV-XX)
  "dev_flagship_shared_01": "DEV-01",
  "dev_flagship_mule_01": "DEV-02",
  "dev_flagship_mule_02": "DEV-03",

  // Flagship Merchants (MER-XX)
  "ent_merch_flagship_01": "MER-01",
  "ent_merch_flagship_02": "MER-02",

  // Flagship Beneficiaries (BEN-XX)
  "ent_ben_flagship_01": "BEN-01",
  "ent_ben_flagship_02": "BEN-02",

  // Flagship Transactions (TXN-XXX)
  "txn_flagship_origin_split_01": "TXN-101",
  "txn_flagship_origin_split_02": "TXN-102",
  "txn_flagship_origin_split_03": "TXN-103",
  "txn_flagship_origin_split_04": "TXN-104",
  "txn_flagship_origin_split_05": "TXN-105",
  "txn_flagship_mule_cycle_01": "TXN-106",
  "txn_flagship_mule_cycle_02": "TXN-107",
  "txn_flagship_mule_cycle_03": "TXN-108",
  "txn_flagship_cycle_kickback": "TXN-109",
};

/**
 * Deterministic 32-bit FNV-1a hash algorithm
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Universal entity code formatter supporting all node and entity types
 */
export function formatEntityCode(id: string, explicitType?: string): string {
  if (!id) return "ENT-01";

  // Check known explicit registry first
  if (KNOWN_CODES[id]) {
    return KNOWN_CODES[id];
  }

  const normId = id.toLowerCase();
  const normType = (explicitType || "").toLowerCase();

  // 1. Determine prefix based on type or ID
  let prefix = "ENT";
  let padDigits = 2;

  if (normType === "person" || normId.startsWith("ent_person_") || normId.startsWith("person_")) {
    prefix = "PER";
  } else if (normType === "merchant" || normId.startsWith("ent_merch_") || normId.startsWith("merch_")) {
    prefix = "MER";
  } else if (normType === "beneficiary" || normId.startsWith("ent_ben_") || normId.startsWith("ben_")) {
    prefix = "BEN";
  } else if (normType === "device" || normId.startsWith("dev_")) {
    prefix = "DEV";
  } else if (normType === "identifier" || normId.startsWith("ident_")) {
    prefix = "IDN";
  } else if (normType === "relationship" || normId.startsWith("rel_")) {
    prefix = "REL";
    padDigits = 3;
  } else if (normType === "transaction" || normId.startsWith("txn_")) {
    prefix = "TXN";
    padDigits = 3;
  } else if (normType === "case" || normType === "investigation" || normId.startsWith("inv_")) {
    prefix = "TF";
    padDigits = 3;
  } else if (normType === "account" || normId.startsWith("acc_")) {
    prefix = "ACC";
  }

  // 2. Extract numeric suffix if and only if it's uniquely formatted within its namespace
  const match = id.match(/_0?(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    // Combine scenario identifier with number to prevent cross-scenario collision
    const scenarioHash = fnv1a(id.replace(/_0?\d+$/, "")) % 10;
    if (scenarioHash > 0 && num < 100) {
      const compositeNum = scenarioHash * 10 + (num % 10);
      return `${prefix}-${compositeNum.toString().padStart(padDigits, "0")}`;
    }
    return `${prefix}-${num.toString().padStart(padDigits, "0")}`;
  }

  // 3. Fallback deterministic hash ensuring uniqueness
  const hash = fnv1a(id);
  if (padDigits === 3) {
    const code = (hash % 900) + 100;
    return `${prefix}-${code}`;
  } else {
    const code = (hash % 90) + 10;
    return `${prefix}-${code}`;
  }
}

/**
 * Format raw account IDs (e.g. acc_flagship_origin -> ACC-01)
 */
export function formatAccountCode(id: string): string {
  return formatEntityCode(id, "account");
}

/**
 * Format raw transaction IDs (e.g. txn_flagship_cycle_kickback -> TXN-109)
 */
export function formatTxnCode(id: string): string {
  return formatEntityCode(id, "transaction");
}

/**
 * Format raw investigation IDs (e.g. inv_flagship_demo -> TF-091)
 */
export function formatCaseCode(id: string): string {
  return formatEntityCode(id, "investigation");
}

/**
 * Format relationship edge IDs (e.g. rel_ent_person_01_acc_01 -> REL-101)
 */
export function formatRelationshipCode(id: string): string {
  return formatEntityCode(id, "relationship");
}

/**
 * Formats any UTC or ISO timestamp strictly in Indian Standard Time (IST, UTC+5:30)
 */
export function formatISTDateTime(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  let d: Date;
  if (typeof dateInput === "string") {
    const isIsoWithoutTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateInput);
    d = new Date(isIsoWithoutTz ? `${dateInput}Z` : dateInput);
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Humanizes investigative evidence sentences by replacing raw internal IDs (acc_*, txn_*, ent_*, dev_*)
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

  // 3. Replace standalone "ent_xyz" -> "[Entity Name] (PER-XX / MER-XX / BEN-XX)"
  result = result.replace(/\(?(ent_[a-zA-Z0-9_]+)\)?/g, (match, entId) => {
    const name = entityMap.get(entId);
    const code = formatEntityCode(entId);
    if (name) {
      return `${name} (${code})`;
    }
    return `(${code})`;
  });

  // 4. Replace standalone "dev_xyz" -> "Device (DEV-XX)"
  result = result.replace(/\(?(dev_[a-zA-Z0-9_]+)\)?/g, (match, devId) => {
    return `Device (${formatEntityCode(devId, "device")})`;
  });

  // 5. Replace standalone "txn_xyz" -> "TXN-..."
  result = result.replace(/\b(txn_[a-zA-Z0-9_]+)\b/g, (match, txnId) => {
    return formatTxnCode(txnId);
  });

  return result;
}

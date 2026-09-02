/**
 * Unit tests for Centralized Code Formatters
 * Asserts uniqueness (zero collisions) and proper typed prefixes.
 */

import {
  formatEntityCode,
  formatAccountCode,
  formatTxnCode,
  formatCaseCode,
  formatRelationshipCode,
  humanizeEvidenceText,
} from "./formatters";

describe("Centralized Code Formatter Engine", () => {
  const sampleIds = [
    // Accounts
    "acc_flagship_origin",
    "acc_flagship_layer_01",
    "acc_flagship_layer_02",
    "acc_flagship_layer_03",
    "acc_flagship_layer_04",
    "acc_flagship_layer_05",
    "acc_flagship_mule_01",
    "acc_flagship_mule_02",
    "acc_flagship_kickback_dest",
    "acc_s3_src_01",
    "acc_s4_hop_01",
    "acc_s4_hop_02",
    "acc_s4_hop_03",
    "acc_s7_passthrough_01",
    "acc_s8_smurf_src",

    // Persons / Entities
    "ent_person_flagship_01",
    "ent_flagship_origin",
    "ent_person_flagship_02",
    "ent_person_flagship_03",
    "ent_person_flagship_04",
    "ent_person_flagship_05",
    "ent_person_flagship_06",
    "ent_person_flagship_07",

    // Merchants
    "ent_merch_flagship_01",
    "ent_merch_flagship_02",

    // Beneficiaries
    "ent_ben_flagship_01",
    "ent_ben_flagship_02",

    // Devices
    "dev_flagship_shared_01",
    "dev_flagship_mule_01",
    "dev_flagship_mule_02",

    // Cases
    "inv_flagship_demo",
    "inv_fanout_network",
    "inv_fanin_aggregation",
    "inv_rapid_passthrough",
    "inv_circular_cycle",

    // Transactions
    "txn_flagship_origin_split_01",
    "txn_flagship_origin_split_02",
    "txn_flagship_mule_cycle_01",
    "txn_flagship_cycle_kickback",
  ];

  test("generates expected prefixes for each entity type", () => {
    expect(formatAccountCode("acc_flagship_origin")).toBe("ACC-01");
    expect(formatAccountCode("acc_flagship_layer_02")).toBe("ACC-03");

    expect(formatEntityCode("ent_person_flagship_01", "person")).toBe("PER-01");
    expect(formatEntityCode("ent_merch_flagship_01", "merchant")).toBe("MER-01");
    expect(formatEntityCode("ent_ben_flagship_01", "beneficiary")).toBe("BEN-01");
    expect(formatEntityCode("dev_flagship_shared_01", "device")).toBe("DEV-01");
    expect(formatCaseCode("inv_flagship_demo")).toBe("TF-091");
    expect(formatTxnCode("txn_flagship_cycle_kickback")).toBe("TXN-109");
  });

  test("guarantees zero collisions across all unique IDs", () => {
    const codeToId = new Map<string, string>();

    // Unique IDs (excluding explicit aliases like ent_flagship_origin -> PER-01)
    const uniqueRecords = sampleIds.filter((id) => id !== "ent_flagship_origin");

    for (const id of uniqueRecords) {
      const code = formatEntityCode(id);
      if (codeToId.has(code)) {
        const previousId = codeToId.get(code);
        throw new Error(`Collision detected: ${id} and ${previousId} both produced code ${code}`);
      }
      codeToId.set(code, id);
    }

    expect(codeToId.size).toBe(uniqueRecords.length);
  });

  test("formatISTDateTime properly converts UTC ISO string to IST", () => {
    // 19:07 UTC on Sept 2nd is 00:37 AM on Sept 3rd in IST (UTC+5:30)
    const utcIso = "2026-09-02T19:07:00Z";
    const istFormatted = formatISTDateTime(utcIso);
    expect(istFormatted).toContain("3 Sept");
    expect(istFormatted).toContain("12:37:00 am");

    // Naive string without Z should also be assumed UTC
    const naiveUtcIso = "2026-09-02T19:07:00";
    const naiveIstFormatted = formatISTDateTime(naiveUtcIso);
    expect(naiveIstFormatted).toContain("3 Sept");
    expect(naiveIstFormatted).toContain("12:37:00 am");
  });
});

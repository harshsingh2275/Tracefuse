"""
Shared-Device Pattern Detector
Detects >= 2 distinct accounts linked to the same device hardware fingerprint.
"""
from typing import List, Dict, Any
from collections import defaultdict
from analytics.patterns.schema import PatternResult
from analytics.patterns.config import SHARED_DEVICE_MIN_ACCOUNTS


def detect_shared_device(
    account_devices: List[Any] = None,
    devices: List[Any] = None,
    **kwargs
) -> List[PatternResult]:
    """Detects multi-account reuse of shared hardware devices indicating syndicate control."""
    results = []
    if not account_devices:
        return results

    # Map device_id -> set of account_ids
    accounts_by_device = defaultdict(set)
    for ad in account_devices:
        acc_id = ad.account_id if hasattr(ad, 'account_id') else ad['account_id']
        dev_id = ad.device_id if hasattr(ad, 'device_id') else ad['device_id']
        accounts_by_device[dev_id].add(acc_id)

    # Device fingerprint lookup
    dev_fp_map = {}
    if devices:
        for dev in devices:
            d_id = dev.id if hasattr(dev, 'id') else dev['id']
            fp = dev.device_fingerprint if hasattr(dev, 'device_fingerprint') else dev.get('device_fingerprint', d_id)
            dev_fp_map[d_id] = fp

    for dev_id, acc_set in accounts_by_device.items():
        if len(acc_set) >= SHARED_DEVICE_MIN_ACCOUNTS:
            acc_list = sorted(list(acc_set))
            fp_label = dev_fp_map.get(dev_id, dev_id)

            results.append(PatternResult(
                pattern_type="shared_device",
                severity="high",
                confidence=min(1.0, 0.80 + (len(acc_list) - SHARED_DEVICE_MIN_ACCOUNTS) * 0.08),
                entities=acc_list,
                transaction_ids=[],
                evidence=f"{len(acc_list)} accounts are linked to the same device fingerprint ({fp_label[:14]}...), suggesting common syndicate control.",
                explanation=(
                    f"Hardware fingerprint reuse detected: device {dev_id} ({fp_label}) is shared across "
                    f"{len(acc_list)} distinct accounts ({', '.join(acc_list[:4])}{'...' if len(acc_list) > 4 else ''}). "
                    f"Device sharing across multiple unrelated retail accounts strongly suggests coordinated mule ring operation."
                ),
                metadata={"device_id": dev_id, "fingerprint": fp_label, "linked_accounts": acc_list},
            ))

    return results

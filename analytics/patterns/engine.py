"""
Detection Engine
Modular orchestration pipeline running all 8 pure-function detectors.
Section 11 Architecture:
  Transaction Processor -> Pattern Detectors -> Output PatternResult[]
"""
from typing import List, Dict, Any, Optional
from analytics.patterns.schema import PatternResult
from analytics.patterns.detectors.fan_out import detect_fan_out
from analytics.patterns.detectors.fan_in import detect_fan_in
from analytics.patterns.detectors.rapid_pass_through import detect_rapid_pass_through
from analytics.patterns.detectors.fragmentation import detect_fragmentation
from analytics.patterns.detectors.velocity import detect_velocity
from analytics.patterns.detectors.circular import detect_circular_movement
from analytics.patterns.detectors.shared_device import detect_shared_device
from analytics.patterns.detectors.new_intermediary import detect_new_intermediary


class DetectionEngine:
    """Pluggable, modular pattern detection engine."""

    def __init__(self):
        self.detectors = [
            ("fan_out", detect_fan_out),
            ("fan_in", detect_fan_in),
            ("rapid_pass_through", detect_rapid_pass_through),
            ("fragmentation", detect_fragmentation),
            ("velocity", detect_velocity),
            ("circular_movement", detect_circular_movement),
            ("shared_device", detect_shared_device),
            ("new_intermediary", detect_new_intermediary),
        ]

    def run_all(
        self,
        transactions: List[Any],
        accounts: Optional[List[Any]] = None,
        devices: Optional[List[Any]] = None,
        account_devices: Optional[List[Any]] = None,
        identifiers: Optional[List[Any]] = None,
        **kwargs
    ) -> List[PatternResult]:
        """Runs all 8 detectors against provided dataset and returns aggregated pattern detections."""
        all_results: List[PatternResult] = []

        context = {
            "transactions": transactions,
            "accounts": accounts or [],
            "devices": devices or [],
            "account_devices": account_devices or [],
            "identifiers": identifiers or [],
            **kwargs,
        }

        for name, detector_fn in self.detectors:
            try:
                detector_results = detector_fn(**context)
                if detector_results:
                    all_results.extend(detector_results)
            except Exception as e:
                print(f"[DetectionEngine] Error in detector '{name}': {e}")

        return all_results

"""
Pattern Result Schema
Standard output format for all detectors per Section 5B & Section 11.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class PatternResult:
    pattern_type: str                  # e.g., 'fan_out', 'circular_movement'
    severity: str                      # 'low', 'medium', 'high', 'critical'
    confidence: float                  # 0.0 to 1.0
    entities: List[str]                # List of involved account/entity IDs
    transaction_ids: List[str]         # Specific transaction IDs providing evidence
    evidence: str                      # Plain-language evidence string
    explanation: str                   # Detailed investigator context
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pattern_type": self.pattern_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "entities": self.entities,
            "transaction_ids": self.transaction_ids,
            "evidence": self.evidence,
            "explanation": self.explanation,
            "metadata": self.metadata,
        }

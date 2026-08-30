"""
Risk Engine Configuration
Weights, score bands, and guard rail thresholds per Section 5E & Section 14.
"""

CATEGORY_WEIGHTS = {
    "velocity": 0.15,
    "graph": 0.20,
    "temporal": 0.20,
    "fragmentation": 0.15,
    "circular": 0.15,
    "entity_reuse": 0.15,
}

# Guard Rail: Maximum raw points any single category can contribute before weighting
# Prevents single heuristic from producing extreme score without corroboration
SINGLE_CATEGORY_RAW_CAP = 100.0
SINGLE_SIGNAL_MAX_COMPOSITE = 60.0

SCORE_BANDS = [
    (0.0, 29.99, "low"),
    (30.0, 59.99, "medium"),
    (60.0, 79.99, "high"),
    (80.0, 100.0, "critical"),
]


def get_risk_level(score: float) -> str:
    """Maps composite score [0, 100] to severity risk band."""
    for low, high, band in SCORE_BANDS:
        if low <= score <= high:
            return band
    return "critical" if score >= 80.0 else "low"

"""
Risk Scoring Engine
Aggregates detector findings, graph metrics, and temporal anomalies
into an explainable composite Investigation Risk Score [0, 100].
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from analytics.patterns.schema import PatternResult
from analytics.risk.config import (
    CATEGORY_WEIGHTS,
    SINGLE_SIGNAL_MAX_COMPOSITE,
    get_risk_level,
)


@dataclass
class RiskSignalItem:
    category: str
    score: float
    weight: float
    weighted_score: float
    explanation: str


@dataclass
class RiskBreakdown:
    composite_score: float
    risk_level: str
    category_scores: Dict[str, float]
    signals: List[RiskSignalItem]
    reasons: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "composite_score": round(self.composite_score, 1),
            "risk_level": self.risk_level,
            "category_scores": {k: round(v, 1) for k, v in self.category_scores.items()},
            "signals": [
                {
                    "category": s.category,
                    "score": round(s.score, 1),
                    "weight": s.weight,
                    "weighted_score": round(s.weighted_score, 1),
                    "explanation": s.explanation,
                }
                for s in self.signals
            ],
            "reasons": self.reasons,
        }


class RiskScoringEngine:
    """Calculates deterministic, multi-factor investigation risk score."""

    def calculate_risk(
        self,
        patterns: List[PatternResult],
        graph_metrics: Optional[Dict[str, Any]] = None,
        temporal_metrics: Optional[Dict[str, Any]] = None,
    ) -> RiskBreakdown:
        # 1. Initialize raw category scores
        raw_scores = {cat: 0.0 for cat in CATEGORY_WEIGHTS}
        category_reasons = {cat: [] for cat in CATEGORY_WEIGHTS}

        # 2. Map PatternResults to Risk Categories
        for p in patterns:
            conf = p.confidence
            severity_weight = 1.0 if p.severity == "critical" else (0.85 if p.severity == "high" else 0.6)
            pts = 85.0 * conf * severity_weight

            if p.pattern_type in ("fan_out", "fan_in"):
                raw_scores["graph"] = max(raw_scores["graph"], pts)
                category_reasons["graph"].append(p.evidence)

            elif p.pattern_type == "rapid_pass_through":
                raw_scores["temporal"] = max(raw_scores["temporal"], pts)
                category_reasons["temporal"].append(p.evidence)

            elif p.pattern_type == "velocity":
                raw_scores["velocity"] = max(raw_scores["velocity"], pts)
                category_reasons["velocity"].append(p.evidence)

            elif p.pattern_type == "fragmentation":
                raw_scores["fragmentation"] = max(raw_scores["fragmentation"], pts)
                category_reasons["fragmentation"].append(p.evidence)

            elif p.pattern_type == "circular_movement":
                raw_scores["circular"] = max(raw_scores["circular"], pts)
                category_reasons["circular"].append(p.evidence)

            elif p.pattern_type in ("shared_device", "new_intermediary"):
                raw_scores["entity_reuse"] = max(raw_scores["entity_reuse"], pts)
                category_reasons["entity_reuse"].append(p.evidence)

        # 3. Factor in Graph Centrality if present
        if graph_metrics:
            max_betweenness = max([m.get("betweenness_centrality", 0.0) for m in graph_metrics.values()] or [0.0])
            if max_betweenness > 0.4:
                raw_scores["graph"] = max(raw_scores["graph"], 60.0 + max_betweenness * 30.0)
                category_reasons["graph"].append(f"High network bottleneck betweenness centrality ({max_betweenness:.2f}) detected.")

        # 4. Compute weighted sum
        active_categories = sum(1 for v in raw_scores.values() if v > 0)
        
        # Calculate raw composite
        total_weighted_score = 0.0
        signals = []

        for cat, weight in CATEGORY_WEIGHTS.items():
            cat_score = min(100.0, raw_scores[cat])
            weighted = cat_score * weight
            total_weighted_score += weighted

            if cat_score > 0:
                signals.append(RiskSignalItem(
                    category=cat,
                    score=cat_score,
                    weight=weight,
                    weighted_score=weighted,
                    explanation="; ".join(category_reasons[cat]) if category_reasons[cat] else f"{cat.title()} risk elevated.",
                ))

        # 5. Guard Rail: Single Signal Cap (Section 5E & 219)
        # If only 1 category fired, cap overall composite score at 60 (Medium band ceiling)
        # Multiple corroborating signals are required to reach High (60+) / Critical (80+)
        final_score = total_weighted_score
        
        # In multi-signal case, normalize if multiple high confidence detections corroborate
        if active_categories >= 3:
            # Multi-pattern syndicates get compounding risk multiplier
            final_score = min(100.0, total_weighted_score * 1.55)
        elif active_categories == 2:
            final_score = min(79.0, total_weighted_score * 1.25)
        elif active_categories == 1:
            final_score = min(SINGLE_SIGNAL_MAX_COMPOSITE, total_weighted_score * 1.1)

        final_score = min(100.0, max(0.0, final_score))
        risk_level = get_risk_level(final_score)

        # Compile reasons
        all_reasons = []
        for cat, reasons in category_reasons.items():
            for r in reasons:
                if r and r not in all_reasons:
                    all_reasons.append(r)

        return RiskBreakdown(
            composite_score=final_score,
            risk_level=risk_level,
            category_scores=raw_scores,
            signals=signals,
            reasons=all_reasons,
        )

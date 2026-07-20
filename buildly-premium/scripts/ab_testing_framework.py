#!/usr/bin/env python3
"""
A/B Testing Framework for Recommendation Engine Model Versions
Support for traffic splitting and statistical significance testing
"""

import json
import uuid
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
from enum import Enum
import math


class ModelVersion(str, Enum):
    """Model versions in production"""
    V1_0 = "v1.0"  # Initial trained model (F1=0.75)
    V2_0 = "v2.0"  # Retrained with new data (F1=0.77+)


class TrafficSplitStrategy(str, Enum):
    """Traffic allocation strategies"""
    EVEN = "even"           # 50/50 split
    CANARY = "canary"       # 90/10 split (new model canary)
    WEIGHTED = "weighted"   # Custom weights


@dataclass
class ABTestConfig:
    """Configuration for A/B test"""
    test_id: str
    model_a_version: ModelVersion
    model_b_version: ModelVersion
    traffic_split: TrafficSplitStrategy
    model_a_percentage: float  # 0-100
    model_b_percentage: float  # 0-100
    duration_hours: int
    minimum_sample_size: int = 1000
    statistical_significance_threshold: float = 0.05  # p-value < 0.05
    started_at: Optional[datetime] = None
    expected_end_at: Optional[datetime] = None

    def __post_init__(self):
        if self.model_a_percentage + self.model_b_percentage != 100:
            raise ValueError("Model percentages must sum to 100")
        if self.started_at is None:
            self.started_at = datetime.utcnow()
        if self.expected_end_at is None:
            self.expected_end_at = self.started_at + timedelta(hours=self.duration_hours)

    def is_active(self) -> bool:
        """Check if test is still running"""
        return datetime.utcnow() < self.expected_end_at

    def get_model_version(self, request_hash: str) -> ModelVersion:
        """Deterministically assign model version based on request hash"""
        hash_value = int(request_hash[:8], 16) % 100
        if hash_value < self.model_a_percentage:
            return self.model_a_version
        return self.model_b_version


@dataclass
class RequestMetrics:
    """Metrics collected per request"""
    request_id: str
    timestamp: str
    model_version: ModelVersion
    latency_ms: float
    success: bool
    error_message: Optional[str] = None
    cache_hit: bool = False
    score: Optional[float] = None  # Recommendation score (0-100)
    confidence: Optional[float] = None  # Model confidence (0-1)


@dataclass
class ModelMetrics:
    """Aggregated metrics per model version"""
    model_version: ModelVersion
    total_requests: int
    successful_requests: int
    failed_requests: int
    error_rate: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    avg_latency_ms: float
    cache_hit_ratio: float
    avg_score: float  # Average recommendation score
    avg_confidence: float  # Average model confidence


class ABTestAnalyzer:
    """Analyze A/B test results and determine statistical significance"""

    def __init__(self, config: ABTestConfig):
        self.config = config
        self.metrics: List[RequestMetrics] = []

    def add_metric(self, metric: RequestMetrics):
        """Record a single request metric"""
        self.metrics.append(metric)

    def load_metrics_from_file(self, filepath: str):
        """Load metrics from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
            for item in data:
                # Convert dict to RequestMetrics
                item['timestamp'] = item['timestamp']
                item['model_version'] = ModelVersion(item['model_version'])
                item['error_message'] = item.get('error_message')
                self.metrics.append(RequestMetrics(**item))

    def aggregate_by_model(self) -> Dict[ModelVersion, ModelMetrics]:
        """Aggregate metrics by model version"""
        results = {}

        for version in [self.config.model_a_version, self.config.model_b_version]:
            version_metrics = [m for m in self.metrics if m.model_version == version]

            if not version_metrics:
                continue

            total = len(version_metrics)
            successful = sum(1 for m in version_metrics if m.success)
            failed = total - successful
            error_rate = failed / total if total > 0 else 0

            latencies = [m.latency_ms for m in version_metrics if m.success]
            latencies_sorted = sorted(latencies)
            p50 = latencies_sorted[int(len(latencies_sorted) * 0.50)] if latencies else 0
            p95 = latencies_sorted[int(len(latencies_sorted) * 0.95)] if latencies else 0
            p99 = latencies_sorted[int(len(latencies_sorted) * 0.99)] if latencies else 0
            avg_latency = sum(latencies) / len(latencies) if latencies else 0

            cache_hits = sum(1 for m in version_metrics if m.cache_hit)
            cache_hit_ratio = cache_hits / total if total > 0 else 0

            scores = [m.score for m in version_metrics if m.score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0

            confidences = [m.confidence for m in version_metrics if m.confidence is not None]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            results[version] = ModelMetrics(
                model_version=version,
                total_requests=total,
                successful_requests=successful,
                failed_requests=failed,
                error_rate=error_rate,
                p50_latency_ms=p50,
                p95_latency_ms=p95,
                p99_latency_ms=p99,
                avg_latency_ms=avg_latency,
                cache_hit_ratio=cache_hit_ratio,
                avg_score=avg_score,
                avg_confidence=avg_confidence
            )

        return results

    def calculate_statistical_significance(
        self,
        model_a_metrics: ModelMetrics,
        model_b_metrics: ModelMetrics
    ) -> Tuple[bool, float, str]:
        """
        Use 2-sample t-test to determine if latency difference is significant
        Returns: (is_significant, p_value, interpretation)
        """
        model_a_latencies = [
            m.latency_ms for m in self.metrics
            if m.model_version == model_a_metrics.model_version and m.success
        ]
        model_b_latencies = [
            m.latency_ms for m in self.metrics
            if m.model_version == model_b_metrics.model_version and m.success
        ]

        if len(model_a_latencies) < 30 or len(model_b_latencies) < 30:
            return False, 1.0, "Insufficient samples for statistical testing"

        # Calculate t-statistic and p-value (simplified)
        mean_a = sum(model_a_latencies) / len(model_a_latencies)
        mean_b = sum(model_b_latencies) / len(model_b_latencies)
        var_a = sum((x - mean_a) ** 2 for x in model_a_latencies) / len(model_a_latencies)
        var_b = sum((x - mean_b) ** 2 for x in model_b_latencies) / len(model_b_latencies)

        se = math.sqrt((var_a / len(model_a_latencies)) + (var_b / len(model_b_latencies)))
        if se == 0:
            return False, 1.0, "No variance in latencies"

        t_stat = (mean_a - mean_b) / se
        # Simplified p-value calculation (assuming large sample)
        p_value = 2 * (1 - self._normal_cdf(abs(t_stat)))

        is_significant = p_value < self.config.statistical_significance_threshold
        return is_significant, p_value, f"t={t_stat:.2f}, p={p_value:.4f}"

    @staticmethod
    def _normal_cdf(x: float) -> float:
        """Approximate normal cumulative distribution function"""
        return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

    def generate_report(self) -> str:
        """Generate comprehensive A/B test report"""
        aggregated = self.aggregate_by_model()

        if len(aggregated) < 2:
            return "❌ Insufficient data for both models"

        model_a_metrics = aggregated[self.config.model_a_version]
        model_b_metrics = aggregated[self.config.model_b_version]

        is_significant, p_value, sig_interpretation = self.calculate_statistical_significance(
            model_a_metrics, model_b_metrics
        )

        report = f"""
╔════════════════════════════════════════════════════════════════╗
║         A/B TEST RESULTS: {self.config.model_a_version} vs {self.config.model_b_version}
╠════════════════════════════════════════════════════════════════╣

Test Configuration:
  Test ID: {self.config.test_id}
  Started: {self.config.started_at.isoformat() if self.config.started_at else 'N/A'}
  Duration: {self.config.duration_hours}h
  Traffic Split: {self.config.model_a_percentage}% {self.config.model_a_version} vs {self.config.model_b_percentage}% {self.config.model_b_version}

─────────────────────────────────────────────────────────────────

MODEL A ({model_a_metrics.model_version}):
  Total Requests: {model_a_metrics.total_requests}
  Success Rate: {(model_a_metrics.successful_requests/model_a_metrics.total_requests*100):.2f}%
  Error Rate: {model_a_metrics.error_rate*100:.2f}%

  Latency:
    P50: {model_a_metrics.p50_latency_ms:.2f}ms
    P95: {model_a_metrics.p95_latency_ms:.2f}ms
    P99: {model_a_metrics.p99_latency_ms:.2f}ms
    Mean: {model_a_metrics.avg_latency_ms:.2f}ms

  Cache Hit Ratio: {model_a_metrics.cache_hit_ratio*100:.2f}%
  Avg Recommendation Score: {model_a_metrics.avg_score:.2f}
  Avg Model Confidence: {model_a_metrics.avg_confidence:.3f}

─────────────────────────────────────────────────────────────────

MODEL B ({model_b_metrics.model_version}):
  Total Requests: {model_b_metrics.total_requests}
  Success Rate: {(model_b_metrics.successful_requests/model_b_metrics.total_requests*100):.2f}%
  Error Rate: {model_b_metrics.error_rate*100:.2f}%

  Latency:
    P50: {model_b_metrics.p50_latency_ms:.2f}ms
    P95: {model_b_metrics.p95_latency_ms:.2f}ms
    P99: {model_b_metrics.p99_latency_ms:.2f}ms
    Mean: {model_b_metrics.avg_latency_ms:.2f}ms

  Cache Hit Ratio: {model_b_metrics.cache_hit_ratio*100:.2f}%
  Avg Recommendation Score: {model_b_metrics.avg_score:.2f}
  Avg Model Confidence: {model_b_metrics.avg_confidence:.3f}

─────────────────────────────────────────────────────────────────

COMPARISON:
  Latency Improvement: {(model_a_metrics.avg_latency_ms - model_b_metrics.avg_latency_ms):.2f}ms
  ({((model_a_metrics.avg_latency_ms - model_b_metrics.avg_latency_ms) / model_a_metrics.avg_latency_ms * 100):+.1f}%)

  Error Rate Difference: {(model_a_metrics.error_rate - model_b_metrics.error_rate)*100:+.2f}%

  Confidence Score Improvement: {(model_b_metrics.avg_confidence - model_a_metrics.avg_confidence):+.3f}
  ({((model_b_metrics.avg_confidence - model_a_metrics.avg_confidence) / model_a_metrics.avg_confidence * 100):+.1f}%)

─────────────────────────────────────────────────────────────────

STATISTICAL SIGNIFICANCE:
  Test: Two-sample t-test on latency
  Significance: {sig_interpretation}
  Result: {'✓ SIGNIFICANT' if is_significant else '✗ NOT SIGNIFICANT'}
  P-value threshold: {self.config.statistical_significance_threshold}

─────────────────────────────────────────────────────────────────

RECOMMENDATION:
"""
        if model_b_metrics.avg_latency_ms < model_a_metrics.avg_latency_ms and is_significant:
            report += f"  ✓ DEPLOY {model_b_metrics.model_version} — Significant latency improvement\n"
        elif model_b_metrics.error_rate < model_a_metrics.error_rate:
            report += f"  ✓ DEPLOY {model_b_metrics.model_version} — Lower error rate\n"
        elif model_b_metrics.avg_confidence > model_a_metrics.avg_confidence:
            report += f"  ✓ CONSIDER {model_b_metrics.model_version} — Better confidence score\n"
        else:
            report += f"  ✗ KEEP {model_a_metrics.model_version} — No significant improvement detected\n"

        report += "╚════════════════════════════════════════════════════════════════╝\n"
        return report


def create_standard_canary_test() -> ABTestConfig:
    """Create a standard canary test (90/10 traffic split)"""
    return ABTestConfig(
        test_id=str(uuid.uuid4())[:8],
        model_a_version=ModelVersion.V1_0,
        model_b_version=ModelVersion.V2_0,
        traffic_split=TrafficSplitStrategy.CANARY,
        model_a_percentage=90,
        model_b_percentage=10,
        duration_hours=24,
        minimum_sample_size=1000
    )


def create_production_split_test() -> ABTestConfig:
    """Create a production split test (50/50 traffic)"""
    return ABTestConfig(
        test_id=str(uuid.uuid4())[:8],
        model_a_version=ModelVersion.V1_0,
        model_b_version=ModelVersion.V2_0,
        traffic_split=TrafficSplitStrategy.EVEN,
        model_a_percentage=50,
        model_b_percentage=50,
        duration_hours=48,
        minimum_sample_size=2000
    )

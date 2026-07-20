#!/usr/bin/env python3
"""
Load Testing Script for Recommendation API
Targets: P50 <100ms, P95 <200ms, P99 <300ms
"""

import json
import time
import argparse
from statistics import mean, median, stdev
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Tuple
import requests
from datetime import datetime

# Test payload (Material Delay scenario)
MATERIAL_DELAY_PAYLOAD = {
    "evento_id": "evt-delay-{request_id}",
    "obra_id": "obra-xyz",
    "tipo_evento": "MATERIAL_DELAY",
    "opcoes": [
        {
            "id": "opt-esperar",
            "descricao": "Esperar fornecedor (15 dias)",
            "custo_estimado": 150000,
            "prazo_dias": 15,
            "risco_score": 80
        },
        {
            "id": "opt-importar",
            "descricao": "Importar material (3 dias)",
            "custo_estimado": 225000,
            "prazo_dias": 3,
            "risco_score": 50
        },
        {
            "id": "opt-reordenar",
            "descricao": "Reordenar atividades (7 dias)",
            "custo_estimado": 50000,
            "prazo_dias": 7,
            "risco_score": 35
        }
    ],
    "contexto": {
        "fase_obra": "estrutura",
        "conclusao_pct": 45,
        "equipe_tamanho": 25,
        "fornecedor_confiabilidade": 75
    }
}


class LoadTester:
    def __init__(self, base_url: str, num_requests: int = 100, num_workers: int = 10):
        self.base_url = base_url.rstrip('/')
        self.num_requests = num_requests
        self.num_workers = num_workers
        self.latencies: List[float] = []
        self.errors: List[str] = []
        self.successful_requests = 0

    def make_request(self, request_id: int) -> Tuple[float, bool, str]:
        """Make single request and return latency in ms"""
        payload = json.loads(json.dumps(MATERIAL_DELAY_PAYLOAD))
        payload["evento_id"] = payload["evento_id"].format(request_id=request_id)

        start_time = time.time()
        try:
            response = requests.post(
                f"{self.base_url}/recommendations/infer",
                json=payload,
                timeout=10
            )
            latency_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()
                return latency_ms, True, data.get("model_version", "unknown")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                return latency_ms, False, error_msg

        except requests.RequestException as e:
            latency_ms = (time.time() - start_time) * 1000
            return latency_ms, False, str(e)

    def run_load_test(self):
        """Execute load test with ThreadPoolExecutor"""
        print(f"🚀 Starting load test: {self.num_requests} requests with {self.num_workers} workers")
        print(f"Target: P50<100ms, P95<200ms, P99<300ms\n")

        start_time = time.time()

        with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
            futures = [
                executor.submit(self.make_request, i)
                for i in range(self.num_requests)
            ]

            completed = 0
            for future in as_completed(futures):
                latency_ms, success, extra_info = future.result()
                self.latencies.append(latency_ms)

                if success:
                    self.successful_requests += 1
                else:
                    self.errors.append(extra_info)

                completed += 1
                if completed % 10 == 0:
                    print(f"  Completed: {completed}/{self.num_requests}")

        total_time = time.time() - start_time
        self.print_results(total_time)

    def print_results(self, total_time: float):
        """Print comprehensive test results"""
        if not self.latencies:
            print("❌ No successful requests")
            return

        sorted_latencies = sorted(self.latencies)
        p50 = sorted_latencies[int(len(sorted_latencies) * 0.50)]
        p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)]
        p99 = sorted_latencies[int(len(sorted_latencies) * 0.99)]

        print("\n" + "=" * 60)
        print("📊 LOAD TEST RESULTS")
        print("=" * 60)
        print(f"Total Time: {total_time:.2f}s")
        print(f"Requests: {self.successful_requests}/{self.num_requests} successful")
        print(f"Error Rate: {len(self.errors)/self.num_requests*100:.2f}%")
        print(f"Throughput: {self.successful_requests/total_time:.2f} req/s\n")

        print("LATENCY METRICS (ms):")
        print(f"  Min:    {min(sorted_latencies):.2f}")
        print(f"  Max:    {max(sorted_latencies):.2f}")
        print(f"  Mean:   {mean(sorted_latencies):.2f}")
        print(f"  Median: {median(sorted_latencies):.2f}")
        if len(sorted_latencies) > 1:
            print(f"  StdDev: {stdev(sorted_latencies):.2f}")
        print(f"\nPERCENTILES:")
        print(f"  P50:  {p50:.2f}ms ✓" if p50 < 100 else f"  P50:  {p50:.2f}ms ✗")
        print(f"  P95:  {p95:.2f}ms ✓" if p95 < 200 else f"  P95:  {p95:.2f}ms ✗")
        print(f"  P99:  {p99:.2f}ms ✓" if p99 < 300 else f"  P99:  {p99:.2f}ms ✗")
        print("=" * 60)

        if self.errors:
            print(f"\n⚠️ ERRORS ({len(self.errors)}):")
            for error in self.errors[:5]:
                print(f"  - {error}")
            if len(self.errors) > 5:
                print(f"  ... and {len(self.errors) - 5} more")

        # Save results to JSON
        results = {
            "timestamp": datetime.now().isoformat(),
            "config": {
                "total_requests": self.num_requests,
                "concurrent_workers": self.num_workers
            },
            "summary": {
                "total_time_seconds": total_time,
                "successful_requests": self.successful_requests,
                "failed_requests": len(self.errors),
                "error_rate_percent": len(self.errors) / self.num_requests * 100,
                "throughput_rps": self.successful_requests / total_time
            },
            "latency": {
                "min_ms": float(min(sorted_latencies)),
                "max_ms": float(max(sorted_latencies)),
                "mean_ms": float(mean(sorted_latencies)),
                "median_ms": float(median(sorted_latencies)),
                "p50_ms": float(p50),
                "p95_ms": float(p95),
                "p99_ms": float(p99),
                "stdev_ms": float(stdev(sorted_latencies)) if len(sorted_latencies) > 1 else 0
            },
            "targets": {
                "p50_target_ms": 100,
                "p95_target_ms": 200,
                "p99_target_ms": 300,
                "p50_met": p50 < 100,
                "p95_met": p95 < 200,
                "p99_met": p99 < 300
            }
        }

        with open("load_test_results.json", "w") as f:
            json.dump(results, f, indent=2)
        print("\n✅ Results saved to load_test_results.json")


def main():
    parser = argparse.ArgumentParser(description="Load test Recommendation API")
    parser.add_argument("--url", default="http://localhost:3001", help="Base URL of API")
    parser.add_argument("--requests", type=int, default=1000, help="Total requests to send")
    parser.add_argument("--workers", type=int, default=10, help="Concurrent workers")

    args = parser.parse_args()

    tester = LoadTester(args.url, args.requests, args.workers)
    tester.run_load_test()


if __name__ == "__main__":
    main()

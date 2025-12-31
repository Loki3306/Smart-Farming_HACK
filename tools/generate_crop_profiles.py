#!/usr/bin/env python3
"""Generate crop profile ranges from verified_agronomy_data.csv.

This produces a single JSON file that both:
- farm_sensor_simulator.py (Python)
- server/autonomous/autonomousEngine.ts (Node/TS)
can load to get realistic, data-driven optimal bands.

Design:
- Compute robust ranges using percentiles (default: 20th..80th) to avoid outliers.
- Generate both an overall profile per crop AND optional soil-specific profiles.

Output:
  Smart-Farming_HACK/shared/crop_profiles.json

Run:
  python tools/generate_crop_profiles.py

No external dependencies.
"""

from __future__ import annotations

import csv
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_INPUT = os.path.join(ROOT, "datasets", "verified_agronomy_data.csv")
DEFAULT_OUTPUT = os.path.join(ROOT, "shared", "crop_profiles.json")


def canonical_key(value: str) -> str:
    # Lowercase and keep alnum as words; collapse separators to underscore.
    value = (value or "").strip().lower()
    out = []
    prev_us = False
    for ch in value:
        if ch.isalnum():
            out.append(ch)
            prev_us = False
        else:
            if not prev_us:
                out.append("_")
                prev_us = True
    key = "".join(out).strip("_")
    while "__" in key:
        key = key.replace("__", "_")
    return key


def _to_float(raw: str) -> Optional[float]:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def percentile(values: List[float], p: float) -> float:
    """Linear-interpolated percentile for p in [0,1]."""
    if not values:
        raise ValueError("percentile() requires non-empty list")
    if p <= 0:
        return min(values)
    if p >= 1:
        return max(values)

    xs = sorted(values)
    n = len(xs)
    # position in [0, n-1]
    pos = p * (n - 1)
    lo = int(pos)
    hi = min(lo + 1, n - 1)
    if hi == lo:
        return xs[lo]
    frac = pos - lo
    return xs[lo] * (1 - frac) + xs[hi] * frac


@dataclass
class Agg:
    moisture: List[float]
    temp: List[float]
    ph: List[float]
    n: List[float]
    p: List[float]
    k: List[float]


def empty_agg() -> Agg:
    return Agg([], [], [], [], [], [])


def agg_add(agg: Agg, row: Dict[str, str]) -> None:
    m = _to_float(row.get("Soil_Moisture_%"))
    t = _to_float(row.get("Temperature_C"))
    ph = _to_float(row.get("pH_Level"))
    n = _to_float(row.get("Nitrogen_N"))
    p = _to_float(row.get("Phosphorus_P"))
    k = _to_float(row.get("Potassium_K"))

    if m is not None:
        agg.moisture.append(m)
    if t is not None:
        agg.temp.append(t)
    if ph is not None:
        agg.ph.append(ph)
    if n is not None:
        agg.n.append(n)
    if p is not None:
        agg.p.append(p)
    if k is not None:
        agg.k.append(k)


def build_profile(agg: Agg, low_p: float, high_p: float) -> Optional[Dict]:
    # Need at least a few samples to avoid nonsense.
    # Moisture/temp/ph are most important; but allow if NPK present.
    min_samples = 8
    if (
        len(agg.moisture) < min_samples
        and len(agg.temp) < min_samples
        and len(agg.ph) < min_samples
        and len(agg.n) < min_samples
        and len(agg.p) < min_samples
        and len(agg.k) < min_samples
    ):
        return None

    def band(values: List[float], clamp: Optional[Tuple[float, float]] = None) -> Optional[Tuple[float, float]]:
        if len(values) < min_samples:
            return None
        lo = percentile(values, low_p)
        hi = percentile(values, high_p)
        if clamp is not None:
            lo = max(clamp[0], min(clamp[1], lo))
            hi = max(clamp[0], min(clamp[1], hi))
        if hi < lo:
            lo, hi = hi, lo
        return (round(lo, 2), round(hi, 2))

    moisture = band(agg.moisture, (0.0, 100.0))
    temp = band(agg.temp, (-10.0, 60.0))
    ph = band(agg.ph, (3.5, 10.5))

    n = band(agg.n, (0.0, 300.0))
    p = band(agg.p, (0.0, 300.0))
    k = band(agg.k, (0.0, 300.0))

    if not moisture and not temp and not ph and not n and not p and not k:
        return None

    # Provide a safe fallback for missing metrics.
    def must(metric: Optional[Tuple[float, float]], fallback: Tuple[float, float]) -> Tuple[float, float]:
        return metric if metric is not None else fallback

    return {
        "moistureOptimal": list(must(moisture, (50.0, 70.0))),
        "tempOptimal": list(must(temp, (20.0, 30.0))),
        "phOptimal": list(must(ph, (6.0, 7.0))),
        "npkOptimal": {
            "nitrogen": list(must(n, (70.0, 130.0))),
            "phosphorus": list(must(p, (35.0, 65.0))),
            "potassium": list(must(k, (70.0, 120.0))),
        },
        "stats": {
            "count": max(
                len(agg.moisture),
                len(agg.temp),
                len(agg.ph),
                len(agg.n),
                len(agg.p),
                len(agg.k),
            ),
            "samples": {
                "moisture": len(agg.moisture),
                "temperature": len(agg.temp),
                "ph": len(agg.ph),
                "nitrogen": len(agg.n),
                "phosphorus": len(agg.p),
                "potassium": len(agg.k),
            },
        },
    }


def main() -> int:
    input_path = os.environ.get("CROP_PROFILES_INPUT", DEFAULT_INPUT)
    output_path = os.environ.get("CROP_PROFILES_OUTPUT", DEFAULT_OUTPUT)

    if not os.path.exists(input_path):
        print(f"❌ Input not found: {input_path}")
        return 1

    crops: Dict[str, Dict] = {}
    aggs_overall: Dict[str, Agg] = {}
    aggs_by_soil: Dict[str, Dict[str, Agg]] = {}

    with open(input_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            crop_raw = (row.get("Crop_Type") or "").strip()
            if not crop_raw:
                continue

            crop_key = canonical_key(crop_raw)
            soil_raw = (row.get("Soil_Type") or "").strip()
            soil_key = canonical_key(soil_raw) if soil_raw else ""

            if crop_key not in aggs_overall:
                aggs_overall[crop_key] = empty_agg()
            agg_add(aggs_overall[crop_key], row)

            if soil_key:
                if crop_key not in aggs_by_soil:
                    aggs_by_soil[crop_key] = {}
                if soil_key not in aggs_by_soil[crop_key]:
                    aggs_by_soil[crop_key][soil_key] = empty_agg()
                agg_add(aggs_by_soil[crop_key][soil_key], row)

            # Keep a display name if we don't have one
            if crop_key not in crops:
                crops[crop_key] = {"displayName": crop_raw}

    low_p = float(os.environ.get("CROP_PROFILES_P_LOW", "0.2"))
    high_p = float(os.environ.get("CROP_PROFILES_P_HIGH", "0.8"))

    out_crops: Dict[str, Dict] = {}

    for crop_key, meta in crops.items():
        overall = build_profile(aggs_overall.get(crop_key, empty_agg()), low_p, high_p)
        soils_out: Dict[str, Dict] = {}
        for soil_key, agg in (aggs_by_soil.get(crop_key) or {}).items():
            prof = build_profile(agg, low_p, high_p)
            if prof is not None:
                soils_out[soil_key] = prof

        if overall is None and not soils_out:
            continue

        out_crops[crop_key] = {
            "displayName": meta.get("displayName") or crop_key,
            "overall": overall,
            "soils": soils_out,
        }

    payload = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "file": os.path.relpath(input_path, ROOT).replace("\\", "/"),
            "percentiles": {"low": low_p, "high": high_p},
        },
        "crops": out_crops,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"✅ Wrote crop profiles: {output_path}")
    print(f"   Crops: {len(out_crops)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

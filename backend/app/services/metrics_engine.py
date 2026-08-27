"""Statistical engine: turns N raw LLM samples into the metrics the brief asks for
(mean, standard deviation, variance) plus the AEO-specific ratios derived from them.
"""

import math
from typing import List

import numpy as np
import pandas as pd

from backend.app.models.schemas import BrandMetrics, PromptEvaluationResult
from backend.app.core.logging import logger


class MetricsEngine:
    """Computes visibility, position, and composite AEO metrics for one brand
    over a batch of prompt evaluation results."""

    @staticmethod
    def calculate_metrics(results: List[PromptEvaluationResult], brand: str) -> BrandMetrics:
        n = len(results)
        if n == 0:
            return BrandMetrics(
                brand=brand, sample_size_n=0, visibility_rate=0.0, avg_position=0.0,
                position_variance=0.0, position_std_dev=0.0, top_of_mind_rate=0.0,
                share_of_voice=0.0, entropy_score=0.0, aeo_score=0.0,
            )

        rows = []
        for r in results:
            # Every brand's mention/rank/sentiment is read from the same parsed
            # entity list, so competitors get the exact same treatment as the
            # target brand instead of a second-class heuristic.
            entity = next((e for e in r.parsed_entities if e.brand_name.lower() == brand.lower()), None)
            rows.append({
                "mentioned": 1 if entity is not None else 0,
                "rank": entity.rank if entity is not None else np.nan,
                "is_top1": 1 if (entity is not None and entity.rank == 1) else 0,
                "sentiment": entity.sentiment if entity is not None else None,
                "total_brand_mentions": len(r.parsed_entities),
            })

        df = pd.DataFrame(rows)

        visibility_rate = float(df["mentioned"].mean() * 100.0)

        mentioned_ranks = df[df["mentioned"] == 1]["rank"].dropna()
        if len(mentioned_ranks) > 0:
            avg_position = float(mentioned_ranks.mean())
            position_variance = float(mentioned_ranks.var(ddof=1)) if len(mentioned_ranks) > 1 else 0.0
            position_std_dev = float(np.sqrt(position_variance))
        else:
            avg_position, position_variance, position_std_dev = 0.0, 0.0, 0.0

        top_of_mind_rate = float(df["is_top1"].mean() * 100.0)

        total_mentions_all_brands = df["total_brand_mentions"].sum()
        brand_mentions = int(df["mentioned"].sum())
        share_of_voice = float(
            (brand_mentions / total_mentions_all_brands * 100.0) if total_mentions_all_brands > 0 else 0.0
        )

        entropy_score = MetricsEngine._rank_entropy(df)

        pos_score = max(0.0, 100.0 - (avg_position - 1.0) * 25.0) if avg_position > 0 else 0.0
        positive_count = int((df["sentiment"] == "Positivo").sum())
        sentiment_score = float(positive_count / n * 100.0)
        aeo_score = float(0.4 * visibility_rate + 0.3 * pos_score + 0.3 * sentiment_score)

        logger.info(
            "metrics brand=%s n=%s visibility=%.1f avg_pos=%.2f std_dev=%.3f aeo_score=%.1f",
            brand, n, visibility_rate, avg_position, position_std_dev, aeo_score,
        )

        return BrandMetrics(
            brand=brand,
            sample_size_n=n,
            visibility_rate=round(visibility_rate, 2),
            avg_position=round(avg_position, 2),
            position_variance=round(position_variance, 4),
            position_std_dev=round(position_std_dev, 4),
            top_of_mind_rate=round(top_of_mind_rate, 2),
            share_of_voice=round(share_of_voice, 2),
            entropy_score=round(entropy_score, 3),
            aeo_score=round(aeo_score, 1),
        )

    @staticmethod
    def _rank_entropy(df: pd.DataFrame) -> float:
        """Shannon entropy H(X) = -sum(p*log2(p)) over discrete rank buckets.
        Low entropy means the brand's placement is highly predictable across
        the sample; high entropy means Gemini's answer varies a lot run to run
        - the probabilistic-model warning from the brief, made measurable."""
        buckets = []
        for _, row in df.iterrows():
            if row["mentioned"] == 0:
                buckets.append("NOT_MENTIONED")
            elif pd.isna(row["rank"]):
                buckets.append("UNKNOWN")
            elif row["rank"] == 1:
                buckets.append("RANK_1")
            elif row["rank"] == 2:
                buckets.append("RANK_2")
            elif row["rank"] == 3:
                buckets.append("RANK_3")
            else:
                buckets.append("RANK_4_PLUS")

        probs = pd.Series(buckets).value_counts(normalize=True).values
        return float(-sum(p * math.log2(p) for p in probs if p > 0))

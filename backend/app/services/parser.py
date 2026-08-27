"""Robust heuristic parser for entity extraction, ordinal ranking, and sentiment evaluation."""

import re
from typing import List, Optional, Tuple, Dict, Any
from backend.app.models.schemas import ExtractedEntity


class HeuristicParser:
    """Multi-pass entity and sentiment extractor with regex patterns and heuristic ranking."""

    DEFAULT_BRANDS = ["Linear", "Jira", "Asana", "Monday", "Notion", "GitHub", "ClickUp", "Trello"]

    # Sentiment indicators
    POSITIVE_KEYWORDS = [
        r"\b(mejor|excelente|r[aá]pido|superior|ultra[\s\-]?fast|eficiente|recomendad[oa]|est[aá]ndar|favorit[oa]|l[ií]der|imprescindible|best|fastest|top|streamlined|slick)\b"
    ]
    NEGATIVE_KEYWORDS = [
        r"\b(lento|complejo|pesado|fricci[oó]n|costoso|obsolet[oa]|dif[ií]cil|sobrecarga|bloqueos|clunky|bloated|slow|confusing|expensive)\b"
    ]

    def __init__(self, target_brand: str = "Linear", competitors: Optional[List[str]] = None):
        self.target_brand = target_brand
        self.known_brands = competitors if competitors else self.DEFAULT_BRANDS
        if self.target_brand not in self.known_brands:
            self.known_brands.insert(0, self.target_brand)

    def extract_entities(self, text: str) -> List[ExtractedEntity]:
        """Extracts brand mentions, determines character index and ordinal rank."""
        if not text or not text.strip():
            return []

        found_mentions: List[Dict[str, Any]] = []

        # 1. Numbered list pattern: e.g. "1. Linear", "1) Jira", "**1. Linear**"
        list_pattern = re.compile(
            r"(?:^|\n)\s*(?:[\*#\-_]*\s*)?(\d+)[.)\]\:\-]\s*[\*#\-_]*\s*([A-Za-z0-9\.\s\-_]+?)(?=\n|:|\-|\—|\(|\.|\Z)",
            re.MULTILINE | re.IGNORECASE
        )
        
        for match in list_pattern.finditer(text):
            rank_num = int(match.group(1))
            matched_segment = match.group(2).strip()
            
            for brand in self.known_brands:
                brand_regex = re.compile(rf"\b{re.escape(brand)}\b", re.IGNORECASE)
                if brand_regex.search(matched_segment):
                    found_mentions.append({
                        "brand_name": brand,
                        "position_index": match.start(),
                        "explicit_rank": rank_num,
                        "context": text[max(0, match.start() - 50): min(len(text), match.end() + 150)]
                    })

        # 2. General regex search for all known brands anywhere in the text
        for brand in self.known_brands:
            brand_regex = re.compile(rf"\b{re.escape(brand)}(?: Software|\.com)?\b", re.IGNORECASE)
            for match in brand_regex.finditer(text):
                # Avoid duplicate matches for same brand in same approximate location
                if not any(m["brand_name"].lower() == brand.lower() and abs(m["position_index"] - match.start()) < 30 for m in found_mentions):
                    found_mentions.append({
                        "brand_name": brand,
                        "position_index": match.start(),
                        "explicit_rank": None,
                        "context": text[max(0, match.start() - 50): min(len(text), match.end() + 150)]
                    })

        # Sort by earliest position in response
        found_mentions.sort(key=lambda x: x["position_index"])

        # Deduplicate per brand keeping first occurrence
        seen_brands = set()
        deduped: List[Dict[str, Any]] = []
        for item in found_mentions:
            b_lower = item["brand_name"].lower()
            if b_lower not in seen_brands:
                seen_brands.add(b_lower)
                deduped.append(item)

        # Build output objects with derived ranking
        results: List[ExtractedEntity] = []
        for index, item in enumerate(deduped):
            rank = item["explicit_rank"] if item["explicit_rank"] is not None else (index + 1)
            sentiment = self._evaluate_sentiment(item["context"])
            results.append(ExtractedEntity(
                brand_name=item["brand_name"],
                position_index=item["position_index"],
                rank=rank,
                sentiment=sentiment,
                confidence_score=0.95 if item["explicit_rank"] is not None else 0.85,
                context_snippet=item["context"]
            ))

        return results

    def parse_target_brand_status(self, text: str) -> Tuple[bool, Optional[int], str, List[str]]:
        """Parses whether target brand was mentioned, its rank, sentiment, and other brands."""
        entities = self.extract_entities(text)
        
        target_entity = next(
            (e for e in entities if e.brand_name.lower() == self.target_brand.lower()),
            None
        )
        
        is_mentioned = target_entity is not None
        rank = target_entity.rank if target_entity else None
        sentiment = target_entity.sentiment if target_entity else "Neutro"
        
        all_brands = [e.brand_name for e in entities]
        
        return is_mentioned, rank, sentiment, all_brands

    def _evaluate_sentiment(self, snippet: str) -> str:
        """Determines sentiment using regex keyword density heuristics."""
        if not snippet:
            return "Neutro"
            
        pos_count = sum(len(re.findall(pat, snippet, re.IGNORECASE)) for pat in self.POSITIVE_KEYWORDS)
        neg_count = sum(len(re.findall(pat, snippet, re.IGNORECASE)) for pat in self.NEGATIVE_KEYWORDS)

        if pos_count > neg_count and pos_count > 0:
            return "Positivo"
        elif neg_count > pos_count:
            return "Negativo"
        return "Neutro"

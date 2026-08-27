"""Unit tests for the heuristic entity parser."""

import pytest
from backend.app.services.parser import HeuristicParser


def test_parser_extracts_numbered_list():
    parser = HeuristicParser(target_brand="Linear")
    text = """
    Here are the top project management tools:
    1. Linear - Best in class speed and keyboard shortcuts.
    2. Jira - Enterprise standard for agile teams.
    3. Asana - Great for marketing squads.
    """
    entities = parser.extract_entities(text)
    
    assert len(entities) >= 3
    assert entities[0].brand_name == "Linear"
    assert entities[0].rank == 1
    assert entities[0].sentiment == "Positivo"

    assert entities[1].brand_name == "Jira"
    assert entities[1].rank == 2


def test_parser_handles_unmentioned_brand():
    parser = HeuristicParser(target_brand="Linear")
    text = "We recommend Trello and ClickUp for lightweight board management."
    
    is_mentioned, rank, sentiment, all_brands = parser.parse_target_brand_status(text)
    assert not is_mentioned
    assert rank is None
    assert sentiment == "Neutro"


def test_parser_evaluates_negative_sentiment():
    parser = HeuristicParser(target_brand="Jira")
    text = "1. Jira is clunky, slow, and expensive for modern engineering squads."
    
    is_mentioned, rank, sentiment, _ = parser.parse_target_brand_status(text)
    assert is_mentioned
    assert sentiment == "Negativo"

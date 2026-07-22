"""
Pytest Fixtures and Configuration for Buildly Brain Tests

Provides mock databases, sample data, and reusable test components.
"""

import pytest
import json
import os
from datetime import datetime
from unittest.mock import Mock, MagicMock, patch
import numpy as np


# ============================================================
# FIXTURES: Mock Data
# ============================================================

@pytest.fixture
def mock_lesson_data():
    """Sample lesson for testing"""
    return {
        'id': 'lesson-001',
        'rdo_id': 'RDO-20260814-001',
        'obra_id': 'STAGING-001',
        'data': '2026-08-14',
        'tipo_evento': 'ATRASO_MATERIAL',
        'resultado': 'sucesso',
        'resumo': 'Cimento chegou 15 dias atrasado. Reordenação de atividades resolveu.',
        'decisoes': ['reordenar_atividades', 'avisar_cliente'],
        'problemas': ['atraso_fornecedor', 'chuva_excessiva'],
        'causas': ['fornecedor_abc', 'sazonalidade'],
        'solucoes': ['reordenacao_tarefas', 'contratacao_mao_obra'],
        'pendencias': ['revisar_fornecedor'],
        'riscos': ['mesmo_fornecedor_futuro'],
        'licoes': ['Fornecedor ABC não respeita prazos em meses chuvosos'],
        'tags': ['fornecedor', 'chuva', 'atraso_material', 'agosto'],
        'impacto_economia': 100000.0,
        'impacto_prazo_dias': 8.0,
        'impacto_qualidade': 'NENHUM',
        'confiabilidade': 0.85,
        'criado_em': '2026-08-14T10:30:00Z'
    }


@pytest.fixture
def mock_lessons_list(mock_lesson_data):
    """List of sample lessons"""
    lessons = [mock_lesson_data]

    # Add variation
    lesson2 = mock_lesson_data.copy()
    lesson2['rdo_id'] = 'RDO-20260807-001'
    lesson2['tipo_evento'] = 'ATRASO_MÃO_OBRA'
    lesson2['confiabilidade'] = 0.72
    lesson2['data'] = '2026-08-07'
    lessons.append(lesson2)

    lesson3 = mock_lesson_data.copy()
    lesson3['rdo_id'] = 'RDO-20260801-001'
    lesson3['tipo_evento'] = 'QUALIDADE'
    lesson3['resultado'] = 'falha'
    lesson3['confiabilidade'] = 0.65
    lesson3['data'] = '2026-08-01'
    lessons.append(lesson3)

    return lessons


@pytest.fixture
def mock_embedding_vector():
    """Sample 1536-dim embedding vector"""
    np.random.seed(42)
    return np.random.randn(1536).tolist()


@pytest.fixture
def mock_query_filters():
    """Sample query filters"""
    return {
        'tipo_evento': ['ATRASO_MATERIAL'],
        'tags': ['chuva'],
        'resultado': 'sucesso',
        'min_confiabilidade': 0.7,
        'periodo_dias': 90,
        'buscar_por': 'solucoes'
    }


# ============================================================
# FIXTURES: Mock Neo4j
# ============================================================

@pytest.fixture
def mock_neo4j_driver():
    """Mock Neo4j driver"""
    mock_driver = MagicMock()
    mock_session = MagicMock()
    mock_driver.session.return_value.__enter__.return_value = mock_session
    return mock_driver


@pytest.fixture
def mock_neo4j_session(mock_lessons_list):
    """Mock Neo4j session with sample data"""
    mock_session = MagicMock()

    # Mock run() to return lessons
    mock_result = MagicMock()
    mock_result.__iter__ = lambda self: iter([
        {'lesson': lesson} for lesson in mock_lessons_list
    ])

    mock_session.run.return_value = mock_result
    return mock_session


# ============================================================
# FIXTURES: Mock Qdrant
# ============================================================

@pytest.fixture
def mock_qdrant_client():
    """Mock Qdrant client"""
    mock_client = MagicMock()

    # Mock search results
    mock_point = MagicMock()
    mock_point.id = 1
    mock_point.score = 0.92
    mock_point.payload = {
        'rdo_id': 'RDO-20260814-001',
        'tipo_evento': 'ATRASO_MATERIAL',
        'confiabilidade': 0.85,
        'criado_em': '2026-08-14T10:30:00Z'
    }

    mock_client.search.return_value = [mock_point]
    mock_client.get_collections.return_value.collections = []

    return mock_client


# ============================================================
# FIXTURES: Mock Claude API
# ============================================================

@pytest.fixture
def mock_claude_client():
    """Mock Claude client"""
    mock_client = MagicMock()

    # Mock message response
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"tipo_evento": ["ATRASO_MATERIAL"], "tags": ["chuva"]}')]

    mock_client.messages.create.return_value = mock_response

    return mock_client


# ============================================================
# FIXTURES: Mock Redis
# ============================================================

@pytest.fixture
def mock_redis():
    """Mock Redis cache"""
    mock_cache = MagicMock()
    mock_cache.get.return_value = None  # Cache miss by default
    mock_cache.set.return_value = True
    return mock_cache


# ============================================================
# FIXTURES: Mock PostgreSQL
# ============================================================

@pytest.fixture
def mock_psycopg2_connection():
    """Mock PostgreSQL connection"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.return_value = []
    return mock_conn


# ============================================================
# FIXTURES: Integration Mocks
# ============================================================

@pytest.fixture
def mock_extraction_pipeline(mock_neo4j_driver, mock_claude_client):
    """Mock extraction pipeline with all dependencies"""
    from scripts.brain_extraction_pipeline import BrainExtractionPipeline

    pipeline = MagicMock(spec=BrainExtractionPipeline)
    pipeline.neo4j_driver = mock_neo4j_driver
    pipeline.claude_client = mock_claude_client

    return pipeline


@pytest.fixture
def mock_embeddings_pipeline(mock_neo4j_driver, mock_qdrant_client, mock_claude_client):
    """Mock embeddings pipeline with all dependencies"""
    from scripts.brain_embeddings import BrainEmbeddingsPipeline

    pipeline = MagicMock(spec=BrainEmbeddingsPipeline)
    pipeline.neo4j_driver = mock_neo4j_driver
    pipeline.qdrant_client = mock_qdrant_client
    pipeline.claude_client = mock_claude_client

    return pipeline


@pytest.fixture
def mock_semantic_search(mock_neo4j_driver, mock_qdrant_client, mock_claude_client):
    """Mock semantic search with all dependencies"""
    from scripts.brain_semantic_search import BrainSemanticSearch

    search = MagicMock(spec=BrainSemanticSearch)
    search.neo4j_driver = mock_neo4j_driver
    search.qdrant_client = mock_qdrant_client
    search.claude_client = mock_claude_client

    return search


@pytest.fixture
def mock_query_translator(mock_claude_client):
    """Mock query translator"""
    from scripts.brain_query_translator import BrainQueryTranslator

    translator = MagicMock(spec=BrainQueryTranslator)
    translator.claude_client = mock_claude_client

    return translator


# ============================================================
# FIXTURES: Environment Setup
# ============================================================

@pytest.fixture(autouse=True)
def setup_env():
    """Setup test environment variables"""
    os.environ['NEO4J_URI'] = 'neo4j://localhost:7687'
    os.environ['NEO4J_USER'] = 'neo4j'
    os.environ['NEO4J_PASSWORD'] = 'test_password'
    os.environ['QDRANT_URL'] = 'http://localhost:6333'
    os.environ['QDRANT_API_KEY'] = 'test_key'
    os.environ['CLAUDE_API_KEY'] = 'test_key'

    yield

    # Cleanup


# ============================================================
# FIXTURES: Database Setup/Teardown
# ============================================================

@pytest.fixture
def test_db():
    """Setup test database"""
    # In real scenario, would create test DB
    test_db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'buildly_test',
        'user': 'test_user',
        'password': 'test_pass'
    }
    yield test_db_config
    # Teardown: drop test DB


# ============================================================
# PYTEST CONFIG
# ============================================================

def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )


# ============================================================
# UTILITIES FOR TESTS
# ============================================================

@pytest.fixture
def assert_performance():
    """Helper to assert performance metrics"""
    def _assert(elapsed_ms, max_ms, metric_name="operation"):
        assert elapsed_ms < max_ms, f"{metric_name} took {elapsed_ms}ms (max: {max_ms}ms)"
    return _assert


@pytest.fixture
def create_mock_response():
    """Helper to create mock responses"""
    def _create(data, status=200):
        mock_response = MagicMock()
        mock_response.status_code = status
        mock_response.json.return_value = data
        mock_response.text = json.dumps(data)
        return mock_response
    return _create

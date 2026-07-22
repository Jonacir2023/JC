"""
Tests for Brain Query Translator (Phase 3.3)

Tests natural language query parsing and filter extraction.
"""

import pytest
import json
from unittest.mock import patch, MagicMock


class TestBrainQueryTranslator:
    """Test suite for BrainQueryTranslator"""

    @pytest.mark.unit
    def test_translator_initialization(self, mock_claude_client):
        """Test query translator initializes correctly"""
        from scripts.brain_query_translator import BrainQueryTranslator

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()

            assert translator.claude_client is not None

    @pytest.mark.unit
    def test_translate_delay_query(self, mock_claude_client):
        """Test translating query about material delays"""
        from scripts.brain_query_translator import BrainQueryTranslator

        # Mock Claude response
        response_text = '''
        {
            "tipo_evento": ["ATRASO_MATERIAL"],
            "tags": ["chuva"],
            "resultado": null,
            "buscar_por": null
        }
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Quando tivemos atraso por chuva?")

            assert filters.tipo_evento == ["ATRASO_MATERIAL"]
            assert "chuva" in filters.tags
            assert filters.resultado is None

    @pytest.mark.unit
    def test_translate_success_solutions_query(self, mock_claude_client):
        """Test translating query about successful solutions"""
        from scripts.brain_query_translator import BrainQueryTranslator

        response_text = '''
        {
            "tipo_evento": null,
            "tags": null,
            "resultado": "sucesso",
            "buscar_por": "soluções",
            "impacto_min": 50000
        }
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Soluções que funcionaram para economia")

            assert filters.resultado == "sucesso"
            assert filters.buscar_por == "soluções"
            assert filters.impacto_min == 50000

    @pytest.mark.unit
    def test_translate_impact_query(self, mock_claude_client):
        """Test translating query about economic impact"""
        from scripts.brain_query_translator import BrainQueryTranslator

        response_text = '''
        {
            "tipo_evento": null,
            "tags": null,
            "resultado": "sucesso",
            "buscar_por": "impacto",
            "periodo_dias": 90,
            "impacto_min": 100000
        }
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Maiores economias nos últimos 90 dias")

            assert filters.periodo_dias == 90
            assert filters.impacto_min == 100000
            assert filters.resultado == "sucesso"

    @pytest.mark.unit
    def test_translate_quality_failure_query(self, mock_claude_client):
        """Test translating query about quality failures"""
        from scripts.brain_query_translator import BrainQueryTranslator

        response_text = '''
        {
            "tipo_evento": ["QUALIDADE"],
            "tags": null,
            "resultado": "falha",
            "buscar_por": null
        }
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Casos de qualidade que falharam")

            assert filters.tipo_evento == ["QUALIDADE"]
            assert filters.resultado == "falha"

    @pytest.mark.unit
    def test_query_filters_to_dict(self, mock_claude_client):
        """Test QueryFilters conversion to dictionary"""
        from scripts.brain_query_translator import QueryFilters

        filters = QueryFilters(
            tipo_evento=["ATRASO_MATERIAL"],
            tags=["chuva"],
            resultado="sucesso",
            min_confiabilidade=0.7,
            periodo_dias=90,
            impacto_min=100000,
            buscar_por="impacto"
        )

        filters_dict = filters.to_dict()

        assert filters_dict['tipo_evento'] == ["ATRASO_MATERIAL"]
        assert filters_dict['tags'] == ["chuva"]
        assert filters_dict['resultado'] == "sucesso"
        assert filters_dict['min_confiabilidade'] == 0.7
        assert filters_dict['periodo_dias'] == 90
        assert filters_dict['impacto_min'] == 100000
        assert filters_dict['buscar_por'] == "impacto"

    @pytest.mark.unit
    def test_event_type_enum(self):
        """Test EventType enum values"""
        from scripts.brain_query_translator import EventType

        assert EventType.ATRASO_MATERIAL.value == "ATRASO_MATERIAL"
        assert EventType.ATRASO_MAO_OBRA.value == "ATRASO_MÃO_OBRA"
        assert EventType.QUALIDADE.value == "QUALIDADE"
        assert EventType.SEGURANCA.value == "SEGURANÇA"
        assert EventType.CUSTO.value == "CUSTO"
        assert EventType.ACIDENTE.value == "ACIDENTE"
        assert EventType.CLIMA.value == "CLIMA"
        assert EventType.EQUIPAMENTO.value == "EQUIPAMENTO"

    @pytest.mark.unit
    def test_resultado_enum(self):
        """Test Resultado enum values"""
        from scripts.brain_query_translator import Resultado

        assert Resultado.SUCESSO.value == "sucesso"
        assert Resultado.PARCIAL.value == "parcial"
        assert Resultado.FALHA.value == "falha"

    @pytest.mark.unit
    def test_translate_to_cypher_filter_single_event_type(self, mock_claude_client):
        """Test converting QueryFilters to Cypher WHERE clause"""
        from scripts.brain_query_translator import BrainQueryTranslator, QueryFilters

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = QueryFilters(
                tipo_evento=["ATRASO_MATERIAL"]
            )

            cypher_filter = translator.translate_to_cypher_filter(filters)

            assert "ATRASO_MATERIAL" in cypher_filter
            assert "tipo_evento" in cypher_filter

    @pytest.mark.unit
    def test_translate_to_cypher_filter_multiple_conditions(self, mock_claude_client):
        """Test Cypher filter with multiple conditions"""
        from scripts.brain_query_translator import BrainQueryTranslator, QueryFilters

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = QueryFilters(
                tipo_evento=["ATRASO_MATERIAL"],
                resultado="sucesso",
                min_confiabilidade=0.7
            )

            cypher_filter = translator.translate_to_cypher_filter(filters)

            assert "ATRASO_MATERIAL" in cypher_filter
            assert "sucesso" in cypher_filter
            assert "0.7" in cypher_filter
            assert " AND " in cypher_filter

    @pytest.mark.unit
    def test_translate_to_qdrant_filter_single_event(self, mock_claude_client):
        """Test converting QueryFilters to Qdrant filter"""
        from scripts.brain_query_translator import BrainQueryTranslator, QueryFilters

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = QueryFilters(
                tipo_evento=["ATRASO_MATERIAL"]
            )

            qdrant_filter = translator.translate_to_qdrant_filter(filters)

            assert qdrant_filter is not None
            assert isinstance(qdrant_filter, dict)

    @pytest.mark.unit
    def test_translate_to_qdrant_filter_multiple_conditions(self, mock_claude_client):
        """Test Qdrant filter with multiple conditions"""
        from scripts.brain_query_translator import BrainQueryTranslator, QueryFilters

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = QueryFilters(
                tipo_evento=["ATRASO_MATERIAL"],
                resultado="sucesso",
                impacto_min=50000
            )

            qdrant_filter = translator.translate_to_qdrant_filter(filters)

            assert qdrant_filter is not None
            assert "must" in qdrant_filter or "key" in qdrant_filter

    @pytest.mark.unit
    def test_translate_to_qdrant_filter_empty(self, mock_claude_client):
        """Test Qdrant filter with no conditions returns None"""
        from scripts.brain_query_translator import BrainQueryTranslator, QueryFilters

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = QueryFilters()  # Empty filters

            qdrant_filter = translator.translate_to_qdrant_filter(filters)

            assert qdrant_filter is None


class TestQueryTranslatorErrors:
    """Test error handling in query translator"""

    @pytest.mark.unit
    def test_handle_invalid_json_response(self, mock_claude_client):
        """Test handling invalid JSON from Claude"""
        from scripts.brain_query_translator import BrainQueryTranslator

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Invalid JSON {")]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Test query")

            # Should return empty QueryFilters on JSON error
            assert filters is not None

    @pytest.mark.unit
    def test_handle_claude_api_error(self, mock_claude_client):
        """Test handling Claude API failures"""
        from scripts.brain_query_translator import BrainQueryTranslator

        mock_claude_client.messages.create.side_effect = Exception("API Error")

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()

            with pytest.raises(Exception):
                translator.translate("Test query")

    @pytest.mark.unit
    def test_handle_markdown_wrapped_json(self, mock_claude_client):
        """Test parsing JSON wrapped in markdown blocks"""
        from scripts.brain_query_translator import BrainQueryTranslator

        response_text = '''
        ```json
        {
            "tipo_evento": ["ATRASO_MATERIAL"],
            "tags": null,
            "resultado": null
        }
        ```
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Test query")

            assert filters.tipo_evento == ["ATRASO_MATERIAL"]


class TestQueryTranslatorIntegration:
    """Integration tests for query translator"""

    @pytest.mark.integration
    def test_complex_query_translation(self, mock_claude_client):
        """Test translating complex multi-field query"""
        from scripts.brain_query_translator import BrainQueryTranslator

        response_text = '''
        {
            "tipo_evento": ["ATRASO_MATERIAL", "CUSTO"],
            "tags": ["fornecedor", "chuva"],
            "resultado": "sucesso",
            "buscar_por": "impacto",
            "periodo_dias": 180,
            "impacto_min": 200000,
            "min_confiabilidade": 0.75
        }
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate(
                "Encontre atrasos de material ou custo que funcionaram bem com fornecedores nos últimos 6 meses"
            )

            assert len(filters.tipo_evento) == 2
            assert len(filters.tags) == 2
            assert filters.periodo_dias == 180
            assert filters.min_confiabilidade == 0.75

    @pytest.mark.integration
    def test_filter_chain_for_search(self, mock_claude_client):
        """Test using translated filters for search"""
        from scripts.brain_query_translator import BrainQueryTranslator

        response_text = '''
        {
            "tipo_evento": ["QUALIDADE"],
            "resultado": "falha",
            "min_confiabilidade": 0.8
        }
        '''

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=response_text)]
        mock_claude_client.messages.create.return_value = mock_response

        with patch('scripts.brain_query_translator.Anthropic', return_value=mock_claude_client):
            translator = BrainQueryTranslator()
            filters = translator.translate("Casos de falha de qualidade com alta confiança")

            # Generate both Cypher and Qdrant filters
            cypher_filter = translator.translate_to_cypher_filter(filters)
            qdrant_filter = translator.translate_to_qdrant_filter(filters)

            assert cypher_filter is not None
            assert qdrant_filter is not None
            assert len(cypher_filter) > 0

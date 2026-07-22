#!/usr/bin/env python3
"""
Brain Query Translator

Converte queries em linguagem natural para filtros estruturados.
Usa Claude para entity extraction com poucos exemplos.

Usage:
    python brain_query_translator.py "Quando tivemos atraso por chuva?"
    python brain_query_translator.py "Soluções que economizaram mais"
    python brain_query_translator.py "Casos de sucesso" --extract-entities
"""

import os
import json
import logging
from typing import List, Optional, Dict
from dataclasses import dataclass
from enum import Enum

from anthropic import Anthropic

# ============================================================
# CONFIG
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

# ============================================================
# ENUMS & DATACLASSES
# ============================================================

class EventType(str, Enum):
    """Tipos de eventos"""
    ATRASO_MATERIAL = "ATRASO_MATERIAL"
    ATRASO_MAO_OBRA = "ATRASO_MÃO_OBRA"
    QUALIDADE = "QUALIDADE"
    SEGURANCA = "SEGURANÇA"
    CUSTO = "CUSTO"
    ACIDENTE = "ACIDENTE"
    CLIMA = "CLIMA"
    EQUIPAMENTO = "EQUIPAMENTO"
    OUTRO = "OUTRO"


class Resultado(str, Enum):
    """Resultados possíveis"""
    SUCESSO = "sucesso"
    PARCIAL = "parcial"
    FALHA = "falha"


@dataclass
class QueryFilters:
    """Filtros estruturados extraídos de query"""
    tipo_evento: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    resultado: Optional[str] = None
    min_confiabilidade: float = 0.0
    max_confiabilidade: float = 1.0
    periodo_dias: Optional[int] = None
    impacto_min: Optional[float] = None
    impacto_max: Optional[float] = None
    buscar_por: Optional[str] = None  # "soluções", "causas", "impacto"

    def to_dict(self) -> Dict:
        """Converter para dicionário"""
        return {
            'tipo_evento': self.tipo_evento,
            'tags': self.tags,
            'resultado': self.resultado,
            'min_confiabilidade': self.min_confiabilidade,
            'max_confiabilidade': self.max_confiabilidade,
            'periodo_dias': self.periodo_dias,
            'impacto_min': self.impacto_min,
            'impacto_max': self.impacto_max,
            'buscar_por': self.buscar_por
        }


# ============================================================
# QUERY TRANSLATOR
# ============================================================

class BrainQueryTranslator:
    """
    Traduz queries em linguagem natural para filtros estruturados.

    Exemplos:
      "Quando tivemos atraso por chuva?"
        → tipo_evento=["ATRASO_MATERIAL"], tags=["chuva"]

      "Soluções que funcionaram"
        → resultado="sucesso", buscar_por="soluções"

      "Maiores economias nos últimos 60 dias"
        → periodo_dias=60, impacto_min=50000, buscar_por="impacto"
    """

    def __init__(self):
        """Inicializar Claude client"""
        self.claude_client = Anthropic(api_key=CLAUDE_API_KEY)
        logger.info("✓ Query translator initialized")

    def translate(self, query: str) -> QueryFilters:
        """Traduzir query em filtros estruturados"""
        logger.info(f"Translating query: {query[:50]}...")

        # Build prompt com few-shot examples
        prompt = self._build_prompt(query)

        # Call Claude
        response = self.claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse response
        response_text = response.content[0].text
        logger.info(f"Claude response: {response_text[:100]}...")

        filters = self._parse_response(response_text)

        logger.info(f"✓ Extracted filters: {filters.to_dict()}")

        return filters

    def _build_prompt(self, query: str) -> str:
        """Construir prompt com few-shot examples"""
        return f"""
Você é um assistente que converte perguntas em linguagem natural sobre um banco de conhecimento operacional (Brain) para filtros estruturados.

TIPOS DE EVENTOS VÁLIDOS:
- ATRASO_MATERIAL
- ATRASO_MÃO_OBRA
- QUALIDADE
- SEGURANÇA
- CUSTO
- ACIDENTE
- CLIMA
- EQUIPAMENTO
- OUTRO

RESULTADOS VÁLIDOS:
- sucesso
- parcial
- falha

TAGS COMUNS:
- chuva, fornecedor, equipamento, acidente, segurança, qualidade, custo, prazo, estrutura, fundação, alvenaria, cobertura, acabamento

EXEMPLOS DE EXTRAÇÃO:

Query: "Quando tivemos atraso por chuva?"
Resposta:
{{
  "tipo_evento": ["ATRASO_MATERIAL"],
  "tags": ["chuva"],
  "resultado": null,
  "buscar_por": null,
  "periodo_dias": null,
  "impacto_min": null
}}

Query: "Soluções que funcionaram para economia"
Resposta:
{{
  "tipo_evento": null,
  "tags": null,
  "resultado": "sucesso",
  "buscar_por": "soluções",
  "impacto_min": 50000
}}

Query: "Maiores economias nos últimos 90 dias"
Resposta:
{{
  "tipo_evento": null,
  "tags": null,
  "resultado": "sucesso",
  "buscar_por": "impacto",
  "periodo_dias": 90,
  "impacto_min": 100000
}}

Query: "Casos de qualidade que falharam"
Resposta:
{{
  "tipo_evento": ["QUALIDADE"],
  "tags": null,
  "resultado": "falha",
  "buscar_por": null
}}

AGORA EXTRAIA FILTROS PARA ESTA QUERY:

Query: "{query}"

Retorne APENAS o JSON (sem explicações). Se não tiver informação para um campo, deixe null.
"""

    def _parse_response(self, response_text: str) -> QueryFilters:
        """Parsear resposta Claude em QueryFilters"""
        try:
            # Extract JSON from response
            # Claude might wrap it in markdown blocks
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()

            data = json.loads(json_str)

            # Create QueryFilters from data
            filters = QueryFilters(
                tipo_evento=data.get('tipo_evento'),
                tags=data.get('tags'),
                resultado=data.get('resultado'),
                min_confiabilidade=data.get('min_confiabilidade', 0.0),
                max_confiabilidade=data.get('max_confiabilidade', 1.0),
                periodo_dias=data.get('periodo_dias'),
                impacto_min=data.get('impacto_min'),
                impacto_max=data.get('impacto_max'),
                buscar_por=data.get('buscar_por')
            )

            logger.info(f"✓ Parsed filters: {filters.to_dict()}")
            return filters

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {e}")
            logger.error(f"Response was: {response_text}")

            # Return empty filters
            return QueryFilters()

    # ============================================================
    # UTILITY METHODS
    # ============================================================

    def translate_to_cypher_filter(self, filters: QueryFilters) -> str:
        """Converter QueryFilters em Cypher WHERE clause"""
        conditions = []

        if filters.tipo_evento:
            tipos = "', '".join(filters.tipo_evento)
            conditions.append(f"lesson.tipo_evento IN ['{tipos}']")

        if filters.tags:
            tags = "', '".join(filters.tags)
            conditions.append(f"ANY(tag IN lesson.tags WHERE tag IN ['{tags}'])")

        if filters.resultado:
            conditions.append(f"lesson.resultado = '{filters.resultado}'")

        if filters.min_confiabilidade > 0:
            conditions.append(f"lesson.confiabilidade >= {filters.min_confiabilidade}")

        if filters.max_confiabilidade < 1.0:
            conditions.append(f"lesson.confiabilidade <= {filters.max_confiabilidade}")

        if filters.periodo_dias:
            conditions.append(
                f"lesson.criado_em > datetime.now() - duration('P{filters.periodo_dias}D')"
            )

        if filters.impacto_min:
            conditions.append(f"lesson.impacto_economia >= {filters.impacto_min}")

        if filters.impacto_max:
            conditions.append(f"lesson.impacto_economia <= {filters.impacto_max}")

        # Combine conditions
        if conditions:
            return " AND ".join(conditions)
        else:
            return ""

    def translate_to_qdrant_filter(self, filters: QueryFilters) -> Dict:
        """Converter QueryFilters em Qdrant filter condition"""
        conditions = []

        if filters.tipo_evento:
            conditions.append({
                "key": "tipo_evento",
                "match": {"any": {"options": filters.tipo_evento}}
            })

        if filters.tags:
            conditions.append({
                "key": "tags",
                "match": {"any": {"options": filters.tags}}
            })

        if filters.resultado:
            conditions.append({
                "key": "resultado",
                "match": {"value": filters.resultado}
            })

        if filters.min_confiabilidade > 0:
            conditions.append({
                "key": "confiabilidade",
                "range": {"gte": filters.min_confiabilidade}
            })

        if filters.impacto_min:
            conditions.append({
                "key": "impacto_economia",
                "range": {"gte": filters.impacto_min}
            })

        # Return None if no filters (Qdrant accepts None for all results)
        if not conditions:
            return None

        # If single condition, return it
        if len(conditions) == 1:
            return conditions[0]

        # If multiple, combine with AND
        return {"must": conditions}


# ============================================================
# CLI & TESTING
# ============================================================

if __name__ == "__main__":
    import sys

    translator = BrainQueryTranslator()

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    query = sys.argv[1]

    # Parse arguments
    extract_entities = "--extract-entities" in sys.argv
    to_cypher = "--to-cypher" in sys.argv
    to_qdrant = "--to-qdrant" in sys.argv

    # Translate query
    filters = translator.translate(query)

    # Print results
    print(json.dumps(filters.to_dict(), indent=2, ensure_ascii=False))

    if to_cypher:
        cypher_filter = translator.translate_to_cypher_filter(filters)
        print(f"\nCypher WHERE clause:\n{cypher_filter}")

    if to_qdrant:
        qdrant_filter = translator.translate_to_qdrant_filter(filters)
        print(f"\nQdrant filter:\n{json.dumps(qdrant_filter, indent=2)}")

    logger.info("✓ Done")

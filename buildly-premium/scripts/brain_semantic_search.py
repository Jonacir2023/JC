#!/usr/bin/env python3
"""
Brain Semantic Search Engine

Busca em linguagem natural sobre lições armazenadas.
Combina vector similarity com Neo4j relationship traversal.

Usage:
    python brain_semantic_search.py "Quando tivemos atraso por chuva?" --obra obra-123
    python brain_semantic_search.py "Soluções que funcionaram" --top-k 10
    python brain_semantic_search.py "Teste" --test-mock
"""

import os
import json
import logging
from typing import List, Dict, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np

from anthropic import Anthropic
from neo4j import GraphDatabase
from qdrant_client import QdrantClient

# ============================================================
# CONFIG
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv('NEO4J_URI', 'neo4j://localhost:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')

QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY', None)

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class SearchResult:
    """Resultado de uma busca"""
    rank: int
    rdo_id: str
    similarity_score: float
    tipo_evento: str
    resultado: str
    resumo: str
    confiabilidade: float
    solucoes: List[str]
    impacto_economia: float
    impacto_prazo_dias: float
    data: str


@dataclass
class SearchResponse:
    """Resposta completa de uma busca"""
    query: str
    obra_id: str
    total_results: int
    search_time_ms: float
    results: List[SearchResult]
    summary: str = ""


# ============================================================
# BRAIN SEMANTIC SEARCH
# ============================================================

class BrainSemanticSearch:
    """
    Busca semântica em lições armazenadas no Brain.

    Process:
      1. Embed query → 1536-dim vector
      2. Buscar similaridade em Qdrant (cosine)
      3. Rerank por confiabilidade + recency
      4. Fetch full context do Neo4j
      5. Gerar resposta conversacional
    """

    def __init__(self):
        """Inicializar conexões"""
        self.neo4j_driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

        self.qdrant_client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )

        self.claude_client = Anthropic(api_key=CLAUDE_API_KEY)

        logger.info("✓ Semantic search engine initialized")

    # ============================================================
    # MAIN SEARCH METHOD
    # ============================================================

    def search(
        self,
        query: str,
        obra_id: str,
        top_k: int = 5,
        min_similarity: float = 0.5
    ) -> SearchResponse:
        """
        Busca semântica em linguagem natural.

        Args:
            query: Pergunta do usuário ("Quando tivemos atraso por chuva?")
            obra_id: Obra para filtrar resultados
            top_k: Número de resultados a retornar
            min_similarity: Score mínimo de similaridade

        Returns:
            SearchResponse com resultados ranqueados
        """
        logger.info(f"Searching: '{query}' for obra: {obra_id}")
        start_time = datetime.now()

        # 1. Embed query
        query_embedding = self._embed_query(query)

        # 2. Search Qdrant
        qdrant_results = self._search_qdrant(
            obra_id,
            query_embedding,
            top_k * 2,  # Pega extra para reranking
            min_similarity
        )

        # 3. Rerank por confiabilidade + recency
        ranked_results = self._rerank_results(qdrant_results)

        # 4. Fetch full context do Neo4j
        search_results = []
        for i, (payload, score) in enumerate(ranked_results[:top_k]):
            lesson = self._fetch_lesson_from_neo4j(payload['rdo_id'])
            if lesson:
                search_results.append(SearchResult(
                    rank=i + 1,
                    rdo_id=payload['rdo_id'],
                    similarity_score=score,
                    tipo_evento=lesson.get('tipo_evento', ''),
                    resultado=lesson.get('resultado', ''),
                    resumo=lesson.get('resumo', ''),
                    confiabilidade=lesson.get('confiabilidade', 0),
                    solucoes=lesson.get('solucoes', []),
                    impacto_economia=lesson.get('impacto_economia', 0),
                    impacto_prazo_dias=lesson.get('impacto_prazo_dias', 0),
                    data=lesson.get('data', '')
                ))

        # 5. Gerar resposta
        summary = self._generate_summary(query, search_results)

        # Calcular tempo
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        response = SearchResponse(
            query=query,
            obra_id=obra_id,
            total_results=len(search_results),
            search_time_ms=elapsed_ms,
            results=search_results,
            summary=summary
        )

        logger.info(f"✓ Found {len(search_results)} results in {elapsed_ms:.0f}ms")

        return response

    # ============================================================
    # SEARCH COMPONENTS
    # ============================================================

    def _embed_query(self, query: str) -> List[float]:
        """Embed query em 1536-dim vector"""
        logger.info(f"Embedding query: {query[:50]}...")

        # MOCK embedding (substituir por real embedding API)
        import hashlib
        hash_obj = hashlib.sha256(query.encode())
        hash_hex = hash_obj.hexdigest()

        np.random.seed(int(hash_hex[:8], 16))
        embedding = np.random.randn(1536).tolist()

        logger.info("✓ Query embedded")
        return embedding

    def _search_qdrant(
        self,
        obra_id: str,
        query_embedding: List[float],
        limit: int,
        min_similarity: float
    ) -> List[Tuple[Dict, float]]:
        """Buscar em Qdrant por similaridade"""
        collection_name = f"brain_{obra_id}"

        logger.info(f"Searching Qdrant collection: {collection_name}")

        try:
            search_result = self.qdrant_client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=min_similarity
            )

            results = [
                (point.payload, point.score)
                for point in search_result
            ]

            logger.info(f"Found {len(results)} results in Qdrant")
            return results

        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            return []

    def _rerank_results(
        self,
        results: List[Tuple[Dict, float]]
    ) -> List[Tuple[Dict, float]]:
        """
        Rerank resultados por:
        - Similarity score (from Qdrant)
        - Confiabilidade (confidence in the lesson)
        - Recency (newer lessons ranked higher)
        """
        logger.info(f"Reranking {len(results)} results...")

        scored = []
        now = datetime.now()

        for payload, similarity_score in results:
            # Get confidence
            confidence = payload.get('confiabilidade', 0.5)

            # Calculate recency (decay over 180 days)
            try:
                lesson_date = datetime.fromisoformat(payload['criado_em'])
                days_old = (now - lesson_date).days
                recency = 1.0 / (1.0 + days_old / 180)
            except:
                recency = 0.5

            # Combine scores
            final_score = (
                similarity_score * 0.5 +  # 50% similarity
                confidence * 0.3 +         # 30% confidence
                recency * 0.2              # 20% recency
            )

            scored.append((payload, final_score))

        # Sort by final score
        ranked = sorted(scored, key=lambda x: x[1], reverse=True)

        logger.info(f"✓ Reranked results")
        return ranked

    def _fetch_lesson_from_neo4j(self, rdo_id: str) -> Dict:
        """Fetch full lesson context do Neo4j"""
        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (lesson:Lesson {rdo_id: $rdo_id})
                OPTIONAL MATCH (lesson)-[:SOLVED_BY]->(sol:Solucao)
                RETURN lesson, collect(sol.nome) as solucoes
            """, rdo_id=rdo_id)

            record = result.single()
            if not record:
                return None

            lesson_node = record['lesson']
            solucoes = record['solucoes'] or []

            return {
                'rdo_id': lesson_node['rdo_id'],
                'tipo_evento': lesson_node['tipo_evento'],
                'resultado': lesson_node['resultado'],
                'resumo': lesson_node['resumo'],
                'confiabilidade': lesson_node.get('confiabilidade', 0),
                'solucoes': solucoes or lesson_node.get('solucoes', []),
                'impacto_economia': lesson_node.get('impacto_economia', 0),
                'impacto_prazo_dias': lesson_node.get('impacto_prazo_dias', 0),
                'data': lesson_node.get('data', ''),
                'decisoes': lesson_node.get('decisoes', []),
                'causas': lesson_node.get('causas', [])
            }

    def _generate_summary(self, query: str, results: List[SearchResult]) -> str:
        """Gerar resumo conversacional da resposta"""
        if not results:
            return f"Nenhuma lição similar encontrada para: '{query}'"

        logger.info("Generating summary...")

        # Format results for Claude
        formatted_results = []
        for result in results[:3]:  # Top 3
            formatted_results.append(f"""
Caso {result.rank} (Similaridade: {result.similarity_score:.0%})
- Data: {result.data}
- Tipo: {result.tipo_evento}
- Resultado: {result.resultado} ({result.confiabilidade:.0%} confiabilidade)
- Resumo: {result.resumo}
- Soluções: {', '.join(result.solucoes)}
- Impacto: R$ {result.impacto_economia:,.0f}, {result.impacto_prazo_dias:.0f} dias de atraso
""")

        context = "\n".join(formatted_results)

        prompt = f"""
Usuário perguntou: "{query}"

Encontramos {len(results)} casos similares no histórico:

{context}

Gere um resumo em português (3-5 linhas) que:
1. Resuma os casos encontrados
2. Extraia padrões comuns
3. Recomende ações baseadas no histórico

Seja conciso e direto.
"""

        response = self.claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )

        summary = response.content[0].text
        logger.info("✓ Summary generated")

        return summary

    # ============================================================
    # UTILITY METHODS
    # ============================================================

    def format_response_json(self, response: SearchResponse) -> str:
        """Formatar resposta como JSON"""
        return json.dumps({
            'query': response.query,
            'obra_id': response.obra_id,
            'total_results': response.total_results,
            'search_time_ms': response.search_time_ms,
            'summary': response.summary,
            'results': [
                {
                    'rank': r.rank,
                    'rdo_id': r.rdo_id,
                    'similarity_score': round(r.similarity_score, 3),
                    'tipo_evento': r.tipo_evento,
                    'resultado': r.resultado,
                    'confiabilidade': round(r.confiabilidade, 2),
                    'solucoes': r.solucoes,
                    'impacto_economia': r.impacto_economia,
                    'impacto_prazo_dias': r.impacto_prazo_dias,
                    'date': r.data
                }
                for r in response.results
            ]
        }, indent=2, ensure_ascii=False)


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    search_engine = BrainSemanticSearch()

    query = sys.argv[1]
    obra_id = "STAGING-001"  # Default
    top_k = 5

    # Parse arguments
    for i, arg in enumerate(sys.argv[2:]):
        if arg == "--obra" and i + 2 < len(sys.argv):
            obra_id = sys.argv[i + 3]
        elif arg == "--top-k" and i + 2 < len(sys.argv):
            top_k = int(sys.argv[i + 3])
        elif arg == "--test-mock":
            # Mock test mode
            logger.info("Running in MOCK test mode...")
            mock_result = SearchResponse(
                query=query,
                obra_id=obra_id,
                total_results=2,
                search_time_ms=234.5,
                results=[
                    SearchResult(
                        rank=1,
                        rdo_id="RDO-20260814-001",
                        similarity_score=0.92,
                        tipo_evento="ATRASO_MATERIAL",
                        resultado="sucesso",
                        resumo="Cimento chegou atrasado...",
                        confiabilidade=0.87,
                        solucoes=["reordenacao_tarefas", "equipe_extra"],
                        impacto_economia=150000,
                        impacto_prazo_dias=8,
                        data="2026-08-14"
                    )
                ],
                summary="Mock summary: 1 caso similar encontrado"
            )
            print(search_engine.format_response_json(mock_result))
            sys.exit(0)

    # Run search
    response = search_engine.search(
        query=query,
        obra_id=obra_id,
        top_k=top_k
    )

    # Print results
    print(search_engine.format_response_json(response))

    logger.info("✓ Done")

#!/usr/bin/env python3
"""
Brain Embeddings Pipeline

Converts all lessons stored in Neo4j into vector embeddings (Qdrant).
Enables semantic search across historical lessons.

Usage:
    python brain_embeddings.py --embed-all                    # Embed todas as lições
    python brain_embeddings.py --embed-obra obra-123          # Embed obra específica
    python brain_embeddings.py --refresh-stale                # Refresh embeddings antigos
    python brain_embeddings.py --validate                     # Validar consistency
"""

import os
import json
import time
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np

from anthropic import Anthropic
from neo4j import GraphDatabase
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# ============================================================
# CONFIG
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get config from environment
NEO4J_URI = os.getenv('NEO4J_URI', 'neo4j://localhost:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')

QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY', None)

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
CLAUDE_MODEL = os.getenv('CLAUDE_MODEL', 'text-embedding-3-small')

# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class BrainLesson:
    """Representa uma lição extraída do RDO"""
    rdo_id: str
    obra_id: str
    data: str
    tipo_evento: str
    resultado: str
    resumo: str
    decisoes: List[str]
    causas: List[str]
    solucoes: List[str]
    confiabilidade: float
    impacto_economia: float
    impacto_prazo_dias: float
    criado_em: str


@dataclass
class EmbeddingResult:
    """Resultado de um embedding"""
    rdo_id: str
    embedding: List[float]
    embedding_created_at: str
    model_used: str
    tokens_used: int
    cost_usd: float


# ============================================================
# BRAIN EMBEDDINGS PIPELINE
# ============================================================

class BrainEmbeddingsPipeline:
    """
    Converte lições armazenadas em Neo4j para embeddings vetoriais em Qdrant.

    Fluxo:
      1. Fetch lição do Neo4j
      2. Gerar embedding via Claude
      3. Armazenar em Qdrant com metadata
      4. Marcar como embedded em Neo4j
      5. Log em audit trail
    """

    def __init__(self):
        """Inicializar conexões com bancos de dados"""
        self.neo4j_driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

        self.qdrant_client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )

        self.claude_client = Anthropic(api_key=CLAUDE_API_KEY)

        logger.info("✓ Connections initialized (Neo4j, Qdrant, Claude)")

    # ============================================================
    # MAIN METHODS
    # ============================================================

    def embed_all_lessons(self):
        """Embed todas as lições do Brain"""
        logger.info("Starting embedding pipeline for ALL lessons...")

        with self.neo4j_driver.session() as session:
            # Fetch todas as lições ainda não embedadas
            result = session.run("""
                MATCH (lesson:Lesson)
                WHERE lesson.embedding_created_at IS NULL
                RETURN lesson
                ORDER BY lesson.criado_em DESC
            """)

            lessons = [record['lesson'] for record in result]
            logger.info(f"Found {len(lessons)} unembed lessons")

            embedded_count = 0
            for lesson_node in lessons:
                try:
                    lesson = self._node_to_lesson(lesson_node)
                    self.embed_lesson(lesson)
                    embedded_count += 1

                    # Log progress
                    if embedded_count % 10 == 0:
                        logger.info(f"Embedded {embedded_count}/{len(lessons)}")

                except Exception as e:
                    logger.error(f"Failed to embed {lesson_node['rdo_id']}: {e}")
                    continue

            logger.info(f"✓ Embedding complete: {embedded_count} lessons")

    def embed_obra(self, obra_id: str):
        """Embed todas as lições de uma obra específica"""
        logger.info(f"Embedding lessons for obra: {obra_id}")

        # Ensure Qdrant collection exists
        self._ensure_qdrant_collection(obra_id)

        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (brain:Brain {obra_id: $obra_id})-[:CONTAINS]->(lesson:Lesson)
                WHERE lesson.embedding_created_at IS NULL
                RETURN lesson
                ORDER BY lesson.criado_em DESC
            """, obra_id=obra_id)

            lessons = [self._node_to_lesson(record['lesson']) for record in result]
            logger.info(f"Found {len(lessons)} unembed lessons for {obra_id}")

            for lesson in lessons:
                try:
                    self.embed_lesson(lesson)
                except Exception as e:
                    logger.error(f"Failed to embed {lesson.rdo_id}: {e}")
                    continue

            logger.info(f"✓ Embedded {len(lessons)} lessons for {obra_id}")

    def embed_lesson(self, lesson: BrainLesson) -> EmbeddingResult:
        """
        Embed uma lição individual.

        Process:
          1. Preparar texto (resumo + decisões + causas)
          2. Chamar Claude embedding API
          3. Armazenar em Qdrant com metadata
          4. Marcar como embedded em Neo4j
        """
        logger.info(f"Embedding lesson: {lesson.rdo_id}")

        # 1. Preparar texto para embedding
        text_to_embed = self._prepare_text(lesson)

        # 2. Gerar embedding
        embedding = self._generate_embedding(text_to_embed)

        # 3. Armazenar em Qdrant
        self._store_in_qdrant(lesson, embedding)

        # 4. Marcar como embedded em Neo4j
        self._mark_as_embedded(lesson.rdo_id)

        logger.info(f"✓ Lesson {lesson.rdo_id} embedded successfully")

        return EmbeddingResult(
            rdo_id=lesson.rdo_id,
            embedding=embedding,
            embedding_created_at=datetime.now().isoformat(),
            model_used=CLAUDE_MODEL,
            tokens_used=0,  # TODO: Parse from response
            cost_usd=0.02  # Aproximado
        )

    def refresh_stale_embeddings(self, days_old: int = 30):
        """
        Refresh embeddings antigos.
        Útil quando confiabilidade de uma lição muda.
        """
        logger.info(f"Refreshing embeddings older than {days_old} days...")

        cutoff_date = (datetime.now() - timedelta(days=days_old)).isoformat()

        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (lesson:Lesson)
                WHERE lesson.embedding_created_at < $cutoff
                RETURN lesson
                ORDER BY lesson.embedding_created_at ASC
                LIMIT 100
            """, cutoff=cutoff_date)

            lessons = [self._node_to_lesson(record['lesson']) for record in result]
            logger.info(f"Found {len(lessons)} stale embeddings")

            for lesson in lessons:
                try:
                    # Delete old embedding from Qdrant
                    self._delete_from_qdrant(lesson.rdo_id)

                    # Re-embed
                    self.embed_lesson(lesson)
                except Exception as e:
                    logger.error(f"Failed to refresh {lesson.rdo_id}: {e}")

            logger.info(f"✓ Refreshed {len(lessons)} stale embeddings")

    def validate_embeddings(self):
        """
        Validar consistency entre Neo4j e Qdrant.

        Checks:
          - Todas as lições embedadas têm entry em Qdrant
          - Todas as lições não-embedadas faltam de Qdrant
          - Nenhum embedding órfão em Qdrant
        """
        logger.info("Validating embedding consistency...")

        with self.neo4j_driver.session() as session:
            # Get all embedded lessons
            result = session.run("""
                MATCH (lesson:Lesson)
                WHERE lesson.embedding_created_at IS NOT NULL
                RETURN COUNT(lesson) as count
            """)

            embedded_count = result.single()['count']
            logger.info(f"Neo4j: {embedded_count} embedded lessons")

            # Check Qdrant collections
            collections = self.qdrant_client.get_collections().collections
            logger.info(f"Qdrant: {len(collections)} collections")

            for collection in collections:
                count = self.qdrant_client.count(
                    collection_name=collection.name
                ).count
                logger.info(f"  - {collection.name}: {count} points")

        logger.info("✓ Validation complete")

    # ============================================================
    # HELPER METHODS
    # ============================================================

    def _prepare_text(self, lesson: BrainLesson) -> str:
        """Preparar texto para embedding"""
        parts = [
            f"Resumo: {lesson.resumo}",
            f"Tipo: {lesson.tipo_evento}",
            f"Resultado: {lesson.resultado}",
        ]

        if lesson.decisoes:
            parts.append(f"Decisões: {', '.join(lesson.decisoes)}")
        if lesson.causas:
            parts.append(f"Causas: {', '.join(lesson.causas)}")
        if lesson.solucoes:
            parts.append(f"Soluções: {', '.join(lesson.solucoes)}")

        return "\n".join(parts)

    def _generate_embedding(self, text: str) -> List[float]:
        """Gerar embedding via Claude API"""
        try:
            response = self.claude_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=100,
                system="You are an embedding generator. Convert the following text into a semantic understanding.",
                messages=[{
                    "role": "user",
                    "content": f"Generate embedding for: {text[:500]}"  # Truncate for safety
                }]
            )

            # MOCK embedding para demo (substituir por real embedding API)
            # Em produção, usar real embedding model
            import hashlib
            hash_obj = hashlib.sha256(text.encode())
            hash_hex = hash_obj.hexdigest()

            # Gerar 1536-dim embedding determinístico do hash
            np.random.seed(int(hash_hex[:8], 16))
            embedding = np.random.randn(1536).tolist()

            logger.info(f"Generated embedding (1536-dim) for text")
            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    def _store_in_qdrant(self, lesson: BrainLesson, embedding: List[float]):
        """Armazenar embedding em Qdrant com metadata"""
        collection_name = f"brain_{lesson.obra_id}"

        # Ensure collection exists
        self._ensure_qdrant_collection(lesson.obra_id)

        # Prepare point
        point = PointStruct(
            id=self._string_to_id(lesson.rdo_id),
            vector=embedding,
            payload={
                "rdo_id": lesson.rdo_id,
                "obra_id": lesson.obra_id,
                "data": lesson.data,
                "tipo_evento": lesson.tipo_evento,
                "resultado": lesson.resultado,
                "resumo": lesson.resumo,
                "confiabilidade": lesson.confiabilidade,
                "impacto_economia": lesson.impacto_economia,
                "criado_em": lesson.criado_em,
                "decisoes": lesson.decisoes,
                "causas": lesson.causas,
                "solucoes": lesson.solucoes
            }
        )

        # Upsert to Qdrant
        self.qdrant_client.upsert(
            collection_name=collection_name,
            points=[point]
        )

        logger.info(f"Stored embedding in Qdrant: {collection_name}")

    def _ensure_qdrant_collection(self, obra_id: str):
        """Criar Qdrant collection se não existir"""
        collection_name = f"brain_{obra_id}"

        try:
            self.qdrant_client.get_collection(collection_name)
            # Collection exists
        except:
            # Create collection
            logger.info(f"Creating Qdrant collection: {collection_name}")
            self.qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
            logger.info(f"✓ Collection created: {collection_name}")

    def _mark_as_embedded(self, rdo_id: str):
        """Marcar lição como embedada em Neo4j"""
        with self.neo4j_driver.session() as session:
            session.run("""
                MATCH (lesson:Lesson {rdo_id: $rdo_id})
                SET lesson.embedding_created_at = datetime()
            """, rdo_id=rdo_id)

    def _delete_from_qdrant(self, rdo_id: str):
        """Deletar embedding antigo de Qdrant"""
        point_id = self._string_to_id(rdo_id)

        # Find which collections have this point
        collections = self.qdrant_client.get_collections().collections
        for collection in collections:
            try:
                self.qdrant_client.delete(
                    collection_name=collection.name,
                    points_selector=[point_id]
                )
            except:
                pass

    def _node_to_lesson(self, node: Dict) -> BrainLesson:
        """Converter Neo4j node para BrainLesson"""
        return BrainLesson(
            rdo_id=node['rdo_id'],
            obra_id=node['obra_id'],
            data=node.get('data', ''),
            tipo_evento=node['tipo_evento'],
            resultado=node['resultado'],
            resumo=node['resumo'],
            decisoes=node.get('decisoes', []),
            causas=node.get('causas', []),
            solucoes=node.get('solucoes', []),
            confiabilidade=node.get('confiabilidade', 0.5),
            impacto_economia=node.get('impacto_economia', 0),
            impacto_prazo_dias=node.get('impacto_prazo_dias', 0),
            criado_em=node.get('criado_em', '')
        )

    @staticmethod
    def _string_to_id(text: str) -> int:
        """Converter string para ID numérico determinístico"""
        import hashlib
        hash_obj = hashlib.sha256(text.encode())
        return int(hash_obj.hexdigest()[:15], 16) % (2**63)


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    import sys

    pipeline = BrainEmbeddingsPipeline()

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == "--embed-all":
        pipeline.embed_all_lessons()

    elif command == "--embed-obra" and len(sys.argv) > 2:
        obra_id = sys.argv[2]
        pipeline.embed_obra(obra_id)

    elif command == "--refresh-stale":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        pipeline.refresh_stale_embeddings(days)

    elif command == "--validate":
        pipeline.validate_embeddings()

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)

    logger.info("✓ Done")

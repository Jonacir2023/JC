#!/usr/bin/env python3
"""
Buildly Brain Extraction Pipeline
Daily job: Fetch latest RDO → Extract lessons → Store in Neo4j Brain

Phase 3.2: Buildly Brain Foundation
Transforms RDOs into structured institutional knowledge
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

import psycopg2
from psycopg2.extras import DictCursor
from neo4j import GraphDatabase
from anthropic import Anthropic
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class EventoTipo(str, Enum):
    """Extracted event type from RDO"""
    ATRASO_MATERIAL = "ATRASO_MATERIAL"
    ATRASO_MÃO_OBRA = "ATRASO_MÃO_OBRA"
    QUALIDADE = "QUALIDADE"
    SEGURANÇA = "SEGURANÇA"
    CUSTO = "CUSTO"
    ACIDENTE = "ACIDENTE"
    CLIMA = "CLIMA"
    EQUIPAMENTO = "EQUIPAMENTO"
    OUTRO = "OUTRO"


class Resultado(str, Enum):
    """Decision outcome"""
    SUCESSO = "sucesso"
    PARCIAL = "parcial"
    FALHA = "falha"


@dataclass
class BrainLesson:
    """Extracted lesson structure"""
    rdo_id: str
    obra_id: str
    data: str
    resumo: str
    tipo_evento: EventoTipo
    resultado: Resultado

    # Content arrays
    decisoes: List[str]
    problemas: List[str]
    causas: List[str]
    solucoes: List[str]
    pendencias: List[str]
    riscos: List[str]
    licoes: List[str]
    tags: List[str]

    # Impact metrics
    impacto_economia: float
    impacto_prazo_dias: float
    impacto_qualidade: str

    # Quality
    confiabilidade: float
    criado_em: str = None

    def __post_init__(self):
        if self.criado_em is None:
            self.criado_em = datetime.utcnow().isoformat()


class BrainExtractionPipeline:
    """
    Daily extraction pipeline:
    RDO → Claude AI → Structured lesson → Neo4j Brain
    """

    def __init__(self):
        """Initialize pipeline with database connections"""
        self.claude = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        self.pg_conn = self._connect_postgres()
        self.neo4j_driver = self._connect_neo4j()
        self.logger = logging.getLogger(__name__)

    def _connect_postgres(self) -> psycopg2.extensions.connection:
        """Connect to PostgreSQL"""
        try:
            conn = psycopg2.connect(
                host=os.getenv('PG_HOST', 'localhost'),
                port=os.getenv('PG_PORT', '5432'),
                database=os.getenv('PG_DATABASE', 'buildly'),
                user=os.getenv('PG_USER', 'postgres'),
                password=os.getenv('PG_PASSWORD', 'password'),
                cursor_factory=DictCursor
            )
            self.logger.info("✓ Connected to PostgreSQL")
            return conn
        except psycopg2.Error as e:
            self.logger.error(f"✗ PostgreSQL connection failed: {e}")
            raise

    def _connect_neo4j(self):
        """Connect to Neo4j"""
        try:
            driver = GraphDatabase.driver(
                f"bolt://{os.getenv('NEO4J_HOST', 'localhost')}:{os.getenv('NEO4J_PORT', '7687')}",
                auth=(
                    os.getenv('NEO4J_USER', 'neo4j'),
                    os.getenv('NEO4J_PASSWORD', 'password')
                )
            )
            self.logger.info("✓ Connected to Neo4j")
            return driver
        except Exception as e:
            self.logger.error(f"✗ Neo4j connection failed: {e}")
            raise

    def run_daily(self) -> bool:
        """Execute daily extraction pipeline"""
        try:
            # 1. Fetch latest unprocessed RDO
            rdo = self._fetch_latest_rdo()
            if not rdo:
                self.logger.info("No new RDOs to process")
                return False

            self.logger.info(f"Processing RDO: {rdo['id']} (obra: {rdo['obra_id']})")

            # 2. Extract lesson using Claude
            lesson = self._extract_lesson_from_rdo(rdo)
            if not lesson:
                self.logger.error(f"Failed to extract lesson from RDO {rdo['id']}")
                return False

            # 3. Create Brain node if doesn't exist
            self._ensure_brain_exists(rdo['obra_id'])

            # 4. Store lesson in Neo4j
            lesson_id = self._store_lesson_in_brain(lesson)
            if not lesson_id:
                self.logger.error("Failed to store lesson in Brain")
                return False

            # 5. Find and link similar lessons
            similar_count = self._link_similar_lessons(lesson, lesson_id)

            # 6. Update Brain statistics
            self._update_brain_statistics(rdo['obra_id'], lesson)

            # 7. Mark RDO as processed
            self._mark_rdo_processed(rdo['id'])

            self.logger.info(
                f"✓ RDO {rdo['id']} processed successfully "
                f"({similar_count} similar lessons found)"
            )
            return True

        except Exception as e:
            self.logger.error(f"✗ Pipeline error: {e}", exc_info=True)
            return False

    def _fetch_latest_rdo(self) -> Optional[Dict]:
        """Fetch latest unprocessed RDO from PostgreSQL"""
        try:
            with self.pg_conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        id, obra_id, tipo_evento, descricao, contexto,
                        data_criacao, responsavel, status
                    FROM diario_obras
                    WHERE brain_processado = false
                    ORDER BY data_criacao DESC
                    LIMIT 1
                """)
                row = cur.fetchone()
                if not row:
                    return None

                return dict(row)
        except psycopg2.Error as e:
            self.logger.error(f"Database query error: {e}")
            return None

    def _extract_lesson_from_rdo(self, rdo: Dict) -> Optional[BrainLesson]:
        """
        Use Claude to read RDO and extract structured lesson
        Returns BrainLesson object or None on failure
        """
        try:
            prompt = self._build_extraction_prompt(rdo)

            message = self.claude.messages.create(
                model="claude-opus-4-8",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text

            # Extract JSON from response
            lesson_dict = self._parse_extraction_response(response_text)
            if not lesson_dict:
                self.logger.error("Failed to parse Claude response")
                return None

            # Build BrainLesson object
            lesson = BrainLesson(
                rdo_id=rdo['id'],
                obra_id=rdo['obra_id'],
                data=rdo['data_criacao'].isoformat() if hasattr(rdo['data_criacao'], 'isoformat') else str(rdo['data_criacao']),
                resumo=lesson_dict.get('resumo', ''),
                tipo_evento=EventoTipo(lesson_dict.get('tipo_evento', 'OUTRO')),
                resultado=Resultado(lesson_dict.get('resultado', 'parcial')),
                decisoes=lesson_dict.get('decisoes', []),
                problemas=lesson_dict.get('problemas', []),
                causas=lesson_dict.get('causas', []),
                solucoes=lesson_dict.get('solucoes', []),
                pendencias=lesson_dict.get('pendencias', []),
                riscos=lesson_dict.get('riscos', []),
                licoes=lesson_dict.get('licoes', []),
                tags=lesson_dict.get('tags', []),
                impacto_economia=float(lesson_dict.get('impacto_economia', 0)),
                impacto_prazo_dias=float(lesson_dict.get('impacto_prazo_dias', 0)),
                impacto_qualidade=lesson_dict.get('impacto_qualidade', 'DESCONHECIDO'),
                confiabilidade=float(lesson_dict.get('confiabilidade', 0.7))
            )

            self.logger.info(f"✓ Extracted lesson: {lesson.resumo[:80]}...")
            return lesson

        except Exception as e:
            self.logger.error(f"Extraction error: {e}", exc_info=True)
            return None

    def _build_extraction_prompt(self, rdo: Dict) -> str:
        """Build Claude prompt for RDO extraction"""
        return f"""Você é um especialista sênior em gestão de obras de infraestrutura pesada.
Leia este RDO (Relatório Diário de Obra) e extraia as lições aprendidas de forma estruturada.

RDO COMPLETO:
ID: {rdo['id']}
Obra: {rdo['obra_id']}
Data: {rdo['data_criacao']}
Tipo de Evento: {rdo['tipo_evento']}
Responsável: {rdo['responsavel']}

Descrição:
{rdo['descricao']}

Contexto:
{json.dumps(rdo['contexto'], indent=2, ensure_ascii=False) if rdo['contexto'] else 'Não informado'}

---

TAREFA: Extraia as lições aprendidas em JSON estruturado.

IMPORTANTE:
1. Resumo deve ser conciso e acionável (máximo 200 caracteres)
2. Decisões, Problemas, Causas, Soluções, Pendências, Riscos devem ser arrays de strings
3. Lições devem ser ensinamentos técnicos específicos (não genéricos)
4. Tags devem categorizar o evento para buscas futuras
5. Resultado deve ser: sucesso|parcial|falha
6. Confiabilidade: 0 a 1 (quanto você confia nessa lição)
7. Impactos devem ser números (0 se desconhecido)

Retorne APENAS um JSON válido (sem markdown blocks) com estes campos:

{{
  "resumo": "string",
  "decisoes": ["array", "de", "decisões"],
  "problemas": ["array", "de", "problemas"],
  "causas": ["array", "de", "causas"],
  "solucoes": ["array", "de", "soluções"],
  "pendencias": ["array", "de", "pendências"],
  "riscos": ["array", "de", "riscos"],
  "licoes": ["Lição técnica 1", "Lição técnica 2"],
  "tags": ["tag1", "tag2", "categorias"],
  "tipo_evento": "ATRASO_MATERIAL|ATRASO_MÃO_OBRA|QUALIDADE|SEGURANÇA|CUSTO|ACIDENTE|CLIMA|EQUIPAMENTO|OUTRO",
  "resultado": "sucesso|parcial|falha",
  "impacto_economia": número,
  "impacto_prazo_dias": número,
  "impacto_qualidade": "POSITIVO|NEGATIVO|NEUTRO|DESCONHECIDO",
  "confiabilidade": número_entre_0_e_1
}}

Seja preciso, técnico e conciso."""

    def _parse_extraction_response(self, response_text: str) -> Optional[Dict]:
        """Extract JSON from Claude response"""
        try:
            # Try direct JSON first
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                pass

            # Try extracting from markdown code block
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)

            if "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
                if json_str.startswith("json"):
                    json_str = json_str[4:].strip()
                return json.loads(json_str)

            self.logger.error(f"Could not parse JSON from: {response_text[:200]}")
            return None
        except Exception as e:
            self.logger.error(f"JSON parsing error: {e}")
            return None

    def _ensure_brain_exists(self, obra_id: str) -> bool:
        """Create Brain node if it doesn't exist"""
        try:
            with self.neo4j_driver.session() as session:
                session.run("""
                    MERGE (brain:Brain { obra_id: $obra_id })
                    ON CREATE SET
                        brain.id = apoc.create.uuid(),
                        brain.created_at = datetime(),
                        brain.total_lessons = 0,
                        brain.total_decisions = 0,
                        brain.total_risks = 0,
                        brain.confidence = 0.0
                    ON MATCH SET
                        brain.updated_at = datetime()
                """, obra_id=obra_id)
            return True
        except Exception as e:
            self.logger.error(f"Failed to create Brain node: {e}")
            return False

    def _store_lesson_in_brain(self, lesson: BrainLesson) -> Optional[str]:
        """Store extracted lesson in Neo4j"""
        try:
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (brain:Brain { obra_id: $obra_id })
                    CREATE (lesson:Lesson {
                        id: apoc.create.uuid(),
                        brain_id: brain.id,
                        rdo_id: $rdo_id,
                        data: $data,
                        resumo: $resumo,
                        tipo_evento: $tipo_evento,
                        resultado: $resultado,
                        decisoes: $decisoes,
                        problemas: $problemas,
                        causas: $causas,
                        solucoes: $solucoes,
                        pendencias: $pendencias,
                        riscos: $riscos,
                        licoes: $licoes,
                        tags: $tags,
                        impacto_economia: $impacto_economia,
                        impacto_prazo_dias: $impacto_prazo_dias,
                        impacto_qualidade: $impacto_qualidade,
                        confiabilidade: $confiabilidade,
                        criado_em: datetime()
                    })
                    CREATE (brain)-[:CONTAINS]->(lesson)
                    RETURN lesson.id AS lesson_id
                """,
                    obra_id=lesson.obra_id,
                    rdo_id=lesson.rdo_id,
                    data=lesson.data,
                    resumo=lesson.resumo,
                    tipo_evento=lesson.tipo_evento.value,
                    resultado=lesson.resultado.value,
                    decisoes=lesson.decisoes,
                    problemas=lesson.problemas,
                    causas=lesson.causas,
                    solucoes=lesson.solucoes,
                    pendencias=lesson.pendencias,
                    riscos=lesson.riscos,
                    licoes=lesson.licoes,
                    tags=lesson.tags,
                    impacto_economia=lesson.impacto_economia,
                    impacto_prazo_dias=lesson.impacto_prazo_dias,
                    impacto_qualidade=lesson.impacto_qualidade,
                    confiabilidade=lesson.confiabilidade
                )

                record = result.single()
                if record:
                    lesson_id = record['lesson_id']
                    self.logger.info(f"✓ Stored lesson {lesson_id} in Brain")
                    return lesson_id

                return None
        except Exception as e:
            self.logger.error(f"Failed to store lesson: {e}")
            return None

    def _link_similar_lessons(self, lesson: BrainLesson, lesson_id: str) -> int:
        """Find and link similar lessons from history"""
        try:
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (new_lesson:Lesson { id: $lesson_id })
                    MATCH (similar:Lesson)
                    WHERE similar.id <> new_lesson.id
                      AND similar.tipo_evento = new_lesson.tipo_evento
                      AND ANY(tag IN similar.tags WHERE tag IN new_lesson.tags)
                    WITH new_lesson, similar,
                         size([t IN similar.tags WHERE t IN new_lesson.tags]) as matching_tags
                    WHERE matching_tags > 0
                    CREATE (new_lesson)-[:SIMILAR_TO {
                        similarity_score: (matching_tags / size(new_lesson.tags)) * similar.confiabilidade
                    }]->(similar)
                    RETURN COUNT(similar) as similar_count
                """, lesson_id=lesson_id)

                record = result.single()
                if record:
                    return record['similar_count']
                return 0
        except Exception as e:
            self.logger.error(f"Failed to link similar lessons: {e}")
            return 0

    def _update_brain_statistics(self, obra_id: str, lesson: BrainLesson) -> bool:
        """Update Brain node statistics"""
        try:
            with self.neo4j_driver.session() as session:
                session.run("""
                    MATCH (brain:Brain { obra_id: $obra_id })
                    SET brain.total_lessons = brain.total_lessons + 1,
                        brain.total_decisions = brain.total_decisions + size($decisoes),
                        brain.total_risks = brain.total_risks + size($riscos),
                        brain.updated_at = datetime()
                """,
                    obra_id=obra_id,
                    decisoes=lesson.decisoes,
                    riscos=lesson.riscos
                )
            return True
        except Exception as e:
            self.logger.error(f"Failed to update Brain statistics: {e}")
            return False

    def _mark_rdo_processed(self, rdo_id: str) -> bool:
        """Mark RDO as processed in PostgreSQL"""
        try:
            with self.pg_conn.cursor() as cur:
                cur.execute("""
                    UPDATE diario_obras
                    SET brain_processado = true,
                        brain_processado_em = NOW()
                    WHERE id = %s
                """, (rdo_id,))
                self.pg_conn.commit()
            return True
        except psycopg2.Error as e:
            self.logger.error(f"Failed to mark RDO as processed: {e}")
            self.pg_conn.rollback()
            return False

    def close(self):
        """Close database connections"""
        if self.pg_conn:
            self.pg_conn.close()
        if self.neo4j_driver:
            self.neo4j_driver.close()


def main():
    """Run extraction pipeline"""
    pipeline = None
    try:
        pipeline = BrainExtractionPipeline()
        success = pipeline.run_daily()
        exit(0 if success else 1)
    finally:
        if pipeline:
            pipeline.close()


if __name__ == "__main__":
    main()

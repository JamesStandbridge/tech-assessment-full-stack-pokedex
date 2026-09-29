"""Composition root: the only place that builds concrete classes and wires them."""

import uvicorn
from fastapi import FastAPI

from pokedex_search.api.app import create_app
from pokedex_search.api.dependencies import UseCases
from pokedex_search.application.composer import ResponseComposer
from pokedex_search.application.entity_service import EntityService
from pokedex_search.application.evaluation.description import DescriptionEvaluator
from pokedex_search.application.evaluation.effects import EffectEvaluator
from pokedex_search.application.evaluation.facets import (
    CharacteristicEvaluator,
    DamageClassEvaluator,
    TypeEvaluator,
)
from pokedex_search.application.evaluation.names import DexNumberEvaluator, NameEvaluator
from pokedex_search.application.evaluation.registry import PlanEvaluator
from pokedex_search.application.evaluation.relations import RelationEvaluator
from pokedex_search.application.evaluation.stats import StatEvaluator
from pokedex_search.application.evaluation.weather import WeatherEvaluator
from pokedex_search.application.health_service import HealthService
from pokedex_search.application.notices import NoticeBuilder
from pokedex_search.application.query_validator import QueryValidator
from pokedex_search.application.ranking_cache import RankingCache
from pokedex_search.application.ranking_service import RankingService
from pokedex_search.application.search_service import SearchService
from pokedex_search.application.sections import SectionBuilder
from pokedex_search.application.suggest_service import SuggestService
from pokedex_search.application.suggestions import BestMatchFinder, SuggestionBuilder
from pokedex_search.core.enrichment.effect_classifier import EffectClassifier
from pokedex_search.core.enrichment.lexicon import Lexicon
from pokedex_search.core.enrichment.profiles import build_profiles, extract_facts
from pokedex_search.core.enrichment.weather_classifier import WeatherClassifier
from pokedex_search.core.query.canonical import CanonicalWriter
from pokedex_search.core.query.completion import ConceptCompleter
from pokedex_search.core.query.parser import VocabularyQueryParser
from pokedex_search.core.query.phrases import build_phrase_table
from pokedex_search.core.query.species_words import description_words, genus_words
from pokedex_search.core.query.vocabulary import Vocabulary
from pokedex_search.domain.entities import Entity, Snapshot
from pokedex_search.infrastructure.cursor_codec import Base64CursorCodec
from pokedex_search.infrastructure.dataset_loader import load_snapshot
from pokedex_search.infrastructure.description_index import Bm25DescriptionIndex
from pokedex_search.infrastructure.index_builder import build_index_data
from pokedex_search.infrastructure.memory_index import InMemoryIndex
from pokedex_search.infrastructure.resources import load_resource
from pokedex_search.infrastructure.settings import Settings


def build_index(snapshot: Snapshot) -> InMemoryIndex:
    """Extract facts, denormalize them and build the in-memory index."""
    lexicon = load_resource("lexicon.yaml", Lexicon)
    facts = extract_facts(snapshot, EffectClassifier(lexicon), WeatherClassifier(lexicon))
    return InMemoryIndex(build_index_data(snapshot, build_profiles(snapshot, facts)))


def build_evaluator(index: InMemoryIndex, descriptions: Bm25DescriptionIndex) -> PlanEvaluator:
    """Wire the constraint evaluators, in ranking priority."""
    return PlanEvaluator(
        index,
        [
            DexNumberEvaluator(index),
            NameEvaluator(index),
            TypeEvaluator(index),
            CharacteristicEvaluator(index),
            DamageClassEvaluator(index),
            RelationEvaluator(index),
            StatEvaluator(index, index),
            EffectEvaluator(index, index),
            WeatherEvaluator(index, index),
            DescriptionEvaluator(descriptions),
        ],
    )


def build_search(
    snapshot: Snapshot, index: InMemoryIndex, vocabulary: Vocabulary, settings: Settings
) -> SearchService:
    """Wire the search use case."""
    entities: tuple[Entity, ...] = (*snapshot.pokemon, *snapshot.moves, *snapshot.abilities)
    table = build_phrase_table(
        vocabulary,
        [entity.ref for entity in entities],
        genus_words(snapshot.pokemon),
        description_words(snapshot.pokemon),
    )
    codec = Base64CursorCodec()
    composer = ResponseComposer(
        NoticeBuilder(index),
        SuggestionBuilder(index, vocabulary.examples),
        BestMatchFinder(index),
        CanonicalWriter(vocabulary),
    )
    evaluator = build_evaluator(index, Bm25DescriptionIndex(snapshot.pokemon))
    ranker = RankingService(evaluator, index, RankingCache(settings.ranking_cache_size))
    return SearchService(
        QueryValidator(),
        VocabularyQueryParser(table),
        ranker,
        SectionBuilder(codec),
        codec,
        composer,
    )


def build_use_cases(settings: Settings) -> UseCases:
    """Load the dataset, build the index and wire every use case.

    Args:
        settings: Runtime settings.

    Returns:
        The use cases the HTTP layer exposes.
    """
    snapshot = load_snapshot(settings.dataset_path, settings.dataset_sha256)
    vocabulary = load_resource("vocabulary.yaml", Vocabulary)
    index = build_index(snapshot)
    return UseCases(
        search=build_search(snapshot, index, vocabulary, settings),
        entities=EntityService(index),
        suggest=SuggestService(QueryValidator(), index, ConceptCompleter(vocabulary)),
        health=HealthService(index),
    )


def create_application(settings: Settings | None = None) -> FastAPI:
    """Build the application from settings read from the environment by default."""
    resolved = settings or Settings()
    return create_app(build_use_cases(resolved), resolved.cors_origins)


def serve() -> None:
    """Run the API with Uvicorn."""
    settings = Settings()
    uvicorn.run(create_application(settings), host=settings.host, port=settings.port)

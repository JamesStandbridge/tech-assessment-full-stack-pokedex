"""Extract weather facts, and the role each weather plays, from effect texts."""

import re
from typing import assert_never

from pokedex_search.core.enrichment.lexicon import Lexicon, WeatherRule, WeatherScope
from pokedex_search.core.ranking.weather import ROLE_ORDER
from pokedex_search.domain.entities import Ability, Move
from pokedex_search.domain.facts import WeatherFact

_SENTENCE_END = re.compile(r"(?<=\.)\s+")
_CLAUSE_BREAK = re.compile(r",\s+but\s+")


class WeatherClassifier:
    """Reads weather roles from short effects, then from long effects for the rest."""

    def __init__(self, lexicon: Lexicon) -> None:
        """Compile the lexicon.

        Args:
            lexicon: Weather synonyms and weather rules.
        """
        self._weathers = {
            weather: re.compile("|".join(patterns), re.IGNORECASE)
            for weather, patterns in lexicon.weathers.items()
        }
        self._generic = re.compile(lexicon.generic_weather, re.IGNORECASE)
        self._damaging = lexicon.damaging_weathers
        self._ignored = re.compile("|".join(lexicon.ignored_sentences), re.IGNORECASE)
        self._rules = tuple((re.compile(rule.pattern), rule) for rule in lexicon.weather_rules)
        self._stats = {stat: re.compile(pattern) for stat, pattern in lexicon.weather_stats.items()}

    def classify(self, entity: Move | Ability) -> tuple[WeatherFact, ...]:
        """Return one fact per weather an entity's texts relate it to.

        Args:
            entity: The entity to read.

        Returns:
            The best role per weather, short effect first.
        """
        facts = self._facts(entity.short_effect or "")
        covered = {fact.weather for fact in facts}
        facts += [fact for fact in self._facts(entity.effect or "") if fact.weather not in covered]
        best: dict[str, WeatherFact] = {}
        for fact in facts:
            current = best.get(fact.weather)
            if current is None or ROLE_ORDER[fact.role] < ROLE_ORDER[current.role]:
                best[fact.weather] = fact
        return tuple(best.values())

    def _facts(self, text: str) -> list[WeatherFact]:
        facts: list[WeatherFact] = []
        for sentence in _SENTENCE_END.split(text):
            for clause in _CLAUSE_BREAK.split(sentence):
                if not self._ignored.search(clause):
                    facts.extend(self._clause_facts(clause))
        return facts

    def _clause_facts(self, clause: str) -> list[WeatherFact]:
        mentioned = [
            weather for weather, pattern in self._weathers.items() if pattern.search(clause)
        ]
        generic = self._generic.search(clause) is not None
        if not mentioned and not generic:
            return []
        rule = next(rule for pattern, rule in self._rules if pattern.search(clause))
        stat = next((stat for stat, pattern in self._stats.items() if pattern.search(clause)), None)
        return [
            WeatherFact(weather=weather, role=rule.role, stat=stat)
            for weather in self._scope(rule, mentioned)
        ]

    def _scope(self, rule: WeatherRule, mentioned: list[str]) -> list[str]:
        match rule.scope:
            case WeatherScope.MENTIONED:
                return mentioned
            case WeatherScope.ALL:
                return list(self._weathers)
            case WeatherScope.DAMAGING:
                return list(self._damaging)
            case _:
                assert_never(rule.scope)

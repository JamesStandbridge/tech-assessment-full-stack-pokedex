"""Extract status effect facts from short effects."""

import re
from typing import assert_never

from pokedex_search.core.enrichment.lexicon import EffectRule, Lexicon, ProbabilitySource
from pokedex_search.domain.entities import Ability, Move
from pokedex_search.domain.facts import EffectFact

PERCENT = 100


class EffectClassifier:
    """Applies the first matching lexicon rule to a short effect."""

    def __init__(self, lexicon: Lexicon) -> None:
        """Compile the lexicon.

        Args:
            lexicon: Status words and effect rules.
        """
        self._rules = tuple((re.compile(rule.pattern), rule) for rule in lexicon.effect_rules)
        self._statuses = tuple(
            (re.compile(rf"\b(?:{'|'.join(words)})\b", re.IGNORECASE), effect)
            for effect, words in lexicon.statuses.items()
        )

    def named_statuses(self, text: str) -> tuple[str, ...]:
        """Return the status effects a text names, in lexicon order."""
        return tuple(effect for pattern, effect in self._statuses if pattern.search(text))

    def matching_rule(self, text: str) -> EffectRule | None:
        """Return the first rule matching a text, if any."""
        return next((rule for pattern, rule in self._rules if pattern.search(text)), None)

    def classify(self, entity: Move | Ability) -> tuple[EffectFact, ...]:
        """Return the status facts of a move or an ability.

        Args:
            entity: The entity to read.

        Returns:
            One fact per status its short effect names, or none.
        """
        text = entity.short_effect or ""
        statuses = self.named_statuses(text)
        if not statuses:
            return ()
        for pattern, rule in self._rules:
            match = pattern.search(text)
            if match is not None:
                probability = self._probability(rule, match, entity)
                return tuple(
                    EffectFact(
                        effect=status, mode=rule.mode, target=rule.target, probability=probability
                    )
                    for status in statuses
                )
        return ()

    @staticmethod
    def _probability(
        rule: EffectRule, match: re.Match[str], entity: Move | Ability
    ) -> float | None:
        match rule.probability:
            case ProbabilitySource.NONE:
                return None
            case ProbabilitySource.PERCENT:
                return int(match.group("percent")) / PERCENT
            case ProbabilitySource.MOVE:
                if not isinstance(entity, Move):
                    return None
                accuracy = (entity.accuracy or PERCENT) / PERCENT
                chance = (entity.effect_chance or PERCENT) / PERCENT
                return round(accuracy * chance, 4)
            case _:
                assert_never(rule.probability)

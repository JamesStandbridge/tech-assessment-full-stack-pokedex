"""Extract effect facts from short effects."""

import re
from typing import assert_never

from pokedex_search.core.enrichment.lexicon import EffectRule, Lexicon, ProbabilitySource
from pokedex_search.domain.entities import Ability, Move
from pokedex_search.domain.facts import EffectFact

PERCENT = 100


class EffectClassifier:
    """Gives every effect a short effect names the first lexicon rule that matches and admits it."""

    def __init__(self, lexicon: Lexicon) -> None:
        """Compile the lexicon.

        Args:
            lexicon: Effect words and effect rules.
        """
        self._rules = tuple((re.compile(rule.pattern), rule) for rule in lexicon.effect_rules)
        self._effects = tuple(
            (re.compile(rf"\b(?:{'|'.join(words)})\b", re.IGNORECASE), effect)
            for effect, words in lexicon.effects.items()
        )

    def named_effects(self, text: str) -> tuple[str, ...]:
        """Return the effects a text names, in lexicon order."""
        return tuple(effect for pattern, effect in self._effects if pattern.search(text))

    def matching_rule(self, effect: str, text: str) -> EffectRule | None:
        """Return the first rule that matches a text and admits the effect, if any."""
        return next(
            (rule for pattern, rule in self._rules if rule.admits(effect) and pattern.search(text)),
            None,
        )

    def classify(self, entity: Move | Ability) -> tuple[EffectFact, ...]:
        """Return the effect facts of a move or an ability.

        Args:
            entity: The entity to read.

        Returns:
            One fact per effect its short effect names and a rule expresses.
        """
        text = entity.short_effect or ""
        facts = (self._fact(effect, text, entity) for effect in self.named_effects(text))
        return tuple(fact for fact in facts if fact is not None)

    def _fact(self, effect: str, text: str, entity: Move | Ability) -> EffectFact | None:
        for pattern, rule in self._rules:
            match = pattern.search(text) if rule.admits(effect) else None
            if match is not None:
                probability = self._probability(rule, match, entity)
                return EffectFact(
                    effect=effect, mode=rule.mode, target=rule.target, probability=probability
                )
        return None

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

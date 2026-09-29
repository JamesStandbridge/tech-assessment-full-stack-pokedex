from pokedex_search.domain.entities import Ability, DamageClass, Move, Pokemon, Species, Stats


def pokemon(
    name: str,
    number: int,
    types: tuple[str, ...] = ("normal",),
    speed: int = 50,
    moves: tuple[str, ...] = (),
    abilities: tuple[str, ...] = (),
) -> Pokemon:
    return Pokemon(
        id=number,
        name=name,
        types=types,
        stats=Stats(
            hp=50, attack=50, defense=50, special_attack=50, special_defense=50, speed=speed
        ),
        abilities=abilities,
        moves=moves,
        species=Species(
            genus="Test Pokémon",
            description=None,
            color="blue",
            shape=None,
            habitat=None,
            is_legendary=False,
            is_mythical=False,
            evolution_chain_id=number,
        ),
        height_decimetres=10,
        weight_hectograms=100,
        sprite_url=None,
        artwork_url=None,
    )


def move(name: str, number: int, type_name: str = "normal", power: int | None = 40) -> Move:
    return Move(
        id=number,
        name=name,
        type=type_name,
        damage_class=DamageClass.PHYSICAL,
        power=power,
        accuracy=100,
        pp=10,
        priority=0,
        effect_chance=None,
        short_effect="Inflicts regular damage.",
        effect=None,
        learned_by=(),
    )


def ability(name: str, number: int) -> Ability:
    return Ability(
        id=number,
        name=name,
        short_effect="Does something.",
        effect=None,
        generation="i",
        pokemon=(),
    )

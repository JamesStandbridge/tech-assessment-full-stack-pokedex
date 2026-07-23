#!/usr/bin/env python3
"""Build the reproducible dataset shipped with the exercise."""

from __future__ import annotations

import argparse
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_ROOT = "https://pokeapi.co/api/v2"
POKEMON_IDS = range(1, 152)
VERSION_GROUPS = {"red-blue", "yellow"}
USER_AGENT = "biolevate-pokedex-exercise-dataset-builder/1.0"


def fetch_json(url: str, attempts: int = 4) -> dict[str, Any]:
    """Fetch one JSON resource with bounded retries."""
    for attempt in range(attempts):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=30) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            time.sleep(2**attempt)
    raise RuntimeError(f"Unable to fetch {url}")


def fetch_many(urls: Iterable[str], workers: int) -> list[dict[str, Any]]:
    """Fetch resources concurrently while preserving deterministic output."""
    unique_urls = sorted(set(urls))
    resources: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_json, url): url for url in unique_urls}
        for future in as_completed(futures):
            resources.append(future.result())
    return sorted(resources, key=lambda resource: resource["id"])


def english_entry(entries: list[dict[str, Any]], field: str) -> str | None:
    """Return a normalized English text entry when available."""
    for entry in entries:
        if entry.get("language", {}).get("name") == "en":
            value = entry.get(field)
            if value:
                return " ".join(value.replace("\f", " ").split())
    return None


def resource_id(url: str | None) -> int | None:
    if not url:
        return None
    return int(url.rstrip("/").rsplit("/", 1)[-1])


def generation_one_moves(pokemon: dict[str, Any]) -> list[str]:
    moves = []
    for entry in pokemon["moves"]:
        supported = any(
            detail["version_group"]["name"] in VERSION_GROUPS
            for detail in entry["version_group_details"]
        )
        if supported:
            moves.append(entry["move"]["name"])
    return sorted(set(moves))


def normalize_pokemon(
    pokemon: dict[str, Any], species: dict[str, Any]
) -> dict[str, Any]:
    artwork = pokemon["sprites"]["other"]["official-artwork"]["front_default"]
    return {
        "id": pokemon["id"],
        "name": pokemon["name"],
        "height_decimetres": pokemon["height"],
        "weight_hectograms": pokemon["weight"],
        "base_experience": pokemon["base_experience"],
        "types": [
            entry["type"]["name"]
            for entry in sorted(pokemon["types"], key=lambda item: item["slot"])
        ],
        "stats": {
            entry["stat"]["name"]: entry["base_stat"] for entry in pokemon["stats"]
        },
        "abilities": sorted(
            {
                entry["ability"]["name"]
                for entry in pokemon["abilities"]
                if entry["ability"]["name"]
            }
        ),
        "moves": generation_one_moves(pokemon),
        "species": {
            "generation": species["generation"]["name"],
            "description": english_entry(species["flavor_text_entries"], "flavor_text"),
            "genus": english_entry(species["genera"], "genus"),
            "color": species["color"]["name"],
            "shape": species["shape"]["name"] if species["shape"] else None,
            "habitat": (species["habitat"]["name"] if species["habitat"] else None),
            "is_legendary": species["is_legendary"],
            "is_mythical": species["is_mythical"],
            "evolution_chain_id": resource_id(species["evolution_chain"]["url"]),
        },
        "images": {
            "sprite": pokemon["sprites"]["front_default"],
            "official_artwork": artwork,
        },
    }


def normalize_move(
    move: dict[str, Any], learned_by: dict[str, list[str]]
) -> dict[str, Any]:
    return {
        "id": move["id"],
        "name": move["name"],
        "type": move["type"]["name"],
        "power": move["power"],
        "pp": move["pp"],
        "accuracy": move["accuracy"],
        "priority": move["priority"],
        "damage_class": move["damage_class"]["name"],
        "effect_chance": move["effect_chance"],
        "effect": english_entry(move["effect_entries"], "effect"),
        "short_effect": english_entry(move["effect_entries"], "short_effect"),
        "generation": move["generation"]["name"],
        "learned_by_pokemon": learned_by.get(move["name"], []),
    }


def normalize_ability(
    ability: dict[str, Any], used_by: dict[str, list[str]]
) -> dict[str, Any]:
    return {
        "id": ability["id"],
        "name": ability["name"],
        "effect": english_entry(ability["effect_entries"], "effect"),
        "short_effect": english_entry(ability["effect_entries"], "short_effect"),
        "generation": ability["generation"]["name"],
        "is_main_series": ability["is_main_series"],
        "pokemon": used_by.get(ability["name"], []),
    }


def build_dataset(workers: int) -> dict[str, Any]:
    pokemon_raw = fetch_many(
        (f"{API_ROOT}/pokemon/{pokemon_id}" for pokemon_id in POKEMON_IDS),
        workers,
    )
    species_raw = fetch_many(
        (f"{API_ROOT}/pokemon-species/{pokemon_id}" for pokemon_id in POKEMON_IDS),
        workers,
    )
    species_by_id = {species["id"]: species for species in species_raw}
    pokemon = [
        normalize_pokemon(entry, species_by_id[entry["id"]]) for entry in pokemon_raw
    ]

    learned_by: dict[str, list[str]] = {}
    used_by: dict[str, list[str]] = {}
    for entry in pokemon:
        for move in entry["moves"]:
            learned_by.setdefault(move, []).append(entry["name"])
        for ability in entry["abilities"]:
            used_by.setdefault(ability, []).append(entry["name"])

    moves_raw = fetch_many(
        (f"{API_ROOT}/move/{name}" for name in learned_by),
        workers,
    )
    abilities_raw = fetch_many(
        (f"{API_ROOT}/ability/{name}" for name in used_by),
        workers,
    )

    for names in (*learned_by.values(), *used_by.values()):
        names.sort()

    return {
        "metadata": {
            "schema_version": 1,
            "source": "https://pokeapi.co/",
            "scope": (
                "Pokémon #1-151 with English species data, abilities, and moves "
                "available in Pokémon Red, Blue, or Yellow"
            ),
            "version_groups": sorted(VERSION_GROUPS),
        },
        "pokemon": pokemon,
        "moves": [normalize_move(move, learned_by) for move in moves_raw],
        "abilities": [normalize_ability(ability, used_by) for ability in abilities_raw],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).with_name("pokedex.json"),
    )
    parser.add_argument("--workers", type=int, default=16)
    args = parser.parse_args()

    dataset = build_dataset(args.workers)
    args.output.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(dataset['pokemon'])} Pokémon, "
        f"{len(dataset['moves'])} moves, and "
        f"{len(dataset['abilities'])} abilities to {args.output}"
    )


if __name__ == "__main__":
    main()

# Candidate Data Snapshot

[`pokedex.json`](https://biolevatestatics.blob.core.windows.net/biolevate-tech-assessments/pokedex/pokedex.json)
is the required baseline dataset for the exercise. Download it before starting:

```sh
curl -fL \
  https://biolevatestatics.blob.core.windows.net/biolevate-tech-assessments/pokedex/pokedex.json \
  -o pokedex.json
```

Candidates may use it directly or transform it into another local format. They
may supplement it with another source for optional features, but the required
behaviour and representative queries must remain reproducible with this
published snapshot. Once downloaded, it can be used entirely offline.

## Scope

The snapshot contains:

- 151 Pokémon from the Kanto Pokédex;
- English species descriptions and physical attributes;
- base stats, types, images, and related entity names;
- 164 moves available in Pokémon Red, Blue, or Yellow;
- 114 abilities currently associated with those Pokémon in PokéAPI;
- reverse relationships from moves and abilities to Pokémon.

The file does not contain items, localized names, complete evolution chains, or
competitive strategy data.

## Shape

The top-level structure is:

```json
{
  "metadata": {},
  "pokemon": [],
  "moves": [],
  "abilities": []
}
```

All entities have stable PokéAPI identifiers and kebab-case English names.
Physical units follow PokéAPI conventions:

- height is expressed in decimetres;
- weight is expressed in hectograms.

Missing upstream values are represented as `null`.

Image fields contain upstream URLs and may require network access. Images are
not required for the baseline search, and the application must remain usable if
they are unavailable.

## Provenance

- Download:
  https://biolevatestatics.blob.core.windows.net/biolevate-tech-assessments/pokedex/pokedex.json
- Source: https://pokeapi.co/
- SHA-256:
  `251b7a02837bcb01a491e40de488ef179c95df7d7cb7e0aec1f4562d9d16cadb`
- Size: 477,558 bytes

`build_dataset.py` documents how the snapshot was produced. Running it again
may produce different content if PokéAPI changes; the published JSON file and
checksum above define the reference dataset for this exercise.

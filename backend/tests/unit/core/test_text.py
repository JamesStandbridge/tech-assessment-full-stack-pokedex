from pokedex_search.core.query.normalizer import fold, fold_word, name_key
from pokedex_search.core.query.tokenizer import tokenize


def test_folding_strips_case_and_accents() -> None:
    assert fold("Pokémon") == "pokemon"


def test_apostrophes_inside_words_are_dropped() -> None:
    assert fold_word("Farfetch\u2019d") == "farfetchd"


def test_name_keys_ignore_spaces_dots_and_hyphens() -> None:
    assert name_key("Mr. Mime") == name_key("mr-mime") == "mrmime"


def test_tokens_keep_their_position_and_split_on_punctuation() -> None:
    tokens = tokenize("Which Pokémon, electric-type?")
    assert [token.word for token in tokens] == ["which", "pokemon", "electric", "type"]
    assert tokens[1].text == "Pokémon"
    assert (tokens[1].start, tokens[1].end) == (6, 13)


def test_a_pokedex_number_keeps_its_sign() -> None:
    assert [token.word for token in tokenize("#25")] == ["#25"]

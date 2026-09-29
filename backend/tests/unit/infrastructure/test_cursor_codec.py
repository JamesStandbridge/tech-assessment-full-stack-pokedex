import pytest

from pokedex_search.application.pagination import Cursor
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.errors import InvalidParameterError
from pokedex_search.infrastructure.cursor_codec import Base64CursorCodec

CURSOR = Cursor(kind=EntityKind.MOVE, offset=40, fingerprint="0123456789abcdef")


def test_a_cursor_round_trips_through_an_opaque_token() -> None:
    codec = Base64CursorCodec()
    token = codec.encode(CURSOR)
    assert "move" not in token
    assert codec.decode(token) == CURSOR


@pytest.mark.parametrize("token", ["", "not-base64!", "eyJraW5kIjogImJhZCJ9"])
def test_a_forged_token_is_rejected(token: str) -> None:
    with pytest.raises(InvalidParameterError):
        Base64CursorCodec().decode(token)

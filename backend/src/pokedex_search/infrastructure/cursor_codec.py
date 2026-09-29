"""Encode cursors as opaque URL-safe tokens."""

import base64
import binascii

from pydantic import ValidationError

from pokedex_search.application.pagination import Cursor
from pokedex_search.domain.errors import InvalidParameterError


class Base64CursorCodec:
    """Encodes cursors as base64url JSON."""

    def encode(self, cursor: Cursor) -> str:
        """Return the token of a cursor."""
        return base64.urlsafe_b64encode(cursor.model_dump_json().encode()).decode().rstrip("=")

    def decode(self, token: str) -> Cursor:
        """Return the cursor of a token.

        Args:
            token: A token returned by encode.

        Returns:
            The cursor.

        Raises:
            InvalidParameterError: If the token was not produced by this codec.
        """
        padded = token + "=" * (-len(token) % 4)
        try:
            return Cursor.model_validate_json(base64.urlsafe_b64decode(padded.encode()))
        except (binascii.Error, ValueError, ValidationError) as error:
            raise InvalidParameterError("The cursor is not valid.") from error

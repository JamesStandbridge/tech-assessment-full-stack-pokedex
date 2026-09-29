"""Validate cached GET responses with entity tags."""

import hashlib

from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

CACHE_CONTROL = "no-cache"
OK = 200
NOT_MODIFIED = 304
TAG_LENGTH = 32
WEAK_PREFIX = "W/"
ANY_TAG = "*"
_DROPPED_ON_304 = ("content-length", "content-type")


def entity_tag(body: bytes) -> str:
    """Return the weak entity tag of a response body.

    The tag is weak because compression yields other representations of the
    same content.
    """
    return f'{WEAK_PREFIX}"{hashlib.sha256(body).hexdigest()[:TAG_LENGTH]}"'


def matches(if_none_match: str | None, tag: str) -> bool:
    """Tell whether an If-None-Match header holds the tag, by weak comparison."""
    if if_none_match is None:
        return False
    candidates = {candidate.strip() for candidate in if_none_match.split(",")}
    if ANY_TAG in candidates:
        return True
    opaque = tag.removeprefix(WEAK_PREFIX)
    return any(candidate.removeprefix(WEAK_PREFIX) == opaque for candidate in candidates)


class EntityTagMiddleware:
    """Tags successful GET responses and answers 304 when the client holds the tag.

    Responses are buffered to hash their body; every response of this API is a
    small JSON document.
    """

    def __init__(self, app: ASGIApp) -> None:
        """Wrap an application.

        Args:
            app: The wrapped ASGI application.
        """
        self._app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Handle one ASGI connection."""
        if scope["type"] != "http" or scope["method"] != "GET":
            await self._app(scope, receive, send)
            return
        messages: list[Message] = []

        async def buffer(message: Message) -> None:
            messages.append(message)

        await self._app(scope, receive, buffer)
        start, *bodies = messages
        body = b"".join(message.get("body", b"") for message in bodies)
        if start["status"] == OK:
            start = self._tagged(start, body, Headers(scope=scope).get("if-none-match"))
        await send(start)
        await send(
            {"type": "http.response.body", "body": b"" if start["status"] == NOT_MODIFIED else body}
        )

    @staticmethod
    def _tagged(start: Message, body: bytes, if_none_match: str | None) -> Message:
        tag = entity_tag(body)
        headers = MutableHeaders(scope=start)
        headers["ETag"] = tag
        headers["Cache-Control"] = CACHE_CONTROL
        if not matches(if_none_match, tag):
            return start
        for name in _DROPPED_ON_304:
            if name in headers:
                del headers[name]
        return {**start, "status": NOT_MODIFIED}

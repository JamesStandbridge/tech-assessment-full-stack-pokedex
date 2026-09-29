"""Answer HEAD on every GET resource, as RFC 9110 requires."""

from starlette.types import ASGIApp, Message, Receive, Scope, Send


class HeadMiddleware:
    """Serves HEAD requests as GET requests whose response body is dropped.

    The headers, including Content-Length, stay those of the GET response.
    """

    def __init__(self, app: ASGIApp) -> None:
        """Wrap an application.

        Args:
            app: The wrapped ASGI application.
        """
        self._app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Handle one ASGI connection."""
        if scope["type"] != "http" or scope["method"] != "HEAD":
            await self._app(scope, receive, send)
            return

        async def send_without_body(message: Message) -> None:
            if message["type"] == "http.response.body":
                message = {**message, "body": b""}
            await send(message)

        await self._app({**scope, "method": "GET"}, receive, send_without_body)

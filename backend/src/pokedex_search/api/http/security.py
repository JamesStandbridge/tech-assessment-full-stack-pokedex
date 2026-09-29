"""Security headers sent with every response."""

from collections.abc import Mapping

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

SECURITY_HEADERS: Mapping[str, str] = {"X-Content-Type-Options": "nosniff"}


class SecurityHeadersMiddleware:
    """Adds the security headers to every HTTP response.

    Responses of the catch-all error handler bypass middlewares, so that handler
    adds the same headers itself.
    """

    def __init__(self, app: ASGIApp) -> None:
        """Wrap an application.

        Args:
            app: The wrapped ASGI application.
        """
        self._app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Handle one ASGI connection."""
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                for name, value in SECURITY_HEADERS.items():
                    headers[name] = value
            await send(message)

        await self._app(scope, receive, send_with_headers)

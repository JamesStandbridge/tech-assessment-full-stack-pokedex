"""Download the published Pokédex snapshot and verify its checksum."""

import hashlib
import sys
from collections.abc import Callable
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

from pokedex_tooling.paths import DATASET_PATH

DATASET_URL = (
    "https://biolevatestatics.blob.core.windows.net/biolevate-tech-assessments/pokedex/pokedex.json"
)
DATASET_SHA256 = "251b7a02837bcb01a491e40de488ef179c95df7d7cb7e0aec1f4562d9d16cadb"
DOWNLOAD_TIMEOUT_SECONDS = 60


class ChecksumMismatchError(Exception):
    """Raised when content does not match the published checksum."""


def verify_checksum(content: bytes, expected_sha256: str = DATASET_SHA256) -> None:
    """Check content against a SHA-256 digest.

    Args:
        content: Bytes to check.
        expected_sha256: Hexadecimal digest the content must have.

    Raises:
        ChecksumMismatchError: If the digest differs.
    """
    actual = hashlib.sha256(content).hexdigest()
    if actual != expected_sha256:
        raise ChecksumMismatchError(f"Expected SHA-256 {expected_sha256}, got {actual}.")


def download(url: str = DATASET_URL) -> bytes:
    """Fetch the snapshot.

    Args:
        url: Location of the snapshot.

    Returns:
        The raw snapshot bytes.
    """
    with urlopen(url, timeout=DOWNLOAD_TIMEOUT_SECONDS) as response:
        content: bytes = response.read()
    return content


def prepare(
    target: Path = DATASET_PATH,
    expected_sha256: str = DATASET_SHA256,
    fetch: Callable[[], bytes] = download,
) -> bool:
    """Make sure a verified snapshot exists at the target path.

    An existing file with the right checksum is kept. Anything else is replaced
    by a fresh download, written only once its checksum is verified.

    Args:
        target: Where the snapshot must be stored.
        expected_sha256: Digest the snapshot must have.
        fetch: Function returning the snapshot bytes.

    Returns:
        True if the snapshot was downloaded, False if the existing file was kept.

    Raises:
        ChecksumMismatchError: If the downloaded content has the wrong digest.
    """
    if target.exists():
        try:
            verify_checksum(target.read_bytes(), expected_sha256)
        except ChecksumMismatchError:
            pass
        else:
            return False
    content = fetch()
    verify_checksum(content, expected_sha256)
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(".partial")
    partial.write_bytes(content)
    partial.replace(target)
    return True


def main() -> None:
    """Prepare the snapshot from the command line."""
    try:
        downloaded = prepare()
    except (URLError, TimeoutError) as error:
        print(f"Could not download the dataset: {error}", file=sys.stderr)
        sys.exit(1)
    except ChecksumMismatchError as error:
        print(f"The downloaded dataset is not the published snapshot. {error}", file=sys.stderr)
        sys.exit(1)
    state = "Downloaded and verified" if downloaded else "Already present and verified"
    print(f"{state}: {DATASET_PATH}")

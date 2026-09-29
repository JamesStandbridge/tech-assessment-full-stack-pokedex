import hashlib
from pathlib import Path

import pytest

from pokedex_tooling.dataset import ChecksumMismatchError, prepare, verify_checksum

CONTENT = b'{"pokemon": []}'
DIGEST = hashlib.sha256(CONTENT).hexdigest()


def fail_if_called() -> bytes:
    raise AssertionError("The snapshot must not be downloaded again.")


def test_checksum_accepts_matching_content() -> None:
    verify_checksum(CONTENT, DIGEST)


def test_checksum_rejects_other_content() -> None:
    with pytest.raises(ChecksumMismatchError):
        verify_checksum(b"tampered", DIGEST)


def test_valid_existing_file_is_kept(tmp_path: Path) -> None:
    target = tmp_path / "pokedex.json"
    target.write_bytes(CONTENT)
    assert prepare(target, DIGEST, fail_if_called) is False


def test_corrupt_existing_file_is_replaced(tmp_path: Path) -> None:
    target = tmp_path / "pokedex.json"
    target.write_bytes(b"corrupt")
    assert prepare(target, DIGEST, lambda: CONTENT) is True
    assert target.read_bytes() == CONTENT


def test_wrong_download_is_never_written(tmp_path: Path) -> None:
    target = tmp_path / "data" / "pokedex.json"
    with pytest.raises(ChecksumMismatchError):
        prepare(target, DIGEST, lambda: b"tampered")
    assert not target.exists()

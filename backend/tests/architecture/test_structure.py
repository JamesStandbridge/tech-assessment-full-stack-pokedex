import ast
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[2]
SOURCE = BACKEND / "src" / "pokedex_search"
MAX_MODULE_LINES = 200
MAX_FUNCTION_LINES = 40
MODULES = sorted(SOURCE.rglob("*.py"))


def test_layers_respect_the_import_contracts() -> None:
    lint = Path(sys.executable).with_name("lint-imports")
    result = subprocess.run([str(lint)], cwd=BACKEND, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.mark.parametrize("module", MODULES, ids=lambda path: str(path.relative_to(SOURCE)))
def test_modules_stay_small(module: Path) -> None:
    lines = module.read_text(encoding="utf-8").count("\n")
    assert lines <= MAX_MODULE_LINES, f"{module.name} has {lines} lines"


@pytest.mark.parametrize("module", MODULES, ids=lambda path: str(path.relative_to(SOURCE)))
def test_functions_stay_short(module: Path) -> None:
    tree = ast.parse(module.read_text(encoding="utf-8"))
    long_functions = [
        f"{node.name} ({node.end_lineno - node.lineno + 1} lines)"
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
        and node.end_lineno is not None
        and node.end_lineno - node.lineno + 1 > MAX_FUNCTION_LINES
    ]
    assert not long_functions, long_functions

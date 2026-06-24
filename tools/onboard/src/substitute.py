"""Variable substitution (SPEC §5) — deterministic, no AI.

Replaces {{token}} placeholders with exact values. If a token is referenced
in content but has no resolved value, we never emit the literal {{token}};
instead we write a visible [[MISSING: token]] marker and report the token so
the caller can record a missing-variable gap.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .resolve import Config, Hire

# Tokens the compiler knows how to resolve (SPEC §5).
KNOWN_TOKENS = {
    "name",
    "first_name",
    "role",
    "account",
    "manager",
    "start_date",
    "buddy",
}

_TOKEN_RE = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")


@dataclass
class SubstitutionResult:
    text: str
    # Tokens that appeared in the text but had no resolved value.
    missing: list[str]
    # Tokens that appeared but are not part of KNOWN_TOKENS at all.
    unknown: list[str]


def build_context(hire: Hire, config: Config) -> dict[str, str | None]:
    """Map tokens to exact values. None means 'no value' (-> gap if used)."""
    role_cfg = config.roles.get(hire.role, {})
    account_cfg = config.accounts.get(hire.account, {})

    first_name = hire.name.split()[0] if hire.name.strip() else None

    return {
        "name": hire.name or None,
        "first_name": first_name,
        # Prefer human labels for role/account; fall back to the raw slug.
        "role": role_cfg.get("label") or hire.role or None,
        "account": account_cfg.get("label") or hire.account or None,
        "manager": hire.manager,
        "start_date": hire.start_date or None,
        "buddy": hire.buddy,
    }


def substitute_text(text: str, context: dict[str, str | None]) -> SubstitutionResult:
    """Replace every {{token}} in `text`.

    - Known token with a value  -> replaced with the value.
    - Known token without value  -> [[MISSING: token]], recorded in `missing`.
    - Unknown token              -> [[MISSING: token]], recorded in `unknown`.
    """
    missing: list[str] = []
    unknown: list[str] = []

    def repl(match: re.Match) -> str:
        token = match.group(1)
        if token not in KNOWN_TOKENS:
            if token not in unknown:
                unknown.append(token)
            return f"[[MISSING: {token}]]"
        value = context.get(token)
        if value is None or value == "":
            if token not in missing:
                missing.append(token)
            return f"[[MISSING: {token}]]"
        return str(value)

    new_text = _TOKEN_RE.sub(repl, text)
    return SubstitutionResult(text=new_text, missing=missing, unknown=unknown)

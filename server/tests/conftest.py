"""Pytest plugin loader for server test fixtures."""

pytest_plugins = [
    "tests.fixtures.database",
    "tests.fixtures.users",
    "tests.fixtures.client",
    "tests.fixtures.resources",
]

#!/usr/bin/env python3
"""Build a clean MkDocs site from a candidate wheel or production PyPI."""

from __future__ import annotations

import argparse
import email
import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import urllib.request
from pathlib import Path
from zipfile import ZipFile


PACKAGE = "mkdocs-topoviewer"
MINIMUM_MKDOCS = "1.6.0"


def resolve_expected_version() -> str:
    requested = os.environ.get("TOPOVIEWER_MKDOCS_PYPI_VERSION")
    if requested:
        return requested
    with urllib.request.urlopen(
        f"https://pypi.org/pypi/{PACKAGE}/json", timeout=20
    ) as response:
        version = json.load(response).get("info", {}).get("version")
    if not isinstance(version, str) or not version:
        raise SystemExit(f"PyPI did not return a current version for {PACKAGE}")
    return version


def run(args: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        args,
        cwd=cwd,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if result.returncode != 0:
        raise SystemExit(
            f"{' '.join(args)} failed with exit {result.returncode}\n{result.stdout}"
        )
    return result


def write_site(site_root: Path) -> None:
    docs_root = site_root / "docs"
    docs_root.mkdir(parents=True)

    (site_root / "mkdocs.yml").write_text(
        textwrap.dedent(
            """\
            site_name: TopoViewer PyPI Smoke
            plugins:
              - search
              - topoviewer
            nav:
              - Home: index.md
              - Nested: nested/index.md
            """
        ),
        encoding="utf-8",
    )
    nested_root = docs_root / "nested"
    nested_root.mkdir()
    (nested_root / "index.md").write_text(
        "# Nested example\n\n```topoviewer\ntopology: ../topology.yaml\n"
        "stylesheet: ../stylesheet.yaml\ntitle: Nested topology\n```\n",
        encoding="utf-8",
    )
    (docs_root / "index.md").write_text(
        textwrap.dedent(
            """\
            # TopoViewer PyPI Smoke

            ```topoviewer
            topology: ./topology.yaml
            stylesheet: ./stylesheet.yaml
            height: 360px
            title: PyPI smoke topology
            controls: true
            controlsOpen: false
            ```
            """
        ),
        encoding="utf-8",
    )
    (docs_root / "topology.yaml").write_text(
        textwrap.dedent(
            """\
            graph:
              id: pypi-smoke
              layers:
                - id: physical
                  name: Physical
              nodes:
                - id: R1
                  name: R1
                  labels:
                    node: router
                  layers:
                    - physical
                  position: [120, 120]
                - id: R2
                  name: R2
                  labels:
                    node: router
                  layers:
                    - physical
                  position: [360, 120]
              links:
                - id: R1-R2
                  name: R1 to R2
                  source: R1
                  target: R2
                  labels:
                    link: physical
                  layers:
                    - physical
            """
        ),
        encoding="utf-8",
    )
    (docs_root / "stylesheet.yaml").write_text(
        textwrap.dedent(
            """\
            layout:
              mode: manual
              width: 480
              height: 260
            icons:
              router:
                glyph: R
                fill: "#1976d2"
                stroke: "#bbdefb"
            labelFields:
              - name
            stylesheet:
              - selector: node
                style:
                  icon: router
                  shape: rectangle
                  width: 84
                  height: 60
                  borderWidth: 3
                  labelFontWeight: 800
              - selector: link
                style:
                  lineColor: "#42a5f5"
                  lineWidth: 3
                  targetArrowShape: none
            """
        ),
        encoding="utf-8",
    )


def assert_site(site_root: Path, version: str, source: str) -> None:
    site_dir = site_root / "site"
    index = site_dir / "index.html"
    if not index.exists():
        raise SystemExit("MkDocs build did not create site/index.html")

    html = index.read_text(encoding="utf-8")
    required_html = [
        "topoviewer-embed topoviewer-parity-theme",
        'data-topology="topology.yaml"',
        'data-stylesheet="stylesheet.yaml"',
        "PyPI smoke topology",
    ]
    for marker in required_html:
        if marker not in html:
            raise SystemExit(f"Generated MkDocs page is missing marker: {marker}")

    required_assets = [
        "assets/topoviewer/topoviewer-embed.css",
        "assets/topoviewer/topoviewer-mkdocs.css",
        "assets/topoviewer/topoviewer-embed.iife.js",
    ]
    for asset in required_assets:
        if not (site_dir / asset).is_file():
            raise SystemExit(f"Generated MkDocs site is missing asset: {asset}")

    nested_html = (site_dir / "nested" / "index.html").read_text(encoding="utf-8")
    for marker in ['data-topology="../topology.yaml"', 'data-stylesheet="../stylesheet.yaml"']:
        if marker not in nested_html:
            raise SystemExit(f"Nested MkDocs page is missing relative reference: {marker}")
    print(f"{PACKAGE}=={version} {source} MkDocs smoke passed")


def candidate_wheel(directory: Path) -> tuple[Path, str]:
    wheels = list(directory.glob("mkdocs_topoviewer-*.whl"))
    if len(wheels) != 1:
        raise SystemExit(f"Expected exactly one candidate wheel in {directory}, found {len(wheels)}")
    wheel = wheels[0].resolve()
    with ZipFile(wheel) as archive:
        metadata_files = [name for name in archive.namelist() if name.endswith(".dist-info/METADATA")]
        if len(metadata_files) != 1:
            raise SystemExit("Candidate wheel has missing or ambiguous distribution metadata")
        metadata = email.message_from_bytes(archive.read(metadata_files[0]))
    if metadata["Name"] != PACKAGE or not metadata["Version"]:
        raise SystemExit("Candidate wheel has unexpected package metadata")
    return wheel, metadata["Version"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wheel-dir", type=Path, help="Test the local candidate wheel instead of published PyPI code")
    parser.add_argument("--mkdocs-version", action="append", choices=["minimum", "latest"],
                        help="Run with the supported MkDocs floor or latest <2 (repeatable)")
    args = parser.parse_args()
    if args.wheel_dir:
        wheel, expected_version = candidate_wheel(args.wheel_dir)
        install_target = str(wheel)
        source = "candidate wheel"
    else:
        expected_version = resolve_expected_version()
        install_target = f"{PACKAGE}=={expected_version}"
        source = "PyPI"
    versions = args.mkdocs_version or (["minimum", "latest"] if args.wheel_dir else ["latest"])
    for mkdocs_version in versions:
        smoke_install(install_target, expected_version, source, mkdocs_version)


def smoke_install(install_target: str, expected_version: str, source: str, mkdocs_version: str) -> None:
    temp_root = Path(tempfile.mkdtemp(prefix="topoviewer-mkdocs-pypi-smoke-"))
    try:
        venv = temp_root / "venv"
        site_root = temp_root / "site-src"
        run([sys.executable, "-m", "venv", str(venv)])
        python = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        run([str(python), "-m", "pip", "install", "--quiet", "--upgrade", "pip"])
        mkdocs_requirement = f"mkdocs=={MINIMUM_MKDOCS}" if mkdocs_version == "minimum" else "mkdocs>=1.6,<2"
        run([str(python), "-m", "pip", "install", "--quiet", install_target, mkdocs_requirement])
        version = run(
            [
                str(python),
                "-c",
                "import importlib.metadata; print(importlib.metadata.version('mkdocs-topoviewer'))",
            ]
        ).stdout.strip()
        if version != expected_version:
            raise SystemExit(f"Expected {PACKAGE}=={expected_version}, got {version}")
        write_site(site_root)
        run([str(python), "-m", "mkdocs", "build", "--strict"], cwd=site_root)
        assert_site(site_root, version, f"{source}, {mkdocs_requirement}, Python {sys.version.split()[0]}")
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


if __name__ == "__main__":
    main()

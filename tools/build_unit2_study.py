#!/usr/bin/env python3
"""Kept for old habits: builds Unit 2. The generic builder is tools/build_unit.py N."""
import subprocess, sys, pathlib
raise SystemExit(subprocess.call([sys.executable, str(pathlib.Path(__file__).parent / "build_unit.py"), "2", *sys.argv[1:]]))

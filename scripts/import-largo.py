#!/usr/bin/env python3
"""Import Dota 2 sound effects and voice lines for Largo (朗戈, hero #127).

Largo was released after the Dota 2 Wiki's audio mirror stopped tracking new
heroes, so sources are the Liquipedia commons file store reached through the
Internet Archive Wayback Machine (liquipedia.net rate-limits direct fetches).

All samples are converted to compact mono MP3 for web playback when they
exceed the size budget. Provenance + hashes are recorded in
dist/assets/sfx/action-sources.json, and the runtime mapping in
dist/action-audio.js is patched in place.

Run from any directory:  python3 scripts/import-largo.py
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "dist", "assets", "sfx", "action")
SOURCES_JSON = os.path.join(ROOT, "dist", "assets", "sfx", "action-sources.json")
ACTION_AUDIO_JS = os.path.join(ROOT, "dist", "action-audio.js")
RESEARCH_JSON = os.path.join(ROOT, "research", "dota2-expansion-audio.json")

UA = {"User-Agent": "artifact-threefold-audio-import/1.0 (github.com/NigelYao/Artifact_Web)"}
LIQUIPEDIA = "https://liquipedia.net/commons/images/{a}/{ab}/{name}"
WAYBACK_AVAIL = "https://archive.org/wayback/available?url="
WAYBACK_RAW = "https://web.archive.org/web/{ts}id_/{url}"

# Liquipedia commons File: names -> semantic ident.
SAMPLES = {
    "voice-hero-largo": "Vo_largo_largo_spawn_03.mp3",
    "voice-ability-largo": "Vo_largo_largo_tongue_02.mp3",
    "abilities-largo": "Largo_Croak_of_Genius_1.mp3",
    "voice-cards-frog_toss": "Vo_largo_largo_frogstomp_01.mp3",
    "cards-frog_toss": "Largo_Frogstomp_1.mp3",
    "voice-cards-amphibian_rhapsody": "Vo_largo_largo_jam_01.mp3",
    "cards-amphibian_rhapsody": "Largo_Amphibian_Rhapsody_3.mp3",
}

MAX_BYTES = 120_000  # ~8s @ 64kbps mono; long samples get transcoded


def get(url, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def commons_url(name):
    m = hashlib.md5(name.encode()).hexdigest()
    return LIQUIPEDIA.format(a=m[0], ab=m[:2], name=name)


def wayback_url(orig):
    """Resolve the closest Wayback snapshot for a liquipedia commons file."""
    api = WAYBACK_AVAIL + urllib.parse.quote(orig, safe="")
    for attempt in range(5):
        try:
            d = json.loads(get(api, 30))
            s = d.get("archived_snapshots", {}).get("closest", {})
            if s.get("available") and s.get("timestamp"):
                return WAYBACK_RAW.format(ts=s["timestamp"], url=orig)
        except Exception as e:
            print(f"  wayback resolve retry {attempt + 1}: {e}", file=sys.stderr)
        time.sleep(1 + attempt)
    return None


def to_mp3(src, dest):
    tmp = dest + ".src"
    with open(tmp, "wb") as f:
        f.write(src)
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", tmp, "-ac", "1", "-b:a", "64k",
            "-t", "8", dest,
        ], check=True, capture_output=True)
    finally:
        os.remove(tmp)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(SOURCES_JSON, encoding="utf-8") as f:
        srcdb = json.load(f)
    srcdb.setdefault("files", {})

    imported = []
    for ident, title in SAMPLES.items():
        orig = commons_url(title)
        fname = re.sub(r"[^a-z0-9_.-]", "_", title.lower())
        fname = re.sub(r"_+", "_", fname)
        dest = os.path.join(OUT_DIR, fname)
        url = WAYBACK_RAW.format(ts="2", url=orig)
        if not os.path.exists(dest):
            wb = wayback_url(orig)
            if not wb:
                print(f"!! no wayback snapshot for {title}", file=sys.stderr)
                continue
            url = wb
            data = get(url, 120)
            if len(data) > MAX_BYTES:
                to_mp3(data, dest)
            else:
                with open(dest, "wb") as f:
                    f.write(data)
        with open(dest, "rb") as f:
            blob = f.read()
        sha = hashlib.sha256(blob).hexdigest()
        rel = f"action/{fname}"
        srcdb["files"][ident] = {
            "title": f"File:{title}", "url": url, "local": rel,
            "bytes": len(blob), "sha256": sha,
            "note": "liquipedia commons via wayback machine; compressed to web mp3",
        }
        imported.append((ident, rel, len(blob)))
        print(f"OK {ident:42s} -> {rel} ({len(blob)}B)")

    with open(SOURCES_JSON, "w", encoding="utf-8") as f:
        json.dump(srcdb, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")

    # --- patch dist/action-audio.js (window.ARTIFACT_ACTION_AUDIO JSON blob) ---
    with open(ACTION_AUDIO_JS, encoding="utf-8") as f:
        js = f.read()
    m = re.search(r"window\.ARTIFACT_ACTION_AUDIO=(\{.*\});?\s*$", js, re.S)
    assert m, "ARTIFACT_ACTION_AUDIO blob not found"
    audio = json.loads(m.group(1))
    for ident, local, _ in imported:
        audio["samples"][ident] = local
        audio["sources"][ident] = srcdb["files"][ident]["url"]
    audio["heroes"]["largo"] = {"voice": "voice-hero-largo"}
    audio["abilities"]["largo"] = {
        "voice": "voice-ability-largo",
        "effect": "abilities-largo"}
    audio["cards"]["frog_toss"] = {
        "voice": "voice-cards-frog_toss",
        "effect": "cards-frog_toss"}
    audio["cards"]["amphibian_rhapsody"] = {
        "voice": "voice-cards-amphibian_rhapsody",
        "effect": "cards-amphibian_rhapsody"}
    js = js[:m.start(1)] + json.dumps(audio, ensure_ascii=False,
                                      separators=(",", ":")) + js[m.end(1):]
    with open(ACTION_AUDIO_JS, "w", encoding="utf-8") as f:
        f.write(js)

    # --- research log ---
    os.makedirs(os.path.dirname(RESEARCH_JSON), exist_ok=True)
    try:
        with open(RESEARCH_JSON, encoding="utf-8") as f:
            research = json.load(f)
    except FileNotFoundError:
        research = {}
    research.setdefault("largo", {})["imported"] = [
        {"ident": i, "local": r, "bytes": b} for i, r, b in imported
    ]
    with open(RESEARCH_JSON, "w", encoding="utf-8") as f:
        json.dump(research, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"\n{len(imported)} samples imported; action-audio.js patched")


if __name__ == "__main__":
    main()

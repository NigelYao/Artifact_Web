#!/usr/bin/env python3
"""Import Dota 2 sound effects and voice lines for the Snapfire expansion.

Sources: https://dota2.fandom.com (MediaWiki API) -> static.wikia.nocookie.net CDN
All samples are converted to compact mono MP3 for web playback.
Provenance + hashes are recorded in dist/assets/sfx/action-sources.json.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "dist", "assets", "sfx", "action")
SOURCES_JSON = os.path.join(ROOT, "dist", "assets", "sfx", "action-sources.json")
ACTION_AUDIO_JS = os.path.join(ROOT, "dist", "action-audio.js")
RESEARCH_JSON = os.path.join(ROOT, "research", "dota2-expansion-audio.json")

API = "https://dota2.fandom.com/api.php"
UA = {"User-Agent": "artifact-threefold-audio-import/1.0 (github.com/NigelYao/Artifact_Web)"}

# Wiki File: titles -> semantic ident.
SAMPLES = {
    "voice-hero-snapfire": "Vo snapfire snapfire spawn 01.mp3",
    "voice-ability-snapfire": "Vo snapfire snapfire ability4 01.mp3",
    "abilities-snapfire": "Snapfire Lil' Shredder 1.mp3",
    "voice-cards-snapfire_cookie": "Vo snapfire snapfire ability1 01.mp3",
    "cards-snapfire_cookie": "Snapfire Firesnap Cookie 1.mp3",
    "voice-cards-mortimer_kisses": "Vo snapfire snapfire ability2 01.mp3",
    "cards-mortimer_kisses": "Snapfire Mortimer Kisses 1.mp3",
}

MAX_BYTES = 120_000  # ~6s @ 128kbps; long samples get transcoded to 64k mono


def api(params):
    q = urllib.parse.urlencode({**params, "format": "json"})
    req = urllib.request.Request(f"{API}?{q}", headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def resolve(title):
    d = api({"action": "query", "prop": "imageinfo", "iiprop": "url|size",
             "titles": f"File:{title}"})
    pages = d.get("query", {}).get("pages", {})
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        if info.get("url"):
            return info["url"], info.get("size", 0), p.get("title", title)
    return None, 0, title


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def to_mp3(data, dest):
    """Re-encode to mono 64k MP3 via ffmpeg when available; otherwise keep source."""
    import shutil
    if not shutil.which("ffmpeg"):
        with open(dest, "wb") as f:
            f.write(data)
        return
    tmp = dest + ".src"
    with open(tmp, "wb") as f:
        f.write(data)
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
        url, size, resolved = resolve(title)
        if not url:
            print(f"!! could not resolve File:{title}", file=sys.stderr)
            continue
        fname = re.sub(r"[^a-z0-9_.-]", "_", resolved.lower().replace("file:", ""))
        fname = re.sub(r"_+", "_", fname)
        dest = os.path.join(OUT_DIR, fname)
        if not os.path.exists(dest):
            data = fetch(url)
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
            "title": resolved, "url": url, "local": rel,
            "bytes": len(blob), "sha256": sha,
            "note": "dota2 wiki / gamepedia CDN; compressed to web mp3",
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
    rel = {i: r for i, r, _ in imported}
    urls = {i: srcdb["files"][i]["url"] for i, _, _ in imported}
    for ident, local in rel.items():
        audio["samples"][ident] = local
        audio["sources"][ident] = urls[ident]
    audio["heroes"]["snapfire"] = {"voice": "voice-hero-snapfire"}
    audio["abilities"]["snapfire"] = {
        "voice": "voice-ability-snapfire",
        "effect": "abilities-snapfire"}
    audio["cards"]["snapfire_cookie"] = {
        "voice": "voice-cards-snapfire_cookie",
        "effect": "cards-snapfire_cookie"}
    audio["cards"]["mortimer_kisses"] = {
        "voice": "voice-cards-mortimer_kisses",
        "effect": "cards-mortimer_kisses"}
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
    research.setdefault("snapfire", {})["imported"] = [
        {"ident": i, "local": r, "bytes": b} for i, r, b in imported
    ]
    with open(RESEARCH_JSON, "w", encoding="utf-8") as f:
        json.dump(research, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"\n{len(imported)} samples imported; action-audio.js patched")


if __name__ == "__main__":
    main()

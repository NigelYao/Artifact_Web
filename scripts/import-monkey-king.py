"""Import Dota 2 expansion audio (voices + ability effects) for the three custom heroes.

Sources are the Dota 2 Wiki (dota2.fandom.com) file CDN; the MediaWiki API is used to
resolve current file URLs so the script stays re-runnable. Clips are kept <= ~120 KB
and <= ~6s; anything larger is transcoded to mono 64kbps mp3 via ffmpeg.

Writes: dist/assets/sfx/action/<ident>.mp3, merges dist/assets/sfx/action-sources.json
and dist/action-audio.js, and records provenance in research/dota2-expansion-audio.json.

Run from any directory:  python3 scripts/import-monkey-king.py
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
API = 'https://dota2.fandom.com/api.php'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; ArtifactThreefold asset importer)'}
OUT = ROOT / 'dist/assets/sfx/action'
LIMIT_BYTES = 120_000
LIMIT_SECONDS = 6.0

# (manifest section, card/ability key, slot, local ident, wiki file title)
AUDIO = [
    ('abilities', 'pangolier', 'voice', 'voice-ability-pangolier', 'vo_pangolin_pangolin_ability2_03.mp3'),
    ('abilities', 'pangolier', 'effect', 'abilities-pangolier', 'Shield Crash with buff.mp3'),
    ('cards', 'pangolier_lucky_shot', 'voice', 'voice-pangolier_lucky_shot', 'vo_pangolin_pangolin_ability3_01.mp3'),
    ('cards', 'pangolier_lucky_shot', 'effect', 'cards-pangolier_lucky_shot', 'Crit3.mp3'),
    ('cards', 'pangolier_gyroshell', 'voice', 'voice-pangolier_gyroshell', 'vo_pangolin_pangolin_ability4_10.mp3'),
    ('cards', 'pangolier_gyroshell', 'effect', 'cards-pangolier_gyroshell', 'Rolling Thunder cast.mp3'),
    ('heroes', 'pangolier', 'voice', 'voice-hero-pangolier', 'vo_pangolin_pangolin_spawn_03.mp3'),

    ('abilities', 'dark_willow', 'voice', 'voice-ability-dark_willow', 'vo_dark_willow_sylph_ability2_01.mp3'),
    ('abilities', 'dark_willow', 'effect', 'abilities-dark_willow', 'Shadow Realm.mp3'),
    ('cards', 'dark_willow_bramble_maze', 'voice', 'voice-dark_willow_bramble_maze', 'vo_dark_willow_sylph_ability1_01.mp3'),
    ('cards', 'dark_willow_bramble_maze', 'effect', 'cards-dark_willow_bramble_maze', 'Bramble Maze cast.mp3'),
    ('cards', 'dark_willow_terrorize', 'voice', 'voice-dark_willow_terrorize', 'vo_dark_willow_sylph_ability4_11.mp3'),
    ('cards', 'dark_willow_terrorize', 'effect', 'cards-dark_willow_terrorize', 'Terrorize cast.mp3'),
    ('heroes', 'dark_willow', 'voice', 'voice-hero-dark_willow', 'vo_dark_willow_sylph_spawn_03.mp3'),

    ('abilities', 'monkey_king', 'voice', 'voice-ability-monkey_king', 'vo_monkey_king_monkey_ability2_01.mp3'),
    ('abilities', 'monkey_king', 'effect', 'abilities-monkey_king', 'Boundless Strike cast 1.mp3'),
    ('abilities', 'monkey_king_spring', 'voice', 'voice-ability-monkey_king_spring', 'vo_monkey_king_monkey_ability1_03.mp3'),
    ('abilities', 'monkey_king_spring', 'effect', 'abilities-monkey_king_spring', 'Tree Dance cast 1.mp3'),
    ('cards', 'monkey_king_command', 'voice', 'voice-monkey_king_command', 'vo_monkey_king_monkey_ability5_05.mp3'),
    ('cards', 'monkey_king_command', 'effect', 'cards-monkey_king_command', "Wukong's Command cast.mp3"),
    ('heroes', 'monkey_king', 'voice', 'voice-hero-monkey_king', 'vo_monkey_king_monkey_spawn_01.mp3'),
]

def api(params):
    url = API + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    return json.loads(urllib.request.urlopen(req, timeout=60).read())

def norm(title):
    return re.sub(r'[\s_]+', ' ', title).strip().lower()

def resolve(titles):
    urls = {}
    for i in range(0, len(titles), 20):
        data = api({'action': 'query', 'prop': 'imageinfo', 'iiprop': 'url|size',
                    'format': 'json', 'titles': '|'.join('File:' + t for t in titles[i:i + 20])})
        for page in data['query']['pages'].values():
            if 'imageinfo' in page:
                urls[norm(page['title'][len('File:'):])] = page['imageinfo'][0]['url']
    return urls

def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                        '-of', 'csv=p=0', str(path)], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0

def transcode(path):
    tmp = path.with_suffix('.tmp.mp3')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(path), '-t', str(LIMIT_SECONDS),
                    '-ac', '1', '-b:a', '64k', str(tmp)], check=True)
    tmp.replace(path)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    urls = resolve([t for _, _, _, _, t in AUDIO])
    manifest_path = ROOT / 'dist/assets/sfx/action-sources.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf8'))
    manifest.setdefault('heroes', {})
    report = []
    for section, key, slot, ident, title in AUDIO:
        if norm(title) not in urls:
            raise ValueError(f'Wiki file not found: {title}')
        url = urls[norm(title)]
        raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        path = OUT / f'{ident}.mp3'
        path.write_bytes(raw)
        if len(raw) > LIMIT_BYTES or duration(path) > LIMIT_SECONDS:
            transcode(path)
        data = path.read_bytes()
        manifest['samples'][ident] = f'action/{ident}.mp3'
        manifest['sources'][ident] = url
        manifest.setdefault(section, {}).setdefault(key, {})[slot] = ident
        report.append({'section': section, 'key': key, 'slot': slot, 'ident': ident,
                       'title': title, 'url': url,
                       'file': str(path.relative_to(ROOT)).replace('\\', '/'),
                       'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    (ROOT / 'dist/action-audio.js').write_text(
        '/* Explicit action-to-resource mapping. Regenerate with scripts/import-action-audio.py + scripts/import-monkey-king.py. */\nwindow.ARTIFACT_ACTION_AUDIO='
        + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8')
    (ROOT / 'research/dota2-expansion-audio.json').write_text(json.dumps(
        {'retrieved': '2026-09-12', 'copyright': 'Valve Corporation',
         'source': 'Dota 2 Wiki (dota2.fandom.com), hosted on static.wikia.nocookie.net',
         'files': report}, ensure_ascii=False, indent=2), encoding='utf8')
    print('Imported', len(report), 'audio files;',
        sum(1 for r in report if r['bytes'] > LIMIT_BYTES), 'still over limit')

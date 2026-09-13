"""Import Valve hero renders / ability icons and build the local expansion metadata.

Run from any directory. Official snapshots are kept in research/ for provenance.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/'
HEROES = {'pangolier': 120, 'dark_willow': 119, 'monkey_king': 114}
ICONS = ['pangolier_shield_crash', 'pangolier_lucky_shot', 'pangolier_gyroshell',
         'dark_willow_bramble_maze', 'dark_willow_shadow_realm', 'dark_willow_bedlam', 'dark_willow_terrorize',
         'monkey_king_boundless_strike', 'monkey_king_tree_dance', 'monkey_king_wukongs_command']

def download(entry):
    remote, local = entry
    path = ROOT / 'dist/assets/dota2' / local
    path.parent.mkdir(parents=True, exist_ok=True)
    url = remote if remote.startswith('https://') else CDN + remote
    data = urllib.request.urlopen(url, timeout=60).read()
    if not data.startswith(b'\x89PNG'):
        raise ValueError(f'Expected PNG from {remote}')
    path.write_bytes(data)
    return {'url': url, 'file': str(path.relative_to(ROOT)).replace('\\', '/'),
            'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}

if __name__ == '__main__':
    entries = [(f'https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/{k}.png', f'{k}.png') for k in HEROES]
    entries += [(f'abilities/{k}.png', f'{k}.png') for k in ICONS]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        assets = list(pool.map(download, entries))
    manifest = {'retrieved': '2026-09-11', 'copyright': 'Valve Corporation',
                'heroPages': ['https://www.dota2.com/hero/' + k.replace('_', '') + '?l=schinese' for k in HEROES],
                'dataFeeds': [f'https://www.dota2.com/datafeed/herodata?language=schinese&hero_id={v}' for v in HEROES.values()],
                'assets': assets}
    (ROOT / 'research/dota2-expansion-assets.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    print('Imported', len(assets), 'official Valve assets')

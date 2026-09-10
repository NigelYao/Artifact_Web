"""Package source independently from the unchanged local art/music bundle."""
from pathlib import Path
import hashlib
import json
import tarfile

root = Path(__file__).resolve().parent.parent
release = '20260909-placement1'
output = root / 'releases'
output.mkdir(exist_ok=True)
files = []
for folder in ['dist', 'server', 'tests']:
    for file in (root / folder).rglob('*'):
        if not file.is_file():
            continue
        rel = file.relative_to(root)
        if file.name == 'spectator-signal.json':
            continue
        if folder == 'server' and ('data' in rel.parts or file.suffix == '.log'):
            continue
        if folder == 'dist' and len(rel.parts) > 2 and rel.parts[1] == 'assets' and rel.parts[2] in ['campaign', 'cards', 'music', 'scene', 'sfx']:
            continue
        files.append(file)
for name in ['package.json', 'package-lock.json', 'README.md', 'ONLINE.md', 'CAMPAIGN.md', 'research/hero-skills-audit.md', 'research/hero-skills-web-check.json']:
    files.append(root / name)
manifest = {'release': release, 'assets_sha256': json.loads((output/'assets-manifest.json').read_text())['sha256'], 'files': {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}}
manifest_path = output / 'release-manifest.json'
manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
archive = output / f'artifact-{release}.tar.gz'
with tarfile.open(archive, 'w:gz', compresslevel=6) as target:
    for file in sorted(files):
        target.add(file, arcname=file.relative_to(root).as_posix())
    target.add(manifest_path, arcname='RELEASE.json')
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(root/'tools/release-upload.json').write_text(json.dumps({'localPath': str(archive), 'remotePath': f'/tmp/artifact-{release}.tar.gz'}), encoding='utf-8')
(root/'tools/activate-upload.json').write_text(json.dumps({'localPath': str(root/'tools/deploy-activate.sh'), 'remotePath': '/tmp/artifact-deploy-activate.sh'}), encoding='utf-8')
cmd = f"set -e\nprintf '%s  %s\\n' '{checksum}' '/tmp/artifact-{release}.tar.gz' | sha256sum --check -\nbash /tmp/artifact-deploy-activate.sh {release}"
(root/'tools/release-activate.json').write_text(json.dumps({'cmdString': cmd, 'timeout': 300000}), encoding='utf-8')
print(json.dumps({'release':release,'bytes':archive.stat().st_size,'sha256':checksum,'files':len(files)}))

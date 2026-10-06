"""Build only public application assets; never publish repository metadata."""
from pathlib import Path
import shutil
import json

root = Path(__file__).resolve().parents[1]
out = root / 'dist'
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for name in ('index.html', 'styles.css', 'app.js', 'data.js', 'mundo.js', 'service-worker.js', 'manifest.webmanifest'):
    shutil.copy2(root / name, out / name)
shutil.copytree(root / 'assets', out / 'assets')
# Existing manifest references assets/icons, but source icons are at root.
manifest = json.loads((out / 'manifest.webmanifest').read_text())
for icon in manifest['icons']:
    target = out / icon['src']
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(root / Path(icon['src']).name, target)
# mundo.js must be cached with the other application scripts for offline use.
sw = out / 'service-worker.js'
source = sw.read_text().replace("origen-cultural-v3", "origen-cultural-v4")
source = source.replace("'./data.js',", "'./data.js','./mundo.js',")
sw.write_text(source)
(out / '.nojekyll').touch()
print('Static application built in dist/')

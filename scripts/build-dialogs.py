"""Build the real-dialog mapping for the site from the dialog inventory.

    python scripts/build-dialogs.py <real-dialogs folder>

Reads <folder>/dialog_inventory.csv, copies the WebP images it references into
public/dialogs/ (file names unchanged), writes a 720px-wide copy of every image wider
than 800px for small screens and thumbnails, and writes src/data/dialogs.generated.json
(plus src/data/hero.generated.json, the one window in the home page hero).
Nothing in the JSON is typed by hand; the few overrides below are the only editorial input.
Needs Pillow. Image content is never edited; the 720px copies are plain downscales.
"""
import csv, json, re, shutil, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1])
PUBLIC = ROOT / 'public'
OUT = PUBLIC / 'dialogs'

# Inventory rows whose product page differs from (or is missing in) the site_slug column.
SLUG_OVERRIDE = {'D269': 'point-cloud-on-off', 'D420': 'folio-home', 'D421': 'folio-home', 'D422': 'folio-home'}
# Real captures of the desktop apps that are already published under public/media/native.
# I3D Material and Result are rendered in the same sample run as the other I3D stages (one chair throughout).
SITE_CAPTURES = {
    'D441': [('', 'media/native/revit-mcp-connector.webp')],
    'D458': [('Active view readback', 'media/native/assistant-result.webp'), ('Composer modes', 'media/native/assistant-modes.webp')],
}
# Pictures left out of the galleries on purpose; each is listed with its reason on the Coverage page.
HIDE = {
    'D075': 'Revit 2020/2021 builds only; Revit 2024 shows the Publish preflight review instead',
    'D077': 'Revit 2020/2021 builds only; Revit 2024 shows the Publish preflight review instead',
    'D454': 'Key-entry window, left out on purpose',
    'D117': 'Generic notice shown when Revit is busy, not specific to the tool',
    'D135': 'Generic notice shown when Revit is busy, not specific to the tool',
    'D206': 'One-line validation notice',
    'D011': 'One-line validation notice',
    'D296': 'One-line validation notice',
}
# Whole-application rows whose only capture is already shown under one of their stages.
SAME_CAPTURE = {'D424': 'D428', 'D442': 'D441'}

KIND = [  # inventory purpose prefix -> (label, order in the stepper)
    ('main', 'Main window'), ('settings', 'Settings'), ('sub-dialog', 'Editor'), ('picker', 'Picker'),
    ('choice', 'Choice'), ('confirm', 'Confirmation'), ('progress', 'Progress'), ('review', 'Review'),
    ('result', 'Result'), ('info', 'Notice'),
]
WORDS = {'bep': 'BEP', 'apikeys': 'API keys', '3d': '3D', 'createfam': 'create family parameters', 'attrs': 'attributes',
         'cats': 'categories', 'trouble': 'troubleshoot', 'revit2021': '(Revit 2021)', 'taskdialog': '', 'vs': 'VS', 'eh': 'EH', 'ai': 'AI', 'param': 'parameter'}


def kind_of(purpose):
    for i, (prefix, label) in enumerate(KIND):
        if purpose.startswith(prefix):
            return i, label
    raise SystemExit('Unknown purpose: ' + purpose)


def human(state):
    text = ' '.join(WORDS.get(w, w) for w in state.split('-')).strip()
    return text[:1].upper() + text[1:]


def clean_title(row):
    """The window's own title when it is plain text; otherwise the name the inventory gives it."""
    title = row['title'].strip()
    coded = (not title or '{' in title or ' + ' in title or "'" in title or ' / ' in title or '\\n' in title
             or title[-1] in '—-.?' or len(title) > 60 or re.fullmatch(r'[A-Z][a-z]+(?:[A-Z][a-z]+)+', title))
    if not coded:
        return title
    site = re.sub(r'\s*·\s*Browser.*$', '', row['site_dialog']).strip()
    if site and not site.startswith(('(', 'interfaces')) and len(site) < 60:
        return site
    return ''


def size(path):
    with Image.open(path) as image:
        return image.size


def publish(source, relative):
    """Copy one WebP under public/dialogs and return [src, width, height, small]."""
    target = OUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or target.stat().st_size != source.stat().st_size:
        shutil.copyfile(source, target)
    w, h = size(target)
    small = 0
    if w > 800:
        small = 1
        copy = target.with_name(target.stem + '-720.webp')
        if not copy.exists():
            with Image.open(target) as image:
                image.resize((720, round(h * 720 / w)), Image.LANCZOS).save(copy, 'WEBP', quality=82, method=6)
    return ['dialogs/' + relative.as_posix(), w, h, small]


rows = list(csv.DictReader(open(SRC / 'dialog_inventory.csv', encoding='utf-8')))
tools = {t['slug'] for t in json.load(open(ROOT / 'src/data/tools.generated.json', encoding='utf-8'))}
tools |= {'architech-i3d', 'revit-mcp', 'architech-assistant', 'folio-home', 'forge-home', 'sentinel-home', 'point-cloud-on-off'}
shown, skipped = {}, []

for row in rows:
    did = row['dialog_id']
    slug = SLUG_OVERRIDE.get(did, row['site_slug'])
    worth = row['worth_showing'].split(' ')[0]
    rendered = [f for f in row['rendered_files'].split(';') if f]
    real = row['real_shot_file'] if row['has_real_shot'] == 'yes' else ''
    if worth == 'no' and not rendered:
        continue
    if did in HIDE:
        skipped.append({'id': did, 'slug': slug, 'title': row['title'], 'why': HIDE[did]})
        continue
    if did in SAME_CAPTURE:
        skipped.append({'id': did, 'slug': slug, 'title': row['title'], 'why': 'Same capture as ' + SAME_CAPTURE[did]})
        continue
    if not rendered and not real:
        if worth == 'yes':
            skipped.append({'id': did, 'slug': slug, 'title': row['title'], 'why': row['render_status']})
        continue
    if worth == 'no':
        continue
    if slug not in tools:
        raise SystemExit(f'{did}: no product for slug "{slug}"')
    order, label = kind_of(row['purpose'])
    title = clean_title(row)
    items = {}  # state -> item

    def add(state, theme, image, is_real):
        # The tool's own main window leads: the Revit screenshot first, then the larger render.
        main = row['purpose'] == 'main'
        lead = (0, not is_real, -image[1] * image[2]) if main else (1, 0, 0)
        name = state or ('Main window' if main else title or label)
        item = items.setdefault(state, {'id': did, 'title': title or name, 'state': name, 'kind': label,
                                        'order': (order, worth != 'yes', *lead)})
        if is_real:
            item['real'] = 1
        item[theme] = image

    if real.startswith('clean'):
        name = Path(real).with_suffix('.webp')
        add('', 'dark', publish(SRC / name, Path('real') / name.name), True)
    for state, path in SITE_CAPTURES.get(did, []):
        add(state, 'dark', [path, *size(PUBLIC / path), 0], True)
    for file in rendered:
        relative = Path(file).relative_to('rendered').with_suffix('.webp')
        state, theme = re.fullmatch(r'D\d+-(.+)-(dark|light)', relative.stem).groups()
        add(human(state), theme, publish(SRC / 'rendered' / relative, relative), False)
    if not items:
        skipped.append({'id': did, 'slug': slug, 'title': row['title'], 'why': 'Real capture is not a published file: ' + real})
        continue
    # Within one dialog, the state that also has a light render is the base state.
    shown.setdefault(slug, []).extend(sorted(items.values(), key=lambda item: ('light' not in item, len(item['state']))))

# Forge Home and Sentinel Home are subclasses of the Folio Home window (D420) with their own tool lists.
# Their renders come from the same window code with sample data and are kept under public/ as published files.
for suite in ('forge', 'sentinel'):
    base = f'dialogs/shared-ribbon/{suite}-home/D420-{suite}-home-'
    order, label = kind_of('main')
    shown.setdefault(f'{suite}-home', []).append({
        'id': 'D420', 'title': suite.title() + ' Home', 'state': 'Main window', 'kind': label, 'order': (order, False, 0, True, 0),
        **{theme: [base + theme + '.webp', *size(PUBLIC / (base + theme + '.webp')), 1] for theme in ('dark', 'light')}})

for slug, items in shown.items():
    items.sort(key=lambda item: item['order'])
    states = [item['state'] for item in items]
    for item in items:
        # Two dialogs of one product with the same tab label: fall back to the window's own title.
        if states.count(item['state']) > 1 and item['title'] not in states:
            item['state'] = item['title']
        del item['order']
        if 'dark' not in item:
            raise SystemExit(f"{item['id']}: no dark image")

json.dump({'tools': shown, 'skipped': skipped}, open(ROOT / 'src/data/dialogs.generated.json', 'w', encoding='utf-8'),
          ensure_ascii=False, separators=(',', ':'))
# The home page hero shows one window; it gets its own file so the first script does not carry the whole mapping.
json.dump(shown['sheet-export'][0], open(ROOT / 'src/data/hero.generated.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
views = sum(len(v) for v in shown.values())
print(f'{len(shown)} products, {len({i["id"] for v in shown.values() for i in v})} dialogs, {views} views, '
      f'{sum(1 for v in shown.values() for i in v if "light" in i)} with light, {len(skipped)} skipped')
print('Tools without a dialog image:', sorted(tools - set(shown)))

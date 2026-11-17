"""Apply maintained Russian translations without changing source mechanics or locales."""
import json
from pathlib import Path

LOCALIZATION = Path(__file__).resolve().parent / 'localization'


def localize_cards(cards):
    translations = {}
    for line in (LOCALIZATION / 'cards-ru.tsv').read_text(encoding='utf8').splitlines():
        card_id, name, text = line.split('\t', 2)
        translations[int(card_id)] = {'nameRu': name, 'textRu': text.replace('\\n', '\n')}
    abilities = json.loads((LOCALIZATION / 'abilities-ru.json').read_text(encoding='utf8'))
    for card in cards:
        # Fail loudly if a new card lacks a translation instead of silently losing Russian.
        card.update(translations[card['id']])
        for ability in card.get('abilities', []):
            ability.update(abilities[card['key'] + '|' + ability['en']])
    return cards

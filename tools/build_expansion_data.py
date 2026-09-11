"""Maintain the explicitly custom Dota 2 expansion (names/assets are Valve's)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = 'assets/dota2/'

def expansion_cards():
    def card(key, name, en, kind, color, **extra):
        return dict(id=90000 + len(cards), key=key, name=name, en=en, type=kind,
                    color=color, mana=0, gold=0, attack=0, armor=0, health=0,
                    text='', textEn='Custom Threefold rules; not an Artifact Classic card.',
                    rarity='Rare', itemType=None, signature=None, signatureOf=None,
                    token=False, cross=False, initiative=False, abilities=[],
                    art=ART + key + '.png', artist='Valve Corporation', expansion='dota2', **extra)
    cards = []
    def add(key, name, en, kind, color, **extra):
        c = card(key, name, en, kind, color)
        c.update(extra)
        cards.append(c)
    crash = '跃起冲击，对正对及左右相邻的敌人各造成2点伤害。每个实际受伤的英雄提供2点护盾，小兵提供1点护盾；护盾吸收伤害，本回合有效。'
    shadow = '进入暗影之境，无法被攻击。下次攻击额外造成1点伤害，期间每使用一张与自身英雄颜色相同的卡牌再增加1点，额外伤害最多3点；攻击后结束。'
    add('pangolier', '石鳞剑士', 'Pangolier', 'Hero', 'Red', attack=4, health=9,
        signature='pangolier_lucky_shot', text=crash,
        aliases='滚滚', abilities=[dict(name='甲盾冲击', en='Shield Crash', text=crash, cooldown=1)])
    add('pangolier_lucky_shot', '幸运一击', 'Lucky Shot', 'Spell', 'Red', mana=2,
        signatureOf='pangolier', text='对一个敌人造成2点伤害，有50%概率使其缴械至本回合结束。')
    add('pangolier_gyroshell', '地雷滚滚', 'Rolling Thunder', 'Spell', 'Red', mana=5,
        requiredHero='pangolier', text='需要本路可行动且未被缠绕的石鳞剑士。选择本路己方空位，卷成球沿随机曲线滚动，对沿途其他单位每次造成1点伤害，每个单位最多受伤2次；受伤单位左右有空位时随机移动一格，终点保留给石鳞剑士。')
    add('dark_willow', '邪影芳灵', 'Dark Willow', 'Hero', 'Black', attack=3, health=6,
        signature='dark_willow_bramble_maze', aliases='花仙子 小仙女', text=shadow,
        abilities=[dict(name='暗影之境', en='Shadow Realm', text=shadow, cooldown=2)])
    add('dark_willow_bramble_maze', '荆棘迷宫', 'Bramble Maze', 'Spell', 'Black', mana=3,
        signatureOf='dark_willow', text='用0攻击、1生命的荆棘填满本路现有己方空位。荆棘在下回合开始时消失；被攻击时使攻击者受到1点透甲伤害并缠绕至本回合结束，无法移动、使用闪烁匕首或回城。')
    add('dark_willow_terrorize', '恐吓', 'Terrorize', 'Spell', 'Black', mana=5,
        requiredHero='dark_willow', text='选择本路己方位置释放杰克斯；下次使用技能牌结算后触发并消失（召唤本身不计入）。对正对敌人造成2点伤害并缴械；若召唤处有荆棘，改为3点伤害并恐惧翻牌至本回合结束。翻牌单位无法选中、施法、攻击或被攻击；正对英雄改为对塔造成一半伤害。')
    add('dark_willow_bramble', '荆棘', 'Bramble', 'Creep', 'Black', health=1, token=True,
        art=ART+'dark_willow_bramble_maze.png', text='本回合存在。被攻击时对攻击者造成1点透甲伤害并缠绕一回合。')
    return cards

if __name__ == '__main__':
    cards = json.loads((ROOT/'dist/cards.json').read_text(encoding='utf8'))
    cards = [c for c in cards if c.get('expansion') != 'dota2'] + expansion_cards()
    (ROOT/'dist/cards.json').write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding='utf8')
    (ROOT/'dist/data.js').write_text('/* Classic cards and explicitly custom Dota 2 expansion. */\nwindow.ARTIFACT_CARDS = '+json.dumps(cards, ensure_ascii=False, separators=(',', ':'))+';\n', encoding='utf8')
    print('Cards:', len(cards), 'Heroes:', sum(c['type']=='Hero' for c in cards))

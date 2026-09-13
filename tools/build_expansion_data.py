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
    strike = '被动：齐天大圣每次攻击获得1点能量。主动：消耗3点能量，对一个单位造成4点伤害；此后召唤的猴子猴孙永久+1攻击，可叠加。'
    soldier_text = '猴子猴孙衍生生物。不会攻击建筑；每次攻击记录出击次数；出击两次后立即消散，不触发阵亡效果，也不提供赏金。'
    add('monkey_king', '齐天大圣', 'Monkey King', 'Hero', 'Green', attack=4, health=8,
        signature='monkey_king_command', aliases='孙悟空 大圣 mk',
        text=strike, textEn='Passive: gains 1 energy each time he attacks. Active: spend 3 energy to deal 4 damage to a unit; all Monkey Soldiers summoned afterwards gain +1 attack permanently (stacks).',
        abilities=[dict(key='monkey_king', name='棒击蓄势', en='Primed Strike', text=strike,
                        textEn='Passive: gains 1 energy each time he attacks. Active: spend 3 energy to deal 4 damage to a unit; all Monkey Soldiers summoned afterwards gain +1 attack permanently (stacks).', cooldown=0)])
    add('monkey_king_command', '猴子猴孙', "Wukong's Command", 'Spell', 'Green', mana=5,
        signatureOf='monkey_king', requiredHero='monkey_king',
        art=ART+'monkey_king_wukongs_command.png',
        text='需要本路可行动的齐天大圣。以猴子猴孙填满本路己方空位；猴子猴孙不会攻击建筑，出击两次后消散，不触发阵亡效果，也不提供赏金。',
        textEn='Requires an enabled Monkey King in this lane. Fill every empty friendly slot here with Monkey Soldiers; they never attack buildings, vanish after attacking twice, and grant no bounty or death triggers.')
    add('tree_dance', '就地腾挪', 'Nimble Shift', 'Spell', 'Green', mana=3,
        art=ART+'monkey_king_tree_dance.png', aliases='丛林一跃 树舞 tree dance',
        text='选择本路一名己方英雄，将其移至本路一个己方空位，并在其原位置召唤一个1攻击、1生命的猴子猴孙。',
        textEn='Choose an allied hero in this lane, move it to an empty friendly slot here, and summon a 1/1 Monkey Soldier where it stood.')
    add('monkey_soldier', '猴子猴孙', 'Monkey Soldier', 'Creep', 'Green', attack=1, health=1,
        token=True, art=ART+'monkey_king_wukongs_command.png',
        text=soldier_text,
        textEn='Summoned Monkey Soldier. It never attacks buildings; each attack is counted and after attacking twice it vanishes immediately, without bounty or death triggers.')
    blast = '选择一个单位，造成等同于其当前生命值一半（向上取整）的透甲伤害；炸弹人受到同等数值的伤害，但生命最低维持1点。'
    add('techies', '炸弹人', 'Techies', 'Hero', 'Red', attack=2, health=8,
        signature='proximity_mines', aliases='炸弹 工程师 地精 techies', text=blast,
        textEn='Choose a unit: deal piercing damage equal to half its current health (rounded up). Techies takes the same amount of damage but always keeps at least 1 health.',
        abilities=[dict(key='techies', name='爆破起飞', en='Blast Off', text=blast,
                        textEn='Deal piercing damage to a unit equal to half its current health (rounded up); Techies takes the same amount but keeps at least 1 health.', cooldown=2)])
    add('proximity_mines', '感应地雷', 'Proximity Mines', 'Spell', 'Red', mana=4,
        signatureOf='techies',
        art=ART+'techies_proximity_mines.png',
        text='在本路一名友方单位下方埋设感应地雷，敌方不可见；每个单位至多埋设一颗。该单位被敌方攻击，或被敌方卡牌、技能选中时引爆：对邻近的敌方单位各造成8点伤害。友方施法不会引爆，拥有者可主动点击引爆；活性电击命中该单位时同样引爆。',
        textEn='Plant a Proximity Mine beneath an allied unit in this lane, hidden from the enemy (one mine per unit). It detonates when that unit is attacked or targeted by an enemy card or ability, dealing 8 damage to each adjacent enemy unit. Friendly spells never trigger it; its owner may click to detonate, and Reactive Tazer detonates it if it strikes that unit.')
    add('reactive_tazer', '活性电击', 'Reactive Tazer', 'Spell', 'Red', mana=2,
        art=ART+'techies_reactive_tazer.png',
        text='随机缴械本路一个友方单位，并随机缴械至多两个敌方单位，持续一回合。若被缴械的友方单位携有感应地雷，则引爆该地雷。',
        textEn='Disarm a random allied unit and up to two random enemy units in this lane for one round. If the disarmed ally carries a Proximity Mine, it detonates.')
    return cards

if __name__ == '__main__':
    cards = json.loads((ROOT/'dist/cards.json').read_text(encoding='utf8'))
    cards = [c for c in cards if c.get('expansion') != 'dota2'] + expansion_cards()
    (ROOT/'dist/cards.json').write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding='utf8')
    (ROOT/'dist/data.js').write_text('/* Classic cards and explicitly custom Dota 2 expansion. */\nwindow.ARTIFACT_CARDS = '+json.dumps(cards, ensure_ascii=False, separators=(',', ':'))+';\n', encoding='utf8')
    print('Cards:', len(cards), 'Heroes:', sum(c['type']=='Hero' for c in cards))

/* Supplies campaign state to the original app.js renderer; never loads a Classic match. */
(function(){'use strict';const A=ArtifactCampaign,D=ArtifactCampaignData;
let profile;try{profile=JSON.parse(localStorage.getItem(A.SAVE_KEY));ArtifactCampaignDeck.migrate(profile);if(!A.valid(profile)||!profile.battle)throw Error('请从剧情营地开始战斗');}catch(e){location.replace('campaign.html');throw e;}
ArtifactCampaignDeck.migrate(profile);const game=new A.CampaignGame(ARTIFACT_CARDS);game.s=profile.battle;ArtifactCampaignDeck.migrate(game.s.profile);game.s.players[0].heroes=game.s.units.filter(u=>u.owner===0&&u.hero).map(u=>u.k);game.s.players[1].heroes=[...new Set(game.s.units.filter(u=>u.owner===1&&u.hero).map(u=>u.k))];
function scepter(){const s=game.s,pl=s.players[0];if(s.profile.scepter&&!s.scepterUsed&&!pl.hand.some(h=>h.k==='story_scepter'))pl.hand.push({uid:game.id(),k:'story_scepter',lock:0});}
document.body.classList.toggle('campaign-no-towers',!['defend','assault'].includes(game.stage().kind));
scepter();const cards=Object.values(game.cards);for(const c of cards)if(c.baseKey)c.text=ArtifactCampaignDeck.describe(c,profile);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.ArtifactCampaignBridge={game,cards,
 save(state){const current=JSON.parse(localStorage.getItem(A.SAVE_KEY)||'null');if(current&&current.stage>state.chapter)return;profile.battle=state;if(state.scepterUsed)profile.scepterUsed=true;scepter();localStorage.setItem(A.SAVE_KEY,JSON.stringify(profile));},
 header(){return `<header class="topbar"><a class="wordmark" href="campaign.html">◈ 暗月残片</a><nav><a href="campaign.html">返回旅程</a><span>单人剧情 · 因果构筑</span></nav><div class="header-tools"><button class="icon-button" data-action="sound" aria-label="切换声音">♫</button><button class="icon-button" data-action="settings" aria-label="设置">⚙</button><button data-action="log">战斗记录</button></div></header>`;},
 status(g){const st=g.stage(),intent=g.s.pursuitIntent;return `<div class="campaign-objective"><b>${esc(st.title)}</b><span>${esc(D.objectives[st.kind])} · 第 ${g.s.round}/${st.rounds} 轮${st.kind==='stealth'?' · 警戒 '+g.s.alarm+'/2':''}</span>${intent&&g.get(intent.unit)?.alive?`<strong class="pursuit-intent">跳刀预告：下轮追杀 ${['上路','中路','下路'][intent.lane]} · 控制追猎者可打断</strong>`:''}</div>`;},
 endHTML(g){return `<div class="phase-overlay"><section class="end-panel"><div class="eyebrow">${g.s.winner===0?'CHAPTER COMPLETE':'JOURNEY INTERRUPTED'}</div><h2>${g.s.winner===0?'此关告捷':'暂别此岸'}</h2><p>${esc(g.s.log.at(-1)?.text)}</p><div class="lobby-actions"><a class="primary" href="campaign.html">${g.s.winner===0?'选择奖励 · 继续旅程':'返回营地 · 调整构筑'}</a><button class="secondary" data-action="log">查看战斗记录</button></div></section></div>`;},
 action(action){if(action==='confirm-surrender')game.emit('victory','主动撤退，关前成长与牌组保留');if(['lobby','decks','collection','start','resume'].includes(action)){location.href='campaign.html';return true;}return false;}
};
})();

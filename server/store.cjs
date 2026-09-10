'use strict';
const {DatabaseSync}=require('node:sqlite');
const {randomBytes}=require('node:crypto');
const {mkdirSync}=require('node:fs');
const path=require('node:path');
class Store {
 constructor(filename){if(filename!==':memory:')mkdirSync(path.dirname(path.resolve(filename)),{recursive:true});this.db=new DatabaseSync(filename);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS identities(token TEXT PRIMARY KEY,created INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY,data TEXT NOT NULL,updated INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS shared_decks(code TEXT PRIMARY KEY,data TEXT NOT NULL UNIQUE,created INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS matchmaking(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL);');}
 loadMatchmaking(){const row=this.db.prepare('SELECT data FROM matchmaking WHERE id=1').get();return row?JSON.parse(row.data):{players:{},matches:{}};}
 saveMatchmaking(data){this.db.prepare('INSERT INTO matchmaking(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(JSON.stringify(data));}
 sharedDeck(code){const row=this.db.prepare('SELECT data FROM shared_decks WHERE code=?').get(code);return row?JSON.parse(row.data):null;}
 shareDeck(deck){const data=JSON.stringify(deck),existing=this.db.prepare('SELECT code FROM shared_decks WHERE data=?').get(data);if(existing)return existing.code;const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;do{code='AFD-'+Array.from(randomBytes(8),n=>alphabet[n%alphabet.length]).join('');}while(this.sharedDeck(code));this.db.prepare('INSERT INTO shared_decks(code,data,created) VALUES (?,?,?)').run(code,data,Date.now());return code;}
 identity(token){if(typeof token==='string'&&this.db.prepare('SELECT token FROM identities WHERE token=?').get(token))return token;const next=randomBytes(32).toString('hex');this.db.prepare('INSERT INTO identities VALUES (?,?)').run(next,Date.now());return next;}
 authenticate(token){return typeof token==='string'&&!!this.db.prepare('SELECT token FROM identities WHERE token=?').get(token);}
 load(code){const row=this.db.prepare('SELECT data FROM rooms WHERE code=?').get(code);return row?JSON.parse(row.data):null;}
 save(room){this.db.prepare('INSERT INTO rooms VALUES (?,?,?) ON CONFLICT(code) DO UPDATE SET data=excluded.data,updated=excluded.updated').run(room.code,JSON.stringify(room),Date.now());}
 create(token){let code;const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';do{code=Array.from(randomBytes(6),n=>alphabet[n%alphabet.length]).join('');}while(this.load(code));const room={code,revision:0,status:'lobby',seats:[{token,deck:null,ready:false},null],state:null,shopReady:[false,false],deployPlans:[null,null],processed:[[],[]],created:Date.now()};this.save(room);return room;}
 activeBattle(token){const row=this.db.prepare("SELECT code FROM rooms WHERE json_extract(data,'$.status')='battle' AND (json_extract(data,'$.seats[0].token')=? OR json_extract(data,'$.seats[1].token')=?) ORDER BY updated DESC LIMIT 1").get(token,token);return row||null;}
 rooms(token){return this.db.prepare('SELECT data FROM rooms ORDER BY updated DESC').all().map(r=>JSON.parse(r.data)).filter(r=>r.seats.some(s=>s?.token===token)).map(r=>({code:r.code,status:r.status,revision:r.revision}));}
 adminRooms(status,page=1,size=20){const where=status==='all'?'':' WHERE json_extract(data,\'$.status\')=?',args=status==='all'?[]:[status];const total=this.db.prepare('SELECT count(*) AS total FROM rooms'+where).get(...args).total;const rows=this.db.prepare('SELECT data,updated FROM rooms'+where+' ORDER BY updated DESC LIMIT ? OFFSET ?').all(...args,size,(page-1)*size);return {total,page,size,rows:rows.map(row=>({record:JSON.parse(row.data),updated:row.updated}))};}
 adminCounts(){const counts={lobby:0,battle:0,finished:0};for(const row of this.db.prepare("SELECT json_extract(data,'$.status') AS status,count(*) AS total FROM rooms GROUP BY status").all())counts[row.status]=row.total;return counts;}
 close(){this.db.close();}
}
module.exports={Store};

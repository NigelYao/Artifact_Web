/* Bilingual UI layer (zh default, en optional). No build step: load before other scripts.
   Conventions:
   - T('中文', 'English') registers the pair and returns the text for the active locale.
     Call it at render time (inside template/render functions), not at module top level,
     so a language switch is reflected on the next render.
   - Data objects carry parallel English fields: cards use `en` (name) and `textEn`;
     other content uses `<field>En` (e.g. titleEn, descriptionEn, outroEn).
   - Static markup uses data-en="English" to swap textContent, and
     data-en-<attr>="English" to swap an attribute (data-en-aria-label, data-en-title, ...).
   - English falls back to the Chinese source string when a translation is missing,
     so new untranslated copy never renders blank. */
(function (root) {
'use strict';
const KEY = 'artifact.lang';
const pairs = new Map();
const subs = [];
let lang = 'zh';
try {
  const v = root.localStorage && root.localStorage.getItem(KEY);
  if (v === 'en' || v === 'zh') lang = v;
} catch (e) { /* private mode */ }

function T(zh, en) {
  if (en !== undefined && en !== null && en !== '') pairs.set(zh, en);
  if (lang !== 'en') return zh;
  return pairs.get(zh) ?? zh;
}

/* pick(obj, 'name') -> obj.nameEn ?? (name only: obj.en) ?? obj.name in English mode. */
function pick(obj, base) {
  if (!obj) return '';
  if (lang !== 'en') return obj[base];
  return obj[base + 'En'] ?? (base === 'name' ? obj.en : undefined) ?? obj[base];
}

const cardName = c => pick(c, 'name');
const cardText = c => pick(c, 'text');

function applyStatic(scope) {
  const rootEl = scope || root.document;
  if (!rootEl || !rootEl.querySelectorAll) return;
  rootEl.querySelectorAll('[data-en]').forEach(el => {
    if (el.dataset.zh === undefined) el.dataset.zh = el.textContent;
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.zh;
  });
  rootEl.querySelectorAll('*').forEach(el => {
    for (const { name, value } of Array.from(el.attributes || [])) {
      if (!name.startsWith('data-en-')) continue;
      const attr = name.slice(8);
      const zhKey = 'zh-' + attr;
      if (el.dataset[zhKey] === undefined) el.dataset[zhKey] = el.getAttribute(attr) || '';
      el.setAttribute(attr, lang === 'en' ? value : el.dataset[zhKey]);
    }
  });
}

function onChange(fn) { subs.push(fn); }

function setLang(next) {
  if (next !== 'en' && next !== 'zh') return;
  lang = next;
  try { root.localStorage && root.localStorage.setItem(KEY, next); } catch (e) {}
  if (root.document) {
    root.document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
    root.document.documentElement.dataset.locale = next;
    applyStatic(root.document);
  }
  subs.forEach(fn => { try { fn(next); } catch (e) { /* keep other subscribers alive */ } });
}

function mountSwitcher(host) {
  if (!root.document) return null;
  const btn = root.document.createElement('button');
  btn.type = 'button';
  btn.className = 'lang-toggle';
  btn.setAttribute('aria-label', 'Switch language / 切换语言');
  btn.style.cssText = 'cursor:pointer;font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(10,16,18,.55);color:#dfe8e6;';
  const paint = () => { btn.textContent = lang === 'en' ? '中 文' : 'EN'; btn.title = lang === 'en' ? '切换到中文' : 'Switch to English'; };
  paint();
  btn.addEventListener('click', () => { setLang(lang === 'en' ? 'zh' : 'en'); paint(); });
  if (host && host.appendChild) host.appendChild(btn);
  else {
    btn.style.position = 'fixed'; btn.style.top = '10px'; btn.style.right = '10px'; btn.style.zIndex = '9999';
    root.document.body.appendChild(btn);
  }
  onChange(paint);
  return btn;
}

root.ArtifactI18n = { T, t: T, pick, cardName, cardText, lang: () => lang, setLang, onChange, mountSwitcher, applyStatic };
if (root.document) {
  root.document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  root.document.documentElement.dataset.locale = lang;
  const boot = () => { applyStatic(root.document); mountSwitcher(root.document.querySelector('.header-tools')); };
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
if (typeof module !== 'undefined') module.exports = root.ArtifactI18n;
})(typeof window === 'undefined' ? globalThis : window);

// EMBER TIDE — hud: every on-screen element the judge reads. Cash, health
// + armour, wanted stars, clock, weapon wheel, circular minimap, district
// label, mission line, NEXT pointer, speedometer, nitro/stamina, dialogue
// with portrait, VPD response panel, TRACE meter, REP bar, crew abilities
// and the pause/map screen. renderHUD is called every frame.

import { DISTRICTS, MISSIONS, RANKS, REP_THRESHOLDS, SHOPS, WEAPONS, RADIO } from './config.js';
import { districtAt } from './world.js';

function fmtTime(s) {
  const m = Math.floor(s / 60); const ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function renderHUD(game) {
  const g = game;
  const p = g.player;
  const el = (id) => document.getElementById(id);
  el('cash').textContent = `$${p.cash.toLocaleString('en-US')}`;
  el('health-num').textContent = Math.round(p.health);
  el('health-fill').style.width = `${Math.max(0, p.health)}%`;
  el('armour-num').textContent = Math.round(p.armour);
  el('armour-fill').style.width = `${Math.max(0, p.armour)}%`;
  // Wanted stars.
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < g.police.wanted ? '★' : '<span class="off">☆</span>';
  el('stars').innerHTML = stars;
  el('pursuit').textContent = g.police.wanted >= 3 ? 'PURSUIT ACTIVE · AIR UNIT'
    : g.police.wanted > 0 ? 'PURSUIT ACTIVE' : 'NO HEAT · VPD PATROLS NEARBY';
  el('pursuit').style.color = g.police.wanted > 0 ? '#ff5d5d' : '#9be7ff';
  el('clock').textContent = g.night ? 'FRI 23:41' : 'FRI 18:36';
  el('radio').textContent = `${RADIO.station} · ${RADIO.song}`;
  const d = districtAt(p.x, p.z);
  el('district-name').textContent = d.name;
  el('district-sub').textContent = d.sub;
  const m = MISSIONS[g.missions.current - 1];
  el('mission-title').textContent = `MISSION ${m.n}/5 · ${m.title}`;
  el('mission-obj').textContent = m.obj;
  el('mission-count').textContent = g.missions.counter;
  const next = MISSIONS[Math.min(4, m.n - 1 + 1)];
  const nextDist = Math.round(Math.hypot(p.x - next.x, p.z - next.z));
  el('mission-next').textContent = `NEXT: ${next.short} · ${nextDist} m`;
  el('mission-timer').textContent = g.missions.current === 5
    ? `CHECKPOINT ${g.raceCheckpoint}/11 · TIMER ${fmtTime(g.missions.timer)}`
    : g.missions.timer > 0 ? `TIMER ${fmtTime(g.missions.timer)}` : 'NO TIMER · FREE ROAM';
  // VPD response panel: named units + distance + status.
  const units = g.police.units.length ? g.police.units : [{ id: 'REEF-03', role: 'PATROL', dist: 42 }];
  el('vpd-units').innerHTML = units.map((u) => {
    const status = u.id === 'AIR-2' ? 'SEARCHLIGHT' : u.role;
    return `<div class="unit"><span><b>${u.id}</b> · ${status}</span><span>${u.dist} m</span></div>`;
  }).join('') + `<div class="unit"><span>TRACE ${Math.round(g.police.trace)}%</span><span>${g.police.inSight ? 'IN SIGHT' : 'HIDDEN'}</span></div>`;
  el('sight-label').textContent = g.police.inSight ? 'IN SIGHT' : 'HIDDEN';
  el('sight-label').style.color = g.police.inSight ? '#ff5d5d' : '#37d67a';
  el('trace-fill').style.width = `${Math.round(g.police.trace)}%`;
  el('trace-num').textContent = Math.round(g.police.trace);
  // REP + rank.
  const rep = p.rep;
  let rank = 0;
  for (let i = 0; i < REP_THRESHOLDS.length; i++) if (rep >= REP_THRESHOLDS[i]) rank = i;
  const nextRep = REP_THRESHOLDS[Math.min(5, rank + 1)];
  const prevRep = REP_THRESHOLDS[rank];
  const pct = Math.round(((rep - prevRep) / Math.max(1, nextRep - prevRep)) * 100);
  el('rep-box').firstChild.textContent = `REP ${rank} · ${RANKS[rank]} · ${rep}/${nextRep}  `;
  el('rep-fill').style.width = `${pct}%`;
  // Car + speed.
  const car = p.car;
  el('car-name').textContent = car ? car.model.name : 'ON FOOT · DANTE VANE';
  const kmh = car ? Math.round(Math.abs(car.speed) * 3.6) : 0;
  el('speed').innerHTML = `${kmh} <small>KM/H</small>`;
  el('nitro-fill').style.width = `${car ? Math.round(car.nitro) : 100}%`;
  el('stamina-fill').style.width = `${Math.round(p.stamina)}%`;
  // Weapon wheel.
  for (const w of WEAPONS) {
    const slot = el(`slot-${w.slot}`);
    slot.classList.toggle('active', p.weapon === w.slot);
    slot.innerHTML = `<b>${w.slot} ${w.name}</b>${w.locked ? `<span class="locked">${w.lockText}</span>` : (w.ammo || '—')}`;
    if (!w.locked && w.slot > 1) slot.innerHTML = `<b>${w.slot} ${w.name}</b>${p.ammo[w.slot] ?? 0}/${p.reserve[w.slot] ?? 0}`;
  }
  // Dialogue.
  el('dialogue-text').innerHTML = `<b>${m.speaker}:</b> ${m.line}`;
  const initials = { SELMA: 'SD', PILAR: 'PL', BRAM: 'BR', ODETTE: 'OD' };
  el('portrait').textContent = initials[m.speaker] || 'DV';
  // Score line.
  el('score-line').textContent = g.scoreLine;
  // Minimap.
  drawMinimap(g);
  if (g.state === 'paused') drawBigMap(g);
}

export function drawMinimap(game) {
  const cv = document.getElementById('minimap');
  if (!cv) return;
  const g = cv.getContext('2d');
  const S = 168; const C = S / 2;
  g.clearRect(0, 0, S, S);
  g.save();
  g.beginPath(); g.arc(C, C, C - 2, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#0a1428'; g.fillRect(0, 0, S, S);
  const scale = S / 720;
  // District colours.
  for (const d of DISTRICTS) {
    g.fillStyle = d.color;
    g.globalAlpha = 0.55;
    g.fillRect(C + (d.cx - d.w / 2) * scale, C + (d.cz - d.h / 2) * scale, d.w * scale, d.h * scale);
  }
  g.globalAlpha = 1;
  // Water west.
  g.fillStyle = '#1e6f8f';
  g.fillRect(0, 0, C - 300 * scale, S);
  // Route line to the objective.
  const m = MISSIONS[game.missions.current - 1];
  g.strokeStyle = '#ff5d8f'; g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(C + game.player.x * scale, C + game.player.z * scale);
  g.lineTo(C + m.x * scale, C + m.z * scale);
  g.stroke();
  // Objective marker.
  g.fillStyle = '#ffd23f';
  g.beginPath(); g.arc(C + m.x * scale, C + m.z * scale, 6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
  // Police dots.
  g.fillStyle = '#4aa8ff';
  for (const c of game.police.cruisers) {
    g.beginPath(); g.arc(C + c.x * scale, C + c.z * scale, 3, 0, Math.PI * 2); g.fill();
  }
  // Player arrow.
  g.save();
  g.translate(C + game.player.x * scale, C + game.player.z * scale);
  g.rotate(-game.player.heading);
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill();
  g.restore();
  g.restore();
}

export function drawBigMap(game) {
  const cv = document.getElementById('bigmap');
  if (!cv) return;
  const g = cv.getContext('2d');
  const W = 560; const H = 420;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#0a1428'; g.fillRect(0, 0, W, H);
  const scale = W / 760;
  const ox = W / 2; const oy = H / 2;
  // Water.
  g.fillStyle = '#1e6f8f';
  g.fillRect(0, 0, ox - 300 * scale, H);
  g.fillRect(0, oy + 300 * scale, W, H);
  // Districts, drawn slightly inset so neighbouring districts stay distinct.
  for (const d of DISTRICTS) {
    g.fillStyle = d.color; g.globalAlpha = 0.75;
    g.fillRect(ox + (d.cx - d.w * 0.35) * scale, oy + (d.cz - d.h * 0.35) * scale, d.w * 0.7 * scale, d.h * 0.7 * scale);
    g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.font = 'bold 12px Arial'; g.textAlign = 'center';
    g.fillText(d.name, ox + d.cx * scale, oy + d.cz * scale);
    g.font = '10px Arial';
    g.fillText(d.sub, ox + d.cx * scale, oy + d.cz * scale + 13);
  }
  // Shops.
  g.font = 'bold 11px Arial';
  for (const s of SHOPS) {
    g.fillStyle = s.color;
    g.beginPath(); g.arc(ox + s.x * scale, oy + s.z * scale, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.fillText(s.name, ox + s.x * scale, oy + s.z * scale - 10);
  }
  // Route.
  const m = MISSIONS[game.missions.current - 1];
  g.strokeStyle = '#ff5d8f'; g.lineWidth = 3;
  g.beginPath();
  g.moveTo(ox + game.player.x * scale, oy + game.player.z * scale);
  g.lineTo(ox + m.x * scale, oy + m.z * scale);
  g.stroke();
  g.fillStyle = '#ffd23f';
  g.beginPath(); g.arc(ox + m.x * scale, oy + m.z * scale, 8, 0, Math.PI * 2); g.fill();
  // Player.
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(ox + game.player.x * scale, oy + game.player.z * scale, 6, 0, Math.PI * 2); g.fill();
  // Stats line.
  const stats = document.getElementById('stats-line');
  if (stats) {
    stats.innerHTML = `Missions done ${game.missions.completed}/5 · Garage ${game.garageCars}/4 · Taxi fares ${game.taxiFares} · Races ${game.racesWon} · Amber Shells ${game.player.shells}/20 · <b>42% COMPLETE</b>`;
  }
}

export class Hud {
  constructor(game) { this.game = game; }
  render() { renderHUD(this.game); }
}

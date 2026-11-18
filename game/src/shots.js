// EMBER TIDE — shots: the four staged scenes behind ?shot=. Each one sets
// the live game to a fixed, deterministic state — sunset chase, on-foot
// dialogue, night combat, pause/map — and pins the camera, so the same seed
// always gives the same frame. Nothing here is composited: every pixel is
// the live game rendering. In shot mode the game loop freezes gameplay
// (main.js skips _update) so the staged frame never drifts.

import { MISSIONS } from './config.js';

export const SHOT_NAMES = ['cover', 'street', 'night', 'map'];

function placeNear(game, list, cx, cz, offsets) {
  // Move list items (traffic cars / peds) to fixed offsets around a centre.
  for (let i = 0; i < Math.min(list.length, offsets.length); i++) {
    const it = list[i];
    const [ox, oz, heading] = offsets[i];
    it.x = cx + ox; it.z = cz + oz;
    if (it.mesh) {
      it.mesh.position.set(it.x, 0, it.z);
      if (heading !== undefined) { it.heading = heading; it.mesh.rotation.y = heading; }
    }
    if (it.place) it.place(it.x, it.z, heading ?? 0, it.speed ?? 0);
  }
}

export function applyShot(game, name) {
  const g = game;
  const p = g.player;
  g.shotMode = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('map-screen').classList.add('hidden');

  if (name === 'cover') {
    // S1: sunset beachfront chase on Coral Row avenue (x = -272). The
    // camera sits on the avenue north of the chase looking south, so the
    // player car is large dead-centre, both VPD cruisers close behind it
    // face the camera with their light bars, traffic approaches beyond
    // them, and the ocean, beach and sun are on the right.
    g.setNight(false);
    g.state = 'playing';
    g.missions.setMission(3);
    p.place(-272, 55, Math.PI);
    p.car = g.playerCar;
    p.car.place(-272, 55, Math.PI, 24);
    p.onFoot = false; p.mesh.visible = false;
    p.health = 82; p.armour = 64; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(3, p.x, p.z);
    g.police.cruisers[0].place(-272, 68, Math.PI, 26);
    g.police.cruisers[1].place(-272, 80, Math.PI, 26);
    g.police.units = [
      { id: 'BARRACUDA-12', role: 'RAMMING', dist: 5 },
      { id: 'MANTA-07', role: 'PURSUIT', dist: 9 },
      { id: 'REEF-03', role: 'ROADBLOCK', dist: 31 },
      { id: 'AIR-2', role: 'SEARCHLIGHT', dist: 76 },
    ];
    g.police.placeHelicopter(-258, 95);
    g.police.heli.position.y = 22;
    g.police.heliLight.position.y = 22;
    g.police.trace = 68; g.police.inSight = true;
    g.scoreLine = '+ $150 DRIFT x3 · NEAR MISS +$250';
    g.raceCheckpoint = 0;
    placeNear(g, g.traffic.cars, -272, 55, [[0, 50, Math.PI], [0, 75, Math.PI], [42, 13, -Math.PI / 2], [-2, -30, Math.PI]]);
    placeNear(g, g.traffic.peds, -272, 55, [[-20, -12, 0.5], [-24, 8, 2.4], [-22, 26, 1.2], [-18, 44, 3.1]]);
    g.fixedCamera = { pos: [-272, 5, 32], look: [-272, 1.5, 60] };
  } else if (name === 'street') {
    // S2: on foot at Coral Row at dusk, talking to Selma outside Bayside Arms.
    // Staged on the road side of the shop so its sign faces the camera.
    g.setNight(false);
    g.state = 'playing';
    g.missions.setMission(1);
    p.place(-240, 222, Math.PI);
    p.onFoot = true; p.mesh.visible = true; p.car = null;
    p.health = 96; p.armour = 40; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(0, p.x, p.z);
    g.police.trace = 0; g.police.inSight = false;
    g.scoreLine = 'SIDE JOB · SUNSET SPRINT — RACE AT LUMEN PIER · $800';
    g.raceCheckpoint = 0;
    g.promptText = '[E] BAYSIDE ARMS — BUY AMMO $600';
    placeNear(g, g.traffic.cars, -240, 222, [[60, -18, Math.PI / 2], [-60, -18, Math.PI / 2], [-32, -72, 0]]);
    placeNear(g, g.traffic.peds, -240, 222, [[-10, -6, 0.3], [10, -2, 2.8], [-6, 8, 1.4], [14, 4, 0.9], [-16, -2, 2.2]]);
    g.fixedCamera = { pos: [-240, 5, 238], look: [-240, 3, 200] };
  } else if (name === 'night') {
    // S3: night combat on the Old Foundry road (x = 204). Player on foot
    // facing Kessler's crew up the road, containers and crane to the sides,
    // pickups on the asphalt, helicopter overhead.
    g.setNight(true);
    g.state = 'playing';
    g.missions.setMission(4);
    g.missions.counter = 'CREW 2/6';
    p.place(204, -8, Math.PI);
    p.onFoot = true; p.mesh.visible = true; p.car = null;
    p.weapon = 3; p.health = 74; p.armour = 52; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(3, p.x, p.z);
    g.police.units = [
      { id: 'BARRACUDA-12', role: 'RAMMING', dist: 8 },
      { id: 'MANTA-07', role: 'PURSUIT', dist: 14 },
      { id: 'REEF-03', role: 'ROADBLOCK', dist: 22 },
      { id: 'AIR-2', role: 'SEARCHLIGHT', dist: 76 },
    ];
    g.police.placeHelicopter(222, -70);
    g.police.heli.position.y = 28;
    g.police.heliLight.position.y = 28;
    g.police.trace = 74; g.police.inSight = true;
    g.combat.takedowns = 2;
    // Kessler's crew, on the road ahead of the player.
    const spots = [[198, -32], [210, -44], [197, -56], [211, -30]];
    g.combat.thugs.forEach((t, i) => {
      if (!t.alive || i >= spots.length) return;
      t.x = spots[i][0]; t.z = spots[i][1];
      t.mesh.position.set(t.x, 0, t.z);
      t.mesh.visible = true;
    });
    g.scoreLine = 'KESSLER\u2019S CREW 2/6 · +$120 PER TAKEDOWN · AMMO +24 ON ROAD';
    g.raceCheckpoint = 0;
    g.promptText = '';
    placeNear(g, g.traffic.cars, 204, -8, [[-24, -40, 0], [18, -52, 0]]);
    g.fixedCamera = { pos: [204, 4, 2], look: [204, 6, -45] };
  } else {
    // S4: pause/map screen. Full city map, legend, stats, skills, unlocks.
    g.setNight(false);
    g.state = 'paused';
    g.missions.setMission(3);
    p.place(-272, 55, Math.PI);
    p.car = g.playerCar;
    p.car.place(-272, 55, Math.PI, 0);
    p.onFoot = false; p.mesh.visible = false;
    g.police.setWanted(3, p.x, p.z);
    g.police.units = [
      { id: 'BARRACUDA-12', role: 'RAMMING', dist: 5 },
      { id: 'MANTA-07', role: 'PURSUIT', dist: 9 },
      { id: 'REEF-03', role: 'ROADBLOCK', dist: 31 },
      { id: 'AIR-2', role: 'SEARCHLIGHT', dist: 76 },
    ];
    g.police.placeHelicopter(-286, 18);
    g.police.trace = 68; g.police.inSight = true;
    g.raceCheckpoint = 9;
    g.scoreLine = '+ $150 DRIFT x3 · NEAR MISS +$250';
    document.getElementById('map-screen').classList.remove('hidden');
    g.fixedCamera = { pos: [-272, 5, 32], look: [-272, 1.5, 60] };
  }
  g.hud.render();
  const pe = document.getElementById('prompt');
  if (g.promptText) { pe.textContent = g.promptText; pe.style.display = 'block'; }
  else pe.style.display = 'none';
  g.render.draw();
  window.__shotReady = true;
  return name;
}

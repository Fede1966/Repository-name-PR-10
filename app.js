const STORAGE_KEY = "athletic-club-technical-app-v1";
const SUPABASE_URL = "https://vhmnyjmhnobqmxgulsag.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobW55am1obm9icW14Z3Vsc2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzEyNTMsImV4cCI6MjA5NjI0NzI1M30.Li4R65j3sGHSrIdt7tiubHNDgKrzjXDqcT92BCqZfDA";
const PLAYER_PHOTOS_BUCKET = "player-photos";
const TEAM_NAME = "Athletic Club";

const initialState = {
  players: [
    player("p1", "Unai Simón", 1, "1997-06-11", "Portero", "Diestro"),
    player("p2", "Aitor Paredes", 4, "2000-04-29", "Defensa", "Diestro"),
    player("p3", "Yeray Álvarez", 5, "1995-01-24", "Defensa", "Diestro"),
    player("p4", "Dani Vivian", 3, "1999-07-05", "Defensa", "Diestro"),
    player("p5", "Yuri Berchiche", 17, "1990-02-10", "Defensa", "Zurdo"),
    player("p6", "Ander Herrera", 21, "1989-08-14", "Centrocampista", "Diestro"),
    player("p7", "Mikel Vesga", 6, "1993-05-21", "Centrocampista", "Zurdo"),
    player("p8", "Oihan Sancet", 8, "2000-04-25", "Centrocampista", "Diestro"),
    player("p9", "Nico Williams", 11, "2002-07-12", "Delantero", "Diestro"),
    player("p10", "Iñaki Williams", 9, "1994-06-15", "Delantero", "Diestro"),
    player("p11", "Gorka Guruzeta", 12, "1996-09-12", "Delantero", "Diestro"),
    player("p12", "Álex Berenguer", 7, "1995-07-04", "Delantero", "Ambos"),
    player("p13", "Beñat Prados", 24, "2001-02-08", "Centrocampista", "Diestro"),
    player("p14", "Julen Agirrezabala", 13, "2000-12-26", "Portero", "Diestro"),
    player("p15", "Óscar de Marcos", 18, "1989-04-14", "Defensa", "Diestro")
  ],
  matches: [
    match("m1", 1, TEAM_NAME, "Osasuna", "", "Preparación", ""),
    match("m2", 2, "Betis", TEAM_NAME, "", "Preparación", "")
  ],
  selectedMatchId: "m1",
  activeView: "squad",
  activeDetailTab: "lineup"
};

let state = loadState();
let draggedPlayerId = null;
let remoteSaveTimer = null;
let isPullingRemote = false;

const views = {
  squad: document.querySelector("#squad-view"),
  matches: document.querySelector("#matches-view"),
  lineups: document.querySelector("#lineups-view"),
  gameplan: document.querySelector("#gameplan-view"),
  detail: document.querySelector("#match-detail-view")
};

const pageTitle = document.querySelector("#page-title");
const contextActionButton = document.querySelector("#context-action-button");
const playerDialog = document.querySelector("#player-dialog");
const playerForm = document.querySelector("#player-form");
const matchDialog = document.querySelector("#match-dialog");
const matchForm = document.querySelector("#match-form");
const playerPhotoInput = document.querySelector("#player-photo");
const playerPhotoFileInput = document.querySelector("#player-photo-file");
const playerPhotoPreview = document.querySelector("#player-photo-preview");
const deletePlayerModalButton = document.querySelector("#delete-player-modal-button");

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

contextActionButton.addEventListener("click", () => {
  if (state.activeView === "matches") openMatchDialog();
  else openPlayerDialog();
});

playerPhotoFileInput.addEventListener("change", async () => {
  const file = playerPhotoFileInput.files[0];
  if (!file) return updatePhotoPreview(playerPhotoInput.value);
  updatePhotoPreview(await readFileAsDataUrl(file));
});

deletePlayerModalButton.addEventListener("click", () => {
  const id = document.querySelector("#player-id").value;
  if (!id) return;
  deletePlayer(id);
  playerDialog.close();
});

playerForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const photoFile = playerPhotoFileInput.files[0];
  const playerId = document.querySelector("#player-id").value || crypto.randomUUID();
  const currentPlayer = state.players.find((item) => item.id === playerId);
  const uploadedPhoto = photoFile ? await savePlayerPhoto(photoFile, playerId) : null;
  const formPlayer = {
    id: playerId,
    name: document.querySelector("#player-name").value.trim(),
    number: Number(document.querySelector("#player-number").value),
    birthdate: document.querySelector("#player-birthdate").value,
    position: document.querySelector("#player-position").value,
    laterality: document.querySelector("#player-laterality").value,
    photo: uploadedPhoto?.url || playerPhotoInput.value,
    photoPath: uploadedPhoto?.path || currentPlayer?.photoPath || ""
  };

  const index = state.players.findIndex((item) => item.id === formPlayer.id);
  if (index >= 0) state.players[index] = formPlayer;
  else state.players.push(formPlayer);
  saveState();
  playerDialog.close();
  render();
});

matchForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const id = document.querySelector("#match-id").value || crypto.randomUUID();
  const existing = state.matches.find((item) => item.id === id);
  const formMatch = {
    id,
    round: Number(document.querySelector("#match-round").value),
    date: document.querySelector("#match-date").value,
    home: document.querySelector("#match-home").value.trim(),
    away: document.querySelector("#match-away").value.trim(),
    status: document.querySelector("#match-status").value,
    score: document.querySelector("#match-score").value.trim(),
    lineup: existing?.lineup || {},
    plan: existing?.plan || emptyPlan()
  };

  const index = state.matches.findIndex((item) => item.id === id);
  if (index >= 0) state.matches[index] = formMatch;
  else state.matches.push(formMatch);
  state.selectedMatchId = id;
  saveState();
  matchDialog.close();
  setView("detail");
});

render();
initializeSupabase();

function player(id, name, number, birthdate, position, laterality = "Diestro") {
  return { id, name, number, birthdate, position, laterality, photo: "", photoPath: "" };
}

function match(id, round, home, away, date, status, score) {
  return {
    id,
    round,
    home,
    away,
    date,
    status,
    score,
    lineup: defaultLineup(),
    plan: emptyPlan()
  };
}

function defaultLineup() {
  return {
    p1: { x: 50, y: 90 },
    p4: { x: 28, y: 72 },
    p2: { x: 50, y: 74 },
    p15: { x: 72, y: 72 },
    p5: { x: 18, y: 58 },
    p7: { x: 40, y: 54 },
    p8: { x: 60, y: 52 },
    p12: { x: 82, y: 58 },
    p9: { x: 25, y: 34 },
    p11: { x: 50, y: 25 },
    p10: { x: 75, y: 34 }
  };
}

function emptyPlan() {
  return {
    offensiveText: "",
    defensiveText: "",
    offensiveVideos: [],
    defensiveVideos: []
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(initialState);
    return {
      ...structuredClone(initialState),
      ...saved,
      players: saved.players?.map((item) => ({
        ...item,
        laterality: item.laterality || "Diestro",
        photoPath: item.photoPath || item.photo_path || ""
      })) || structuredClone(initialState.players),
      matches: saved.matches?.map((item) => ({
        ...item,
        lineup: item.lineup || {},
        plan: { ...emptyPlan(), ...(item.plan || {}) }
      })) || structuredClone(initialState.matches)
    };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueRemoteSave();
}

function getSupabaseAnonKey() {
  return SUPABASE_ANON_KEY;
}

function hasSupabaseConfig() {
  return Boolean(getSupabaseAnonKey());
}

function queueRemoteSave() {
  if (!hasSupabaseConfig() || isPullingRemote) return;
  clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => {
    pushRemoteState();
  }, 500);
}

async function initializeSupabase() {
  if (!hasSupabaseConfig()) return;
  await pullRemoteState();
}

async function pullRemoteState() {
  if (!hasSupabaseConfig()) return;
  try {
    isPullingRemote = true;
    const results = await Promise.allSettled([
      supabaseRequest("players?select=*&order=number.asc"),
      supabaseRequest("matches?select=*&order=round.asc"),
      supabaseRequest("lineups?select=*"),
      supabaseRequest("game_plans?select=*")
    ]);
    const players = settledValue(results[0], []);
    const matches = settledValue(results[1], []);
    const lineups = settledValue(results[2], []);
    const plans = settledValue(results[3], []);

    const lineupByMatch = Object.fromEntries(lineups.map((item) => [item.match_id, item.lineup || {}]));
    const planByMatch = {};
    plans.forEach((item) => {
      planByMatch[item.match_id] = {
        offensiveText: item.offensive_text || "",
        defensiveText: item.defensive_text || "",
        offensiveVideos: item.offensive_videos || [],
        defensiveVideos: item.defensive_videos || []
      };
    });

    const hasRemotePlayers = players.length > 0;
    const hasRemoteMatches = matches.length > 0;
    if (hasRemotePlayers) state.players = players.map(fromRemotePlayer);
    if (hasRemoteMatches) {
      state.matches = matches.map((item) => fromRemoteMatch(item, lineupByMatch[item.id], planByMatch[item.id]));
    } else if (!state.matches.length) {
      state.matches = structuredClone(initialState.matches);
    }
    state.selectedMatchId = selectedMatch()?.id || "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    isPullingRemote = false;
    if (!hasRemotePlayers && state.players.length) {
      await supabaseUpsert("players", state.players.map(toRemotePlayer), "id");
    }
    if (!hasRemoteMatches && state.matches.length) {
      await supabaseUpsert("matches", state.matches.map(toRemoteMatch), "id");
      await supabaseUpsert("lineups", state.matches.map(toRemoteLineup), "match_id");
      await supabaseUpsert("game_plans", state.matches.map(toRemotePlan), "match_id");
    }
  } catch (error) {
    console.error(error);
  } finally {
    isPullingRemote = false;
  }
}

function settledValue(result, fallback) {
  if (result.status === "fulfilled") return result.value || fallback;
  console.error(result.reason);
  return fallback;
}

async function pushRemoteState() {
  if (!hasSupabaseConfig()) return;
  try {
    await supabaseUpsert("players", state.players.map(toRemotePlayer), "id");
    await supabaseUpsert("matches", state.matches.map(toRemoteMatch), "id");
    await supabaseUpsert("lineups", state.matches.map(toRemoteLineup), "match_id");
    await supabaseUpsert("game_plans", state.matches.map(toRemotePlan), "match_id");
  } catch (error) {
    console.error(error);
  }
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${getSupabaseAnonKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(await response.text());
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function supabaseUpsert(table, rows, conflictColumn) {
  if (!rows.length) return;
  await supabaseRequest(`${table}?on_conflict=${conflictColumn}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
}

async function supabaseDelete(table, column, value) {
  if (!hasSupabaseConfig()) return;
  try {
    await supabaseRequest(`${table}?${column}=eq.${encodeURIComponent(value)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
  } catch (error) {
    console.error(error);
  }
}

async function supabaseDeletePlayerPhoto(path) {
  if (!hasSupabaseConfig() || !path) return;
  try {
    await supabaseStorageRequest(`object/${PLAYER_PHOTOS_BUCKET}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [path] })
    });
  } catch (error) {
    console.error(error);
  }
}

async function supabaseStorageRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${getSupabaseAnonKey()}`,
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(await response.text());
  const text = await response.text();
  if (!text) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? JSON.parse(text) : text;
}

async function savePlayerPhoto(file, playerId) {
  if (!hasSupabaseConfig()) {
    return { url: await readFileAsDataUrl(file), path: "" };
  }

  try {
    const path = `${playerId}/${Date.now()}-${safeFileName(file.name)}`;
    await supabaseStorageRequest(`object/${PLAYER_PHOTOS_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      },
      body: file
    });
    return {
      path,
      url: `${SUPABASE_URL}/storage/v1/object/public/${PLAYER_PHOTOS_BUCKET}/${encodeStoragePath(path)}`
    };
  } catch (error) {
    console.error(error);
    alert("No se pudo subir la foto a Supabase Storage. Revisa que exista el bucket player-photos ejecutando supabase-schema.sql.");
    return { url: await readFileAsDataUrl(file), path: "" };
  }
}

function toRemotePlayer(item) {
  return {
    id: item.id,
    name: item.name,
    number: item.number,
    birthdate: item.birthdate,
    position: item.position,
    laterality: item.laterality || "Diestro",
    photo: item.photo || "",
    photo_path: item.photoPath || "",
    updated_at: new Date().toISOString()
  };
}

function fromRemotePlayer(item) {
  return {
    id: item.id,
    name: item.name,
    number: item.number,
    birthdate: item.birthdate,
    position: item.position,
    laterality: item.laterality || "Diestro",
    photo: item.photo || "",
    photoPath: item.photo_path || ""
  };
}

function toRemoteMatch(item) {
  return {
    id: item.id,
    round: item.round,
    home: item.home,
    away: item.away,
    date: item.date || null,
    status: item.status,
    score: item.score || "",
    updated_at: new Date().toISOString()
  };
}

function fromRemoteMatch(item, lineup, plan) {
  return {
    id: item.id,
    round: item.round,
    home: item.home,
    away: item.away,
    date: item.date || "",
    status: item.status,
    score: item.score || "",
    lineup: lineup || {},
    plan: plan || emptyPlan()
  };
}

function toRemoteLineup(item) {
  return {
    match_id: item.id,
    lineup: item.lineup || {},
    updated_at: new Date().toISOString()
  };
}

function toRemotePlan(item) {
  return {
    match_id: item.id,
    offensive_text: item.plan?.offensiveText || "",
    defensive_text: item.plan?.defensiveText || "",
    offensive_videos: item.plan?.offensiveVideos || [],
    defensive_videos: item.plan?.defensiveVideos || [],
    updated_at: new Date().toISOString()
  };
}

function setView(view) {
  state.activeView = view;
  saveState();
  render();
}

function render() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === normalizedMainView());
  });

  Object.values(views).forEach((view) => view.classList.remove("active"));
  if (state.activeView === "detail") views.detail.classList.add("active");
  else views[state.activeView].classList.add("active");

  contextActionButton.textContent = state.activeView === "matches" ? "Añadir partido" : "Añadir jugador";
  contextActionButton.style.display = ["detail", "lineups", "gameplan"].includes(state.activeView) ? "none" : "inline-flex";
  pageTitle.textContent = pageTitleForView(state.activeView);

  renderSquad();
  renderMatches();
  renderLineupsPage();
  renderGameplanPage();
  renderMatchDetail();
}

function normalizedMainView() {
  return state.activeView === "detail" ? "matches" : state.activeView;
}

function pageTitleForView(view) {
  const titles = {
    squad: "Plantilla",
    matches: "Partidos",
    lineups: "Alineaciones",
    gameplan: "Plan de partido",
    detail: "Detalle de partido"
  };
  return titles[view] || "Plantilla";
}

function renderSquad() {
  views.squad.innerHTML = `
    <div class="squad-grid">
      ${state.players
        .slice()
        .sort((a, b) => a.number - b.number)
        .map(renderPlayerCard)
        .join("")}
    </div>
  `;

  views.squad.querySelectorAll("[data-edit-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerDialog(button.dataset.editPlayer));
  });
}

function renderPlayerCard(item) {
  const photoStyle = item.photo ? `style="background-image:url('${escapeAttr(item.photo)}')"` : "";
  return `
    <article class="player-card">
      <div class="player-main">
        <div class="avatar" ${photoStyle}>${item.photo ? "" : initials(item.name)}</div>
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <div class="meta">Dorsal ${item.number} · ${escapeHtml(item.position)}</div>
          <div class="meta">Lateralidad: ${escapeHtml(item.laterality || "Diestro")}</div>
          <div class="meta">Nac. ${formatDate(item.birthdate)}</div>
        </div>
      </div>
      <div class="row-actions">
        <button class="secondary-button" data-edit-player="${item.id}" type="button">Editar</button>
      </div>
    </article>
  `;
}

function renderMatches() {
  views.matches.innerHTML = `
    <div class="match-grid">
      ${state.matches
        .slice()
        .sort((a, b) => a.round - b.round)
        .map(renderMatchCard)
        .join("")}
    </div>
  `;

  views.matches.querySelectorAll("[data-open-match]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMatchId = button.dataset.openMatch;
      state.activeDetailTab = "lineup";
      setView("detail");
    });
  });
  views.matches.querySelectorAll("[data-edit-match]").forEach((button) => {
    button.addEventListener("click", () => openMatchDialog(button.dataset.editMatch));
  });
  views.matches.querySelectorAll("[data-delete-match]").forEach((button) => {
    button.addEventListener("click", () => deleteMatch(button.dataset.deleteMatch));
  });
}

function renderMatchCard(item) {
  return `
    <article class="match-card">
      <div class="match-title">
        <div>
          <span class="tag">Jornada ${item.round}</span>
          <h3>${escapeHtml(item.home)} vs ${escapeHtml(item.away)}</h3>
        </div>
        <strong>${escapeHtml(item.score || "-")}</strong>
      </div>
      <div class="meta">${item.date ? formatDate(item.date) : "Fecha pendiente"} · ${escapeHtml(item.status)}</div>
      <div class="row-actions">
        <button class="primary-button" data-open-match="${item.id}" type="button">Abrir</button>
        <button class="secondary-button" data-edit-match="${item.id}" type="button">Editar</button>
        <button class="danger-button" data-delete-match="${item.id}" type="button">Eliminar</button>
      </div>
    </article>
  `;
}

function renderMatchDetail() {
  const item = state.matches.find((matchItem) => matchItem.id === state.selectedMatchId) || state.matches[0];
  if (!item) {
    views.detail.innerHTML = `<div class="empty-state">Todavía no hay partidos creados.</div>`;
    return;
  }
  state.selectedMatchId = item.id;

  views.detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-title">
        <p class="eyebrow">Jornada ${item.round}</p>
        <h2>${escapeHtml(item.home)} vs ${escapeHtml(item.away)}</h2>
        <div class="meta">${item.date ? formatDate(item.date) : "Fecha pendiente"} · ${escapeHtml(item.status)} · Resultado ${escapeHtml(item.score || "-")}</div>
      </div>
      <div class="detail-actions">
        <button class="secondary-button" id="back-to-matches" type="button">Volver</button>
        <button class="secondary-button" data-edit-match="${item.id}" type="button">Editar partido</button>
      </div>
    </div>
    <div class="detail-tabs">
      <button class="detail-tab ${state.activeDetailTab === "lineup" ? "active" : ""}" data-detail-tab="lineup" type="button">Alineación</button>
      <button class="detail-tab ${state.activeDetailTab === "plan" ? "active" : ""}" data-detail-tab="plan" type="button">Plan de partido</button>
    </div>
    <div id="detail-body"></div>
  `;

  views.detail.querySelector("#back-to-matches").addEventListener("click", () => setView("matches"));
  views.detail.querySelector("[data-edit-match]").addEventListener("click", () => openMatchDialog(item.id));
  views.detail.querySelectorAll("[data-detail-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDetailTab = button.dataset.detailTab;
      saveState();
      render();
    });
  });

  const body = views.detail.querySelector("#detail-body");
  if (state.activeDetailTab === "plan") renderPlan(item, body);
  else renderLineup(item, body);
}

function renderLineupsPage() {
  const item = selectedMatch();
  if (!item) {
    views.lineups.innerHTML = `<div class="empty-state">Crea un partido para preparar una alineación.</div>`;
    return;
  }

  views.lineups.innerHTML = `
    ${renderMatchSelector("lineup-match-selector")}
    <div id="lineups-body"></div>
  `;
  bindMatchSelector(views.lineups.querySelector("#lineup-match-selector"));
  renderLineup(item, views.lineups.querySelector("#lineups-body"));
}

function renderGameplanPage() {
  const item = selectedMatch();
  if (!item) {
    views.gameplan.innerHTML = `<div class="empty-state">Crea un partido para preparar el plan de partido.</div>`;
    return;
  }

  views.gameplan.innerHTML = `
    ${renderMatchSelector("gameplan-match-selector")}
    <div id="gameplan-body"></div>
  `;
  bindMatchSelector(views.gameplan.querySelector("#gameplan-match-selector"));
  renderPlan(item, views.gameplan.querySelector("#gameplan-body"));
}

function renderLineup(item, body) {
  const lineupIds = new Set(Object.keys(item.lineup || {}));
  const bench = state.players.filter((playerItem) => !lineupIds.has(playerItem.id));

  body.innerHTML = `
    <div class="lineup-layout">
      <div class="panel">
        <h2>Campo</h2>
        <p class="meta">Arrastra jugadores desde suplentes o mueve las fichas ya colocadas.</p>
        <div class="pitch" id="pitch">
          <div class="goal goal-top"></div>
          <div class="goal goal-bottom"></div>
          <div class="goal-area goal-area-top"></div>
          <div class="goal-area goal-area-bottom"></div>
          <div class="penalty-spot penalty-spot-top"></div>
          <div class="penalty-spot penalty-spot-bottom"></div>
          <div class="penalty-arc penalty-arc-top"></div>
          <div class="penalty-arc penalty-arc-bottom"></div>
          <div class="center-circle"></div>
          <div class="center-spot"></div>
          ${Object.entries(item.lineup || {})
            .map(([playerId, position]) => renderLineupToken(playerId, position))
            .join("")}
        </div>
      </div>
      <aside class="panel">
        <h2>Suplentes y no convocados</h2>
        <div class="bench-list">
          ${bench.length ? bench.map(renderBenchPlayer).join("") : `<div class="empty-state">Todos los jugadores están situados en el campo.</div>`}
        </div>
      </aside>
    </div>
  `;

  const pitch = body.querySelector("#pitch");
  pitch.addEventListener("dragover", (event) => event.preventDefault());
  pitch.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!draggedPlayerId) return;
    const rect = pitch.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 7, 93);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 5, 95);
    item.lineup[draggedPlayerId] = { x, y };
    draggedPlayerId = null;
    saveState();
    render();
  });

  body.querySelectorAll("[draggable='true']").forEach((node) => {
    node.addEventListener("dragstart", () => {
      draggedPlayerId = node.dataset.playerId;
    });
  });

  body.querySelectorAll("[data-remove-lineup]").forEach((button) => {
    button.addEventListener("click", () => {
      delete item.lineup[button.dataset.removeLineup];
      saveState();
      render();
    });
  });

  body.querySelectorAll("[data-place-player]").forEach((button) => {
    button.addEventListener("click", () => {
      item.lineup[button.dataset.placePlayer] = nextLineupSlot(item);
      saveState();
      render();
    });
  });
}

function renderLineupToken(playerId, position) {
  const item = state.players.find((playerItem) => playerItem.id === playerId);
  if (!item) return "";
  return `
    <div class="lineup-token" draggable="true" data-player-id="${item.id}" style="left:${position.x}%;top:${position.y}%">
      <span>${item.number}</span>
      <small>${escapeHtml(shortName(item.name))}</small>
      <button class="icon-button token-remove" data-remove-lineup="${item.id}" type="button" aria-label="Quitar de alineación">×</button>
    </div>
  `;
}

function renderBenchPlayer(item) {
  return `
    <div class="bench-player" draggable="true" data-player-id="${item.id}">
      <span class="number-badge">${item.number}</span>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="meta">${escapeHtml(item.position)}</div>
      </div>
      <button class="secondary-button" data-place-player="${item.id}" type="button">Colocar</button>
    </div>
  `;
}

function renderPlan(item, body) {
  body.innerHTML = `
    <div class="plan-grid">
      ${renderPlanPanel(item, "offensive", "Acciones ofensivas")}
      ${renderPlanPanel(item, "defensive", "Acciones defensivas")}
    </div>
  `;

  body.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      item.plan[`${textarea.dataset.planType}Text`] = textarea.value;
      saveState();
    });
  });

  body.querySelectorAll("[data-add-video]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".panel").querySelector("[data-video-url]");
      addVideo(item, button.dataset.addVideo, input.value.trim());
    });
  });

  body.querySelectorAll("[data-video-file]").forEach((input) => {
    input.addEventListener("change", () => addVideoFile(item, input.dataset.videoFile, input.files[0]));
  });

  body.querySelectorAll("[data-remove-video]").forEach((button) => {
    button.addEventListener("click", () => {
      const [type, index] = button.dataset.removeVideo.split(":");
      item.plan[`${type}Videos`].splice(Number(index), 1);
      saveState();
      render();
    });
  });
}

function renderMatchSelector(id) {
  const item = selectedMatch();
  return `
    <div class="page-context panel">
      <label>
        Partido
        <select id="${id}">
          ${state.matches
            .slice()
            .sort((a, b) => a.round - b.round)
            .map((matchItem) => `
              <option value="${matchItem.id}" ${matchItem.id === item?.id ? "selected" : ""}>
                Jornada ${matchItem.round}: ${escapeHtml(matchItem.home)} vs ${escapeHtml(matchItem.away)}
              </option>
            `)
            .join("")}
        </select>
      </label>
      <div class="meta">${item?.date ? formatDate(item.date) : "Fecha pendiente"} · ${escapeHtml(item?.status || "")}</div>
    </div>
  `;
}

function bindMatchSelector(selector) {
  selector.addEventListener("change", () => {
    state.selectedMatchId = selector.value;
    saveState();
    render();
  });
}

function renderPlanPanel(item, type, title) {
  const videos = item.plan[`${type}Videos`] || [];
  return `
    <section class="panel">
      <h2>${title}</h2>
      <label>
        Plan
        <textarea data-plan-type="${type}" placeholder="Escribe aquí el plan ${type === "offensive" ? "ofensivo" : "defensivo"}...">${escapeHtml(item.plan[`${type}Text`] || "")}</textarea>
      </label>
      <div class="video-row">
        <input data-video-url type="url" placeholder="URL de vídeo" />
        <button class="secondary-button" data-add-video="${type}" type="button">Añadir URL</button>
      </div>
      <label>
        Subir vídeo
        <input data-video-file="${type}" type="file" accept="video/*" />
      </label>
      <div class="video-list">
        ${videos.length ? videos.map((video, index) => renderVideoItem(video, type, index)).join("") : `<div class="empty-state">Sin vídeos añadidos.</div>`}
      </div>
    </section>
  `;
}

function renderVideoItem(video, type, index) {
  const label = video.name || video.url;
  const link = video.url ? `<a href="${escapeAttr(video.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : `<strong>${escapeHtml(label)}</strong>`;
  return `
    <div class="video-item">
      ${link}
      <button class="icon-button" data-remove-video="${type}:${index}" type="button" aria-label="Eliminar vídeo">×</button>
    </div>
  `;
}

function addVideo(item, type, url) {
  if (!url) return;
  item.plan[`${type}Videos`].push({ type: "url", url, name: url });
  saveState();
  render();
}

function addVideoFile(item, type, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      item.plan[`${type}Videos`].push({
        type: "file",
        name: file.name,
        url: reader.result
      });
      saveState();
      render();
    } catch {
      alert("El vídeo es demasiado grande para guardarlo en este navegador. Prueba con una URL o un archivo más pequeño.");
    }
  });
  reader.readAsDataURL(file);
}

function openPlayerDialog(id) {
  const item = state.players.find((playerItem) => playerItem.id === id);
  document.querySelector("#player-modal-title").textContent = item ? "Editar jugador" : "Nuevo jugador";
  deletePlayerModalButton.style.display = item ? "inline-flex" : "none";
  document.querySelector("#player-id").value = item?.id || "";
  document.querySelector("#player-name").value = item?.name || "";
  document.querySelector("#player-number").value = item?.number || "";
  document.querySelector("#player-birthdate").value = item?.birthdate || "";
  document.querySelector("#player-position").value = item?.position || "Defensa";
  document.querySelector("#player-laterality").value = item?.laterality || "Diestro";
  playerPhotoInput.value = item?.photo || "";
  playerPhotoFileInput.value = "";
  updatePhotoPreview(item?.photo || "");
  playerDialog.showModal();
}

function openMatchDialog(id) {
  const item = state.matches.find((matchItem) => matchItem.id === id);
  document.querySelector("#match-modal-title").textContent = item ? "Editar partido" : "Nuevo partido";
  document.querySelector("#match-id").value = item?.id || "";
  document.querySelector("#match-round").value = item?.round || nextRound();
  document.querySelector("#match-date").value = item?.date || "";
  document.querySelector("#match-home").value = item?.home || TEAM_NAME;
  document.querySelector("#match-away").value = item?.away || "";
  document.querySelector("#match-status").value = item?.status || "Preparación";
  document.querySelector("#match-score").value = item?.score || "";
  matchDialog.showModal();
}

function deletePlayer(id) {
  const item = state.players.find((playerItem) => playerItem.id === id);
  if (!item || !confirm(`¿Eliminar a ${item.name}?`)) return;
  state.players = state.players.filter((playerItem) => playerItem.id !== id);
  state.matches.forEach((matchItem) => delete matchItem.lineup[id]);
  saveState();
  supabaseDeletePlayerPhoto(item.photoPath);
  supabaseDelete("players", "id", id);
  render();
}

function deleteMatch(id) {
  const item = state.matches.find((matchItem) => matchItem.id === id);
  if (!item || !confirm(`¿Eliminar la jornada ${item.round}?`)) return;
  state.matches = state.matches.filter((matchItem) => matchItem.id !== id);
  state.selectedMatchId = state.matches[0]?.id || "";
  saveState();
  supabaseDelete("matches", "id", id);
  render();
}

function selectedMatch() {
  const item = state.matches.find((matchItem) => matchItem.id === state.selectedMatchId) || state.matches[0];
  if (item) state.selectedMatchId = item.id;
  return item;
}

function nextRound() {
  return Math.max(0, ...state.matches.map((item) => item.round)) + 1;
}

function updatePhotoPreview(photo) {
  playerPhotoPreview.classList.toggle("has-photo", Boolean(photo));
  playerPhotoPreview.style.backgroundImage = photo ? `url("${photo}")` : "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function safeFileName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "foto-jugador";
}

function encodeStoragePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function nextLineupSlot(item) {
  const slots = [
    { x: 50, y: 88 },
    { x: 25, y: 70 },
    { x: 50, y: 72 },
    { x: 75, y: 70 },
    { x: 28, y: 52 },
    { x: 50, y: 50 },
    { x: 72, y: 52 },
    { x: 25, y: 32 },
    { x: 50, y: 26 },
    { x: 75, y: 32 },
    { x: 50, y: 15 }
  ];
  const used = Object.keys(item.lineup || {}).length;
  return slots[used % slots.length];
}

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function shortName(name) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

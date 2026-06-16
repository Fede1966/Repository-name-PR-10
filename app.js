const STORAGE_KEY = "athletic-club-technical-app-v1";
const SUPABASE_URL = "https://vhmnyjmhnobqmxgulsag.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobW55am1obm9icW14Z3Vsc2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzEyNTMsImV4cCI6MjA5NjI0NzI1M30.Li4R65j3sGHSrIdt7tiubHNDgKrzjXDqcT92BCqZfDA";
const PLAYER_PHOTOS_BUCKET = "player-photos";
const TEAM_NAME = "Athletic Club";
const DEFAULT_TEAM_ID = "athletic-club";
const DEFAULT_VISIBLE_TEAM = {
  id: "ce-ferreries-cadete-preferente",
  name: "CE Ferreries Cadete Preferente"
};
const DEFAULT_FORMATION = "1442";
const FORMATION_STORAGE_KEY = "__formation";
const APP_STATE_MATCH_ID = "__app_state__";
const REMOVED_TEAM_IDS = new Set(["athletic-club", "ce-ferreries-cadete-a"]);
const REMOVED_MATCH_IDS = new Set(["b7023b94-d831-4795-aab4-c861b3a7a7cd"]);
const FINAL_STANDINGS = [
  { name: 'CF SPORTING DE MAHON "A"', played: 14, won: 11, drawn: 1, lost: 2, points: 34 },
  { name: 'UD MAHON "A"', played: 14, won: 9, drawn: 0, lost: 5, points: 27 },
  { name: 'CIUTADELLA C.E. "A"', played: 14, won: 9, drawn: 0, lost: 5, points: 27 },
  { name: 'CE FERRERIES "A"', played: 14, won: 8, drawn: 2, lost: 4, points: 26 },
  { name: 'PENYA CIUTADELLA ESPORTIVA "A"', played: 14, won: 5, drawn: 4, lost: 5, points: 19 },
  { name: 'CD MENORCA "B"', played: 14, won: 4, drawn: 2, lost: 8, points: 14 },
  { name: "CE ALAIOR", played: 14, won: 3, drawn: 3, lost: 8, points: 12 },
  { name: 'CE MERCADAL "B"', played: 14, won: 0, drawn: 2, lost: 12, points: 2 }
];
const PLAN_SECTIONS = [
  ["offensive", "Acciones ofensivas"],
  ["defensive", "Acciones defensivas"],
  ["offensiveTransition", "Transiciones ofensivas"],
  ["defensiveTransition", "Transiciones defensivas"],
  ["offensiveSetPieces", "ABP ofensivas"],
  ["defensiveSetPieces", "ABP defensivas"]
];
const FORMATIONS = {
  "1442": {
    label: "1-4-4-2",
    slots: formationSlots([1, 4, 4, 2], [90, 72, 49, 24])
  },
  "1352": {
    label: "1-3-5-2",
    slots: formationSlots([1, 3, 5, 2], [90, 72, 49, 24])
  },
  "1433": {
    label: "1-4-3-3",
    slots: formationSlots([1, 4, 3, 3], [90, 72, 49, 24])
  },
  "14231": {
    label: "1-4-2-3-1",
    slots: formationSlots([1, 4, 2, 3, 1], [90, 72, 56, 38, 19])
  }
};

const initialState = {
  lastModifiedAt: 0,
  teams: [DEFAULT_VISIBLE_TEAM],
  activeTeamId: DEFAULT_VISIBLE_TEAM.id,
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
  selectedPlayerId: "p1",
  activeView: "squad",
  activeDetailTab: "plan",
  activePlayerTab: "statistics"
};

let state = loadState();
let draggedPlayerId = null;
let remoteSaveTimer = null;
let isPullingRemote = false;
let supportsRemotePlayerProfiles = false;
let returnToPlayerReportsAfterMatchSave = false;

const views = {
  squad: document.querySelector("#squad-view"),
  matches: document.querySelector("#matches-view"),
  standings: document.querySelector("#standings-view"),
  statistics: document.querySelector("#statistics-view"),
  playerDetail: document.querySelector("#player-detail-view"),
  detail: document.querySelector("#match-detail-view")
};

const pageTitle = document.querySelector("#page-title");
const contextActionButton = document.querySelector("#context-action-button");
const playerDialog = document.querySelector("#player-dialog");
const playerForm = document.querySelector("#player-form");
const matchDialog = document.querySelector("#match-dialog");
const matchForm = document.querySelector("#match-form");
const teamDialog = document.querySelector("#team-dialog");
const teamForm = document.querySelector("#team-form");
const deleteTeamButton = document.querySelector("#delete-team-button");
const playerPhotoInput = document.querySelector("#player-photo");
const playerPhotoFileInput = document.querySelector("#player-photo-file");
const playerPhotoPreview = document.querySelector("#player-photo-preview");
const deletePlayerModalButton = document.querySelector("#delete-player-modal-button");

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

teamForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const teamId = document.querySelector("#team-id").value;
  const name = document.querySelector("#team-name").value.trim();
  if (!name) return;
  if (teamId) {
    renameTeam(teamId, name);
  } else {
    const id = uniqueTeamId(name);
    state.teams.push({ id, name });
    state.activeTeamId = id;
    state.selectedPlayerId = "";
    state.selectedMatchId = "";
  }
  saveState();
  teamDialog.close();
  render();
});

deleteTeamButton.addEventListener("click", () => {
  const teamId = document.querySelector("#team-id").value;
  if (teamId) deleteTeam(teamId);
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
    teamId: state.activeTeamId,
    name: document.querySelector("#player-name").value.trim(),
    number: Number(document.querySelector("#player-number").value),
    birthdate: document.querySelector("#player-birthdate").value,
    position: document.querySelector("#player-position").value,
    laterality: document.querySelector("#player-laterality").value,
    photo: uploadedPhoto?.url || playerPhotoInput.value,
    photoPath: uploadedPhoto?.path || currentPlayer?.photoPath || "",
    description: currentPlayer?.description || "",
    career: currentPlayer?.career || "",
    ratings: normalizePlayerRatings(currentPlayer?.ratings),
    reports: normalizePlayerReports(currentPlayer?.reports)
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
    teamId: state.activeTeamId,
    round: Number(document.querySelector("#match-round").value),
    date: document.querySelector("#match-date").value,
    home: document.querySelector("#match-home").value.trim(),
    away: document.querySelector("#match-away").value.trim(),
    status: document.querySelector("#match-status").value,
    score: document.querySelector("#match-score").value.trim(),
    teamStats: {
      yellowCards: nonNegativeInteger(document.querySelector("#match-yellow-cards").value),
      redCards: nonNegativeInteger(document.querySelector("#match-red-cards").value),
      penaltiesFor: nonNegativeInteger(document.querySelector("#match-penalties-for").value),
      penaltiesAgainst: nonNegativeInteger(document.querySelector("#match-penalties-against").value),
      chancesCreated: nonNegativeInteger(document.querySelector("#match-chances-created").value),
      chancesAgainst: nonNegativeInteger(document.querySelector("#match-chances-against").value)
    },
    notes: existing?.notes || "",
    lineupSheets: existing?.lineupSheets || null,
    lineup: existing?.lineup || {},
    formation: existing?.formation || DEFAULT_FORMATION,
    plan: existing?.plan || emptyPlan()
  };

  const index = state.matches.findIndex((item) => item.id === id);
  if (index >= 0) state.matches[index] = formMatch;
  else state.matches.push(formMatch);
  state.selectedMatchId = id;
  state.activeDetailTab = "plan";
  saveState();
  matchDialog.close();
  if (returnToPlayerReportsAfterMatchSave) {
    returnToPlayerReportsAfterMatchSave = false;
    state.activeView = "playerDetail";
    state.activePlayerTab = "reports";
    saveState();
    render();
  } else {
    setView("detail");
  }
});

render();
initializeSupabase();

function player(id, name, number, birthdate, position, laterality = "Diestro", teamId = DEFAULT_TEAM_ID) {
  return {
    id,
    teamId,
    name,
    number,
    birthdate,
    position,
    laterality,
    photo: "",
    photoPath: "",
    description: "",
    career: "",
    ratings: defaultPlayerRatings(),
    reports: {}
  };
}

function match(id, round, home, away, date, status, score, teamId = DEFAULT_TEAM_ID) {
  return {
    id,
    teamId,
    round,
    home,
    away,
    date,
    status,
    score,
    teamStats: emptyTeamMatchStats(),
    notes: "",
    lineupSheets: null,
    lineup: defaultLineup(),
    formation: DEFAULT_FORMATION,
    plan: emptyPlan()
  };
}

function defaultLineup() {
  return {
    p1: { x: 50, y: 90 },
    p5: { x: 14, y: 72 },
    p4: { x: 38, y: 72 },
    p2: { x: 62, y: 72 },
    p15: { x: 86, y: 72 },
    p9: { x: 14, y: 49 },
    p7: { x: 38, y: 49 },
    p8: { x: 62, y: 49 },
    p12: { x: 86, y: 49 },
    p11: { x: 22, y: 24 },
    p10: { x: 78, y: 24 }
  };
}

function emptyPlan() {
  return Object.fromEntries(
    PLAN_SECTIONS.flatMap(([type]) => [
      [`${type}Text`, ""],
      [`${type}Videos`, []]
    ])
  );
}

function normalizePlan(value) {
  const plan = emptyPlan();
  PLAN_SECTIONS.forEach(([type]) => {
    plan[`${type}Text`] = value?.[`${type}Text`] || "";
    plan[`${type}Videos`] = Array.isArray(value?.[`${type}Videos`])
      ? value[`${type}Videos`].filter((video) => video && !video.__expandedPlan)
      : [];
  });
  return plan;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(initialState);
    const activeView = ["lineups", "gameplan"].includes(saved.activeView) ? "matches" : saved.activeView;
    const visibleTeams = (saved.teams?.length ? saved.teams : structuredClone(initialState.teams)).filter(
      (item) => !REMOVED_TEAM_IDS.has(item.id)
    );
    const teams = visibleTeams.length ? visibleTeams : structuredClone(initialState.teams);
    const activeTeamId = teams.some((item) => item.id === saved.activeTeamId) ? saved.activeTeamId : teams[0].id;
    return {
      ...structuredClone(initialState),
      ...saved,
      lastModifiedAt: Number(saved.lastModifiedAt) || 1,
      activeView,
      teams,
      activeTeamId,
      players: saved.players?.map((item) => ({
        ...item,
        teamId: item.teamId || DEFAULT_TEAM_ID,
        laterality: item.laterality || "Diestro",
        photoPath: item.photoPath || item.photo_path || "",
        description: item.description || "",
        career: item.career || "",
        ratings: normalizePlayerRatings(item.ratings),
        reports: normalizePlayerReports(item.reports)
      })) || structuredClone(initialState.players),
      matches:
        saved.matches
          ?.filter((item) => !REMOVED_MATCH_IDS.has(item.id))
          .map((item) => ({
            ...item,
            teamId: item.teamId || DEFAULT_TEAM_ID,
            teamStats: normalizeTeamMatchStats(item.teamStats),
            notes: item.notes || "",
            lineupSheets: normalizeLineupSheets(item.lineupSheets, item),
            lineup: item.lineup || {},
            formation: item.formation || DEFAULT_FORMATION,
            plan: normalizePlan(item.plan)
          })) || structuredClone(initialState.matches)
    };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  state.lastModifiedAt = Date.now();
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
    const requiredFailure = results.slice(0, 3).find((result) => result.status === "rejected");
    if (requiredFailure) throw requiredFailure.reason;
    supportsRemotePlayerProfiles = players.some((item) => Object.hasOwn(item, "profile_data"));

    const remoteAppState = parseRemoteAppState(
      lineups.find((item) => item.match_id === APP_STATE_MATCH_ID)?.lineup
    );
    const remoteUpdatedAt = Number(remoteAppState?.updatedAt) || 0;
    const preferLocal = Number(state.lastModifiedAt) > remoteUpdatedAt;
    const visibleMatches = matches.filter(
      (item) => item.id !== APP_STATE_MATCH_ID && !REMOVED_MATCH_IDS.has(item.id)
    );
    const visibleLineups = lineups.filter((item) => item.match_id !== APP_STATE_MATCH_ID);
    const lineupByMatch = Object.fromEntries(
      visibleLineups.map((item) => [item.match_id, parseRemoteLineup(item.lineup)])
    );
    const planByMatch = {};
    plans.forEach((item) => {
      planByMatch[item.match_id] = parseRemotePlan(item);
    });

    const hasRemotePlayers = players.length > 0;
    const hasRemoteMatches = visibleMatches.length > 0;
    if (hasRemotePlayers) {
      const localPlayers = new Map(state.players.map((item) => [item.id, item]));
      const remotePlayerIds = new Set(players.map((item) => item.id));
      state.players = [
        ...players.map((item) => fromRemotePlayer(item, localPlayers.get(item.id))),
        ...state.players.filter((item) => !remotePlayerIds.has(item.id))
      ];
    }
    if (hasRemoteMatches) {
      const localMatches = new Map(state.matches.map((item) => [item.id, item]));
      const remoteMatchIds = new Set(visibleMatches.map((item) => item.id));
      state.matches = [
        ...visibleMatches.map((item) => {
          const remoteMatch = fromRemoteMatch(item, lineupByMatch[item.id], planByMatch[item.id]);
          return preferLocal && localMatches.has(item.id) ? localMatches.get(item.id) : remoteMatch;
        }),
        ...state.matches.filter(
          (item) => !remoteMatchIds.has(item.id) && !REMOVED_MATCH_IDS.has(item.id)
        )
      ];
    } else if (!state.matches.length) {
      state.matches = structuredClone(initialState.matches);
    }
    if (remoteAppState) {
      applyRemoteAppState(remoteAppState, preferLocal);
      state.lastModifiedAt = Math.max(Number(state.lastModifiedAt) || 0, remoteUpdatedAt);
    }
    syncTeamsFromData();
    state.selectedMatchId = selectedMatch()?.id || "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
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

async function pushRemoteState(throwOnError = false) {
  if (!hasSupabaseConfig()) return;
  try {
    state.matches = state.matches.filter((item) => !REMOVED_MATCH_IDS.has(item.id));
    await supabaseUpsert("players", state.players.map(toRemotePlayer), "id");
    await supabaseUpsert("matches", [...state.matches.map(toRemoteMatch), toRemoteAppStateMatch()], "id");
    await supabaseUpsert("lineups", [...state.matches.map(toRemoteLineup), toRemoteAppStateLineup()], "match_id");
    await supabaseUpsert("game_plans", state.matches.map(toRemotePlan), "match_id");
  } catch (error) {
    console.error(error);
    if (throwOnError) throw error;
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
    ...(supportsRemotePlayerProfiles
      ? {
          profile_data: {
            teamId: item.teamId || DEFAULT_TEAM_ID,
            teamName: teamName(item.teamId),
            description: item.description || "",
            career: item.career || "",
            ratings: normalizePlayerRatings(item.ratings),
            reports: item.reports || {}
          }
        }
      : {}),
    updated_at: new Date().toISOString()
  };
}

function fromRemotePlayer(item, localItem = {}) {
  const remoteProfile = item.profile_data || {};
  return {
    id: item.id,
    teamId: remoteProfile.teamId || localItem.teamId || DEFAULT_TEAM_ID,
    teamName: remoteProfile.teamName || localItem.teamName || "",
    name: item.name,
    number: item.number,
    birthdate: item.birthdate,
    position: item.position,
    laterality: item.laterality || "Diestro",
    photo: item.photo || localItem.photo || "",
    photoPath: item.photo_path || localItem.photoPath || "",
    description: remoteProfile.description || localItem.description || "",
    career: remoteProfile.career || localItem.career || "",
    ratings: normalizePlayerRatings(remoteProfile.ratings || localItem.ratings),
    reports: normalizePlayerReports({ ...(localItem.reports || {}), ...(remoteProfile.reports || {}) })
  };
}

function playerProfileSnapshot(item) {
  return {
    teamId: item.teamId || DEFAULT_TEAM_ID,
    teamName: teamName(item.teamId),
    description: item.description || "",
    career: item.career || "",
    ratings: normalizePlayerRatings(item.ratings),
    reports: normalizePlayerReports(item.reports)
  };
}

function toRemoteAppStateMatch() {
  return {
    id: APP_STATE_MATCH_ID,
    round: 0,
    home: "Estado de la aplicación",
    away: "Estado de la aplicación",
    date: null,
    status: "Sistema",
    score: "",
    updated_at: new Date().toISOString()
  };
}

function toRemoteAppStateLineup() {
  return {
    match_id: APP_STATE_MATCH_ID,
    lineup: {
      __appState: {
        version: 1,
        updatedAt: Number(state.lastModifiedAt) || Date.now(),
        teams: state.teams,
        activeTeamId: state.activeTeamId,
        playerProfiles: Object.fromEntries(
          state.players.map((item) => [item.id, playerProfileSnapshot(item)])
        )
      }
    },
    updated_at: new Date().toISOString()
  };
}

function parseRemoteAppState(value) {
  const appState = value?.__appState;
  return appState && typeof appState === "object" ? appState : null;
}

function applyRemoteAppState(remoteAppState, preferLocal) {
  if (Array.isArray(remoteAppState.teams) && remoteAppState.teams.length) {
    const remoteTeams = remoteAppState.teams
      .filter((item) => item?.id && item?.name)
      .filter((item) => !REMOVED_TEAM_IDS.has(String(item.id)))
      .map((item) => ({ id: String(item.id), name: String(item.name) }));
    const teamsById = new Map(
      (preferLocal ? [...remoteTeams, ...state.teams] : [...state.teams, ...remoteTeams]).map((item) => [
        item.id,
        item
      ])
    );
    state.teams = [...teamsById.values()];
  }
  if (!preferLocal && state.teams.some((item) => item.id === remoteAppState.activeTeamId)) {
    state.activeTeamId = remoteAppState.activeTeamId;
  }
  const profiles = remoteAppState.playerProfiles || {};
  state.players = state.players.map((item) => {
    const profile = profiles[item.id];
    if (!profile) return item;
    const reports = preferLocal
      ? { ...(profile.reports || {}), ...(item.reports || {}) }
      : { ...(item.reports || {}), ...(profile.reports || {}) };
    const primary = preferLocal ? item : profile;
    const secondary = preferLocal ? profile : item;
    return {
      ...item,
      teamId: primary.teamId || secondary.teamId || DEFAULT_TEAM_ID,
      teamName: primary.teamName || secondary.teamName || "",
      description: primary.description || secondary.description || "",
      career: primary.career || secondary.career || "",
      ratings: normalizePlayerRatings(primary.ratings || secondary.ratings),
      reports: normalizePlayerReports(reports)
    };
  });
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

function fromRemoteMatch(item, lineupData, plan) {
  return {
    id: item.id,
    teamId: lineupData?.teamId || DEFAULT_TEAM_ID,
    teamName: lineupData?.teamName || "",
    round: item.round,
    home: item.home,
    away: item.away,
    date: item.date || "",
    status: item.status,
    score: item.score || "",
    teamStats: normalizeTeamMatchStats(lineupData?.teamStats),
    notes: lineupData?.notes || "",
    lineupSheets: normalizeLineupSheets(lineupData?.lineupSheets, {
      ...item,
      teamId: lineupData?.teamId || DEFAULT_TEAM_ID,
      lineup: lineupData?.lineup || {}
    }),
    lineup: lineupData?.lineup || {},
    formation: lineupData?.formation || DEFAULT_FORMATION,
    plan: normalizePlan(plan)
  };
}

function toRemoteLineup(item) {
  return {
    match_id: item.id,
    lineup: {
      ...(item.lineup || {}),
      [FORMATION_STORAGE_KEY]: item.formation || DEFAULT_FORMATION,
      __teamId: item.teamId || DEFAULT_TEAM_ID,
      __teamName: teamName(item.teamId),
      __teamStats: normalizeTeamMatchStats(item.teamStats),
      __matchNotes: item.notes || "",
      __lineupSheets: normalizeLineupSheets(item.lineupSheets, item)
    },
    updated_at: new Date().toISOString()
  };
}

function parseRemoteLineup(value) {
  const lineup = { ...(value || {}) };
  const formation = FORMATIONS[lineup[FORMATION_STORAGE_KEY]] ? lineup[FORMATION_STORAGE_KEY] : DEFAULT_FORMATION;
  const teamId = lineup.__teamId || DEFAULT_TEAM_ID;
  const remoteTeamName = lineup.__teamName || "";
  const teamStats = normalizeTeamMatchStats(lineup.__teamStats);
  const notes = lineup.__matchNotes || "";
  const lineupSheets = lineup.__lineupSheets || null;
  delete lineup[FORMATION_STORAGE_KEY];
  delete lineup.__teamId;
  delete lineup.__teamName;
  delete lineup.__teamStats;
  delete lineup.__matchNotes;
  delete lineup.__lineupSheets;
  return { lineup, formation, teamId, teamName: remoteTeamName, teamStats, notes, lineupSheets };
}

function toRemotePlan(item) {
  const plan = normalizePlan(item.plan);
  const expandedPlan = Object.fromEntries(
    PLAN_SECTIONS.slice(2).flatMap(([type]) => [
      [`${type}Text`, plan[`${type}Text`]],
      [`${type}Videos`, plan[`${type}Videos`]]
    ])
  );
  return {
    match_id: item.id,
    offensive_text: plan.offensiveText,
    defensive_text: plan.defensiveText,
    offensive_videos: [...plan.offensiveVideos, { __expandedPlan: expandedPlan }],
    defensive_videos: plan.defensiveVideos,
    updated_at: new Date().toISOString()
  };
}

function parseRemotePlan(item) {
  const offensiveVideos = Array.isArray(item.offensive_videos) ? item.offensive_videos : [];
  const expandedPlan = offensiveVideos.find((video) => video?.__expandedPlan)?.__expandedPlan || {};
  return normalizePlan({
    offensiveText: item.offensive_text || "",
    defensiveText: item.defensive_text || "",
    offensiveVideos,
    defensiveVideos: item.defensive_videos || [],
    ...expandedPlan
  });
}

function setView(view) {
  state.activeView = view;
  saveState();
  render();
}

function currentTeam() {
  return state.teams.find((item) => item.id === state.activeTeamId) || state.teams[0];
}

function teamName(teamId = state.activeTeamId) {
  return state.teams.find((item) => item.id === teamId)?.name || TEAM_NAME;
}

function playerTeamName(item) {
  if (item?.teamName && item.teamName !== TEAM_NAME) return item.teamName;

  const linkedTeam = state.teams.find((team) => team.id === item?.teamId);
  if (linkedTeam && linkedTeam.id !== DEFAULT_TEAM_ID) return linkedTeam.name;

  const matchingPlayer = state.players.find(
    (candidate) =>
      candidate.id !== item?.id &&
      candidate.name === item?.name &&
      candidate.birthdate === item?.birthdate &&
      (candidate.teamName || (candidate.teamId && candidate.teamId !== DEFAULT_TEAM_ID))
  );
  if (matchingPlayer?.teamName) return matchingPlayer.teamName;

  const matchingTeam = state.teams.find((team) => team.id === matchingPlayer?.teamId);
  return matchingTeam?.name || currentTeam()?.name || linkedTeam?.name || TEAM_NAME;
}

function activePlayers() {
  return state.players.filter((item) => (item.teamId || DEFAULT_TEAM_ID) === state.activeTeamId);
}

function activeMatches() {
  return state.matches.filter((item) => (item.teamId || DEFAULT_TEAM_ID) === state.activeTeamId);
}

function uniqueTeamId(name) {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "equipo";
  let id = base;
  let suffix = 2;
  while (state.teams.some((item) => item.id === id)) id = `${base}-${suffix++}`;
  return id;
}

function openTeamDialog(teamId = "") {
  const item = state.teams.find((team) => team.id === teamId);
  document.querySelector("#team-modal-title").textContent = item ? "Editar equipo" : "Nuevo equipo";
  document.querySelector("#team-id").value = item?.id || "";
  document.querySelector("#team-name").value = item?.name || "";
  document.querySelector("#save-team-button").textContent = item ? "Guardar cambios" : "Crear equipo";
  deleteTeamButton.style.display = item ? "inline-flex" : "none";
  teamDialog.showModal();
}

function renameTeam(teamId, name) {
  const item = state.teams.find((team) => team.id === teamId);
  if (!item || item.name === name) return;
  const previousName = item.name;
  item.name = name;
  state.players
    .filter((playerItem) => playerItem.teamId === teamId)
    .forEach((playerItem) => {
      playerItem.teamName = name;
    });
  state.matches
    .filter((matchItem) => matchItem.teamId === teamId)
    .forEach((matchItem) => {
      matchItem.teamName = name;
      if (matchItem.home === previousName) matchItem.home = name;
      if (matchItem.away === previousName) matchItem.away = name;
    });
}

async function deleteTeam(teamId) {
  const item = state.teams.find((team) => team.id === teamId);
  if (!item) return;
  if (state.teams.length === 1) {
    alert("Debe existir al menos un equipo.");
    return;
  }
  const players = state.players.filter((playerItem) => playerItem.teamId === teamId);
  const matches = state.matches.filter((matchItem) => matchItem.teamId === teamId);
  const message = `¿Eliminar ${item.name}? También se eliminarán ${players.length} jugadores y ${matches.length} partidos de este equipo.`;
  if (!confirm(message)) return;

  state.players = state.players.filter((playerItem) => playerItem.teamId !== teamId);
  state.matches = state.matches.filter((matchItem) => matchItem.teamId !== teamId);
  state.teams = state.teams.filter((team) => team.id !== teamId);
  state.activeTeamId = state.teams[0].id;
  state.selectedPlayerId = activePlayers()[0]?.id || "";
  state.selectedMatchId = activeMatches()[0]?.id || "";
  saveState();
  teamDialog.close();
  render();

  await Promise.allSettled([
    ...players.map((playerItem) => supabaseDelete("players", "id", playerItem.id)),
    ...matches.map((matchItem) => supabaseDelete("matches", "id", matchItem.id))
  ]);
}

function syncTeamsFromData() {
  const known = new Map(state.teams.map((item) => [item.id, item]));
  [...state.players, ...state.matches].forEach((item) => {
    const id = item.teamId || DEFAULT_TEAM_ID;
    if (REMOVED_TEAM_IDS.has(id)) return;
    if (!known.has(id)) {
      const team = { id, name: item.teamName || (id === DEFAULT_TEAM_ID ? TEAM_NAME : id) };
      state.teams.push(team);
      known.set(id, team);
    }
  });
  if (!state.teams.some((item) => item.id === state.activeTeamId)) {
    state.activeTeamId = state.teams[0]?.id || DEFAULT_TEAM_ID;
  }
}

function render() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === normalizedMainView());
  });

  Object.values(views).forEach((view) => view.classList.remove("active"));
  if (state.activeView === "detail") views.detail.classList.add("active");
  else if (state.activeView === "playerDetail") views.playerDetail.classList.add("active");
  else views[state.activeView].classList.add("active");

  contextActionButton.textContent = state.activeView === "matches" ? "Añadir partido" : "Añadir jugador";
  contextActionButton.style.display = ["detail", "playerDetail", "standings", "statistics"].includes(state.activeView) ? "none" : "inline-flex";
  pageTitle.textContent = pageTitleForView(state.activeView);

  renderSquad();
  renderMatches();
  renderStandings();
  renderStatistics();
  renderPlayerDetail();
  renderMatchDetail();
}

function normalizedMainView() {
  if (state.activeView === "detail") return "matches";
  if (state.activeView === "playerDetail") return "squad";
  return state.activeView;
}

function pageTitleForView(view) {
  const titles = {
    squad: "Equipos",
    matches: "Partidos",
    standings: "Clasificación",
    statistics: "Estadísticas",
    playerDetail: "Ficha del jugador",
    detail: "Detalle de partido"
  };
  return titles[view] || "Equipos";
}

function renderSquad() {
  const players = activePlayers();
  views.squad.innerHTML = `
    <div class="team-switcher panel">
      <label>
        Equipo
        <select id="team-selector">
          ${state.teams
            .map((item) => `<option value="${item.id}" ${item.id === state.activeTeamId ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
            .join("")}
        </select>
      </label>
      <div class="team-switcher-summary">
        <strong>${escapeHtml(currentTeam().name)}</strong>
        <span class="meta">${players.length} jugadores · ${activeMatches().length} partidos</span>
      </div>
      <div class="team-switcher-actions">
        <button class="secondary-button" id="edit-team-button" type="button">Editar equipo</button>
        <button class="primary-button" id="add-team-button" type="button">Añadir equipo</button>
      </div>
    </div>
    <div class="squad-grid">
      ${players
        .slice()
        .sort((a, b) => a.number - b.number)
        .map(renderPlayerCard)
        .join("")}
    </div>
    ${players.length ? "" : `<div class="empty-state">Este equipo aún no tiene jugadores. Usa “Añadir jugador” para crear su plantilla.</div>`}
  `;

  views.squad.querySelector("#team-selector").addEventListener("change", (event) => {
    state.activeTeamId = event.target.value;
    state.selectedPlayerId = activePlayers()[0]?.id || "";
    state.selectedMatchId = activeMatches()[0]?.id || "";
    saveState();
    render();
  });
  views.squad.querySelector("#edit-team-button").addEventListener("click", () => openTeamDialog(state.activeTeamId));
  views.squad.querySelector("#add-team-button").addEventListener("click", () => openTeamDialog());
  views.squad.querySelectorAll("[data-edit-player]").forEach((button) => {
    button.addEventListener("click", () => openPlayerDialog(button.dataset.editPlayer));
  });
  views.squad.querySelectorAll("[data-open-player]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPlayerId = button.dataset.openPlayer;
      state.activePlayerTab = "statistics";
      setView("playerDetail");
    });
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
        <button class="primary-button" data-open-player="${item.id}" type="button">Ver ficha</button>
        <button class="secondary-button" data-edit-player="${item.id}" type="button">Editar</button>
      </div>
    </article>
  `;
}

function renderPlayerDetail() {
  const item = activePlayers().find((playerItem) => playerItem.id === state.selectedPlayerId) || activePlayers()[0];
  if (!item) {
    views.playerDetail.innerHTML = `<div class="empty-state">Todavía no hay jugadores en la plantilla.</div>`;
    return;
  }
  state.selectedPlayerId = item.id;
  const photoStyle = item.photo ? `style="background-image:url('${escapeAttr(item.photo)}')"` : "";

  views.playerDetail.innerHTML = `
    <div class="player-profile-header">
      <button class="secondary-button" id="back-to-squad" type="button">Volver a equipos</button>
      <div class="row-actions">
        <button class="primary-button" id="download-player-pdf" type="button">Descargar PDF</button>
        <button class="secondary-button" data-edit-player="${item.id}" type="button">Editar jugador</button>
      </div>
    </div>
    <section class="player-profile-card player-profile-hero">
      <div class="player-number-watermark">${item.number}</div>
      <div class="player-profile-photo" ${photoStyle}>${item.photo ? "" : initials(item.name)}</div>
      <div class="player-profile-main">
        <div class="player-profile-title">
          <div>
            <p class="player-position-label">${escapeHtml(item.position)}</p>
            <h2>${escapeHtml(item.name)}</h2>
            <p class="player-full-name">Dorsal ${item.number} · ${escapeHtml(item.laterality || "Diestro")}</p>
          </div>
        </div>
        <div class="player-info-grid">
          ${renderPlayerInfo("Nombre completo", item.name)}
          ${renderPlayerInfo("Fecha de nacimiento", formatDate(item.birthdate))}
          ${renderPlayerInfo("Edad", `${calculateAge(item.birthdate)} años`)}
          ${renderPlayerInfo("Lateralidad", item.laterality || "Diestro")}
          ${renderPlayerInfo("Posición", item.position)}
          ${renderPlayerInfo("Partidos registrados", activeMatches().length)}
        </div>
        <label class="profile-description">
          Descripción del jugador
          <textarea id="player-description" maxlength="2000" placeholder="Describe sus características técnicas, físicas, tácticas y personales...">${escapeHtml(item.description || "")}</textarea>
        </label>
        <section class="player-ratings-section">
          <div class="ratings-heading">
            <div>
              <h3>Valoración del jugador</h3>
              <p class="meta">Escala de 0 a 10. El valor 0 indica que aún no está valorado.</p>
            </div>
          </div>
          <div class="player-ratings-grid">
            ${Object.entries(playerRatingLabels())
              .map(([key, label]) => renderPlayerRating(key, label, item.ratings?.[key] || 0))
              .join("")}
          </div>
        </section>
      </div>
    </section>
    <div class="detail-tabs player-detail-tabs">
      <button class="detail-tab ${state.activePlayerTab === "statistics" ? "active" : ""}" data-player-tab="statistics" type="button">Estadísticas</button>
      <button class="detail-tab ${state.activePlayerTab === "career" ? "active" : ""}" data-player-tab="career" type="button">Trayectoria</button>
      <button class="detail-tab ${state.activePlayerTab === "reports" ? "active" : ""}" data-player-tab="reports" type="button">Informes de cada partido</button>
    </div>
    <div id="player-tab-body"></div>
  `;

  views.playerDetail.querySelector("#back-to-squad").addEventListener("click", () => setView("squad"));
  views.playerDetail.querySelector("#download-player-pdf").addEventListener("click", () => downloadPlayerPdf(item));
  views.playerDetail.querySelector("[data-edit-player]").addEventListener("click", () => openPlayerDialog(item.id));
  views.playerDetail.querySelector("#player-description").addEventListener("input", (event) => {
    item.description = event.target.value;
    saveState();
  });
  views.playerDetail.querySelectorAll("[data-player-rating]").forEach((input) => {
    input.addEventListener("input", () => {
      item.ratings = normalizePlayerRatings(item.ratings);
      item.ratings[input.dataset.playerRating] = Number(input.value);
      const output = views.playerDetail.querySelector(`[data-rating-output="${input.dataset.playerRating}"]`);
      output.textContent = formatRating(input.value);
      saveState();
    });
  });
  views.playerDetail.querySelectorAll("[data-player-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePlayerTab = button.dataset.playerTab;
      saveState();
      render();
    });
  });

  const body = views.playerDetail.querySelector("#player-tab-body");
  if (state.activePlayerTab === "career") renderPlayerCareer(item, body);
  else if (state.activePlayerTab === "reports") renderPlayerReports(item, body);
  else renderPlayerStatistics(item, body);
}

function renderPlayerStatistics(item, body) {
  const appearances = activeMatches().filter((matchItem) => matchItem.lineup?.[item.id]);
  const playedAppearances = appearances.filter((matchItem) => Boolean(parseScore(matchItem.score)));
  const starts = activeMatches().filter((matchItem) => {
    const sheets = normalizeLineupSheets(matchItem.lineupSheets, matchItem);
    return sheets[ownTeamSide(matchItem)].some(
      (row) => row.playerId === item.id && row.role === "starter"
    );
  }).length;
  const totals = playerReportTotals(item);
  const latestAppearance = appearances
    .slice()
    .sort((a, b) => b.round - a.round)[0];

  body.innerHTML = `
    <section class="player-tab-page player-statistics-page">
      <div class="player-statistics-toolbar">
        <div>
          <h2>Estadísticas del jugador</h2>
          <p class="meta">Totales acumulados desde sus informes de partido.</p>
        </div>
        <div class="statistics-filters">
          <span class="filter-chip">Temporada 2026</span>
          <span class="filter-chip">Todas las competiciones</span>
        </div>
      </div>
      <div class="player-stat-cards">
        ${renderFeaturedPlayerStat(playedAppearances.length, totals.minutes, starts)}
        ${renderPlayerStatCard("Goles marcados", totals.goals, "GO")}
        ${renderPlayerStatCard("Asistencias de gol", totals.assists, "AS")}
        ${renderPlayerStatCard("Tiros a puerta", totals.shotsOnTarget, "TP")}
        ${renderPlayerStatCard("Pases", totals.completedPasses + totals.failedPasses, "PA", [
          `${totals.completedPasses} correctos`,
          `${totals.failedPasses} fallados`
        ])}
        ${renderPlayerStatCard("Pases de gol", totals.goalPasses, "PG")}
        ${renderPlayerStatCard("Recuperaciones", totals.recoveries, "RE", [
          `${totals.losses} pérdidas`
        ])}
        ${renderPlayerStatCard("Tarjetas", totals.yellowCards + totals.redCards, "TA", [
          `${totals.yellowCards} amarillas`,
          `${totals.redCards} rojas`
        ])}
      </div>
      <div class="player-stat-summary">
        <div>
          <span>Última aparición</span>
          <strong>${latestAppearance ? `Jornada ${latestAppearance.round}` : "Sin apariciones"}</strong>
        </div>
        <div>
          <span>Posición principal</span>
          <strong>${escapeHtml(item.position)}</strong>
        </div>
        <div>
          <span>Lateralidad</span>
          <strong>${escapeHtml(item.laterality || "Diestro")}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderFeaturedPlayerStat(matches, minutes, starts) {
  return `
    <article class="player-stat-card featured">
      <div class="player-stat-card-title"><span>PO</span> Partidos oficiales</div>
      <div class="featured-stat-content">
        <strong>${matches}</strong>
        <div>
          <span>${minutes.toLocaleString("es-ES")} min. jugados</span>
          <span>${starts} titularidades</span>
        </div>
      </div>
    </article>
  `;
}

function renderPlayerStatCard(title, value, icon, details = []) {
  return `
    <article class="player-stat-card">
      <div class="player-stat-card-title"><span>${icon}</span> ${escapeHtml(title)}</div>
      <strong>${value.toLocaleString("es-ES")}</strong>
      ${
        details.length
          ? `<div class="player-stat-card-details">${details.map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}</div>`
          : ""
      }
    </article>
  `;
}

function renderPlayerCareer(item, body) {
  body.innerHTML = `
    <section class="panel player-tab-page">
      <div class="section-intro">
        <div>
          <h2>Trayectoria</h2>
          <p class="meta">Clubes, temporadas, categorías y evolución deportiva.</p>
        </div>
      </div>
      <div class="current-club-card">
        <div class="crest small-crest">AC</div>
        <div>
          <strong>${escapeHtml(currentTeam().name)}</strong>
          <div class="meta">Temporada 2026 · ${escapeHtml(item.position)}</div>
        </div>
      </div>
      <label class="career-editor">
        Historial del jugador
        <textarea id="player-career" maxlength="5000" placeholder="Ejemplo: 2024-2026 Athletic Club · Primer equipo&#10;2022-2024 Bilbao Athletic...">${escapeHtml(item.career || "")}</textarea>
      </label>
    </section>
  `;

  body.querySelector("#player-career").addEventListener("input", (event) => {
    item.career = event.target.value;
    saveState();
  });
}

function renderPlayerReports(item, body) {
  const matches = activeMatches().slice().sort((a, b) => a.round - b.round);
  body.innerHTML = `
    <section class="panel player-tab-page">
      <div class="section-intro">
        <div>
          <h2>Informes de cada partido</h2>
          <p class="meta">Valoración técnica individual para cada jornada.</p>
        </div>
      </div>
      <div class="player-reports-list">
        ${
          matches.length
            ? matches
                .map((matchItem) => {
                  const inLineup = Boolean(matchItem.lineup?.[item.id]);
                  const report = playerReport(item, matchItem.id);
                  const videoEmbedUrl = youtubeEmbedUrl(report.youtube);
                  return `
                    <article class="player-report-card">
                      <div class="player-report-heading">
                        <div>
                          <span class="tag">Jornada ${matchItem.round}</span>
                          <h3>${escapeHtml(matchItem.home)} vs ${escapeHtml(matchItem.away)}</h3>
                          <p class="meta">${matchItem.date ? formatDate(matchItem.date) : "Fecha pendiente"} · ${escapeHtml(matchItem.score || "Sin resultado")}</p>
                        </div>
                        <div class="player-report-heading-actions">
                          <label class="match-rating-control">
                            Valoración
                            <span>
                              <input data-player-report-rating="${matchItem.id}" type="number" min="1" max="10" step="0.5" value="${report.rating || ""}" placeholder="-" />
                              <small>/ 10</small>
                            </span>
                          </label>
                          <span class="report-status ${inLineup ? "included" : ""}">${inLineup ? "En alineación" : "No alineado"}</span>
                        </div>
                      </div>
                      <label>
                        Informe individual
                        <textarea data-player-report-text="${matchItem.id}" maxlength="3000" placeholder="Rendimiento, aspectos destacados y puntos de mejora...">${escapeHtml(report.text)}</textarea>
                      </label>
                      <div class="report-data-grid">
                        ${renderReportStatInput(matchItem.id, "completedPasses", "Pases correctos", report.completedPasses)}
                        ${renderReportStatInput(matchItem.id, "failedPasses", "Pases fallados", report.failedPasses)}
                        ${renderReportStatInput(matchItem.id, "losses", "Pérdidas", report.losses)}
                        ${renderReportStatInput(matchItem.id, "recoveries", "Recuperaciones", report.recoveries)}
                        ${renderReportStatInput(matchItem.id, "minutes", "Minutos jugados", report.minutes, 130)}
                        ${renderReportStatInput(matchItem.id, "goals", "Goles", report.goals)}
                        ${renderReportStatInput(matchItem.id, "assists", "Asistencias de gol", report.assists)}
                        ${renderReportStatInput(matchItem.id, "shotsOnTarget", "Tiros a puerta", report.shotsOnTarget)}
                        ${renderReportStatInput(matchItem.id, "goalPasses", "Pases de gol", report.goalPasses)}
                        ${renderReportStatInput(matchItem.id, "yellowCards", "Tarjetas amarillas", report.yellowCards, 2)}
                        ${renderReportStatInput(matchItem.id, "redCards", "Tarjetas rojas", report.redCards, 1)}
                        <label>
                          Vídeo de YouTube
                          <input data-player-report-youtube="${matchItem.id}" type="url" value="${escapeAttr(report.youtube)}" placeholder="https://www.youtube.com/watch?v=..." />
                        </label>
                      </div>
                      ${
                        videoEmbedUrl
                          ? `<div class="youtube-video">
                              <iframe src="${escapeAttr(videoEmbedUrl)}" title="Vídeo del informe de ${escapeAttr(item.name)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>`
                          : report.youtube
                            ? `<p class="video-url-error">El enlace no parece ser un vídeo válido de YouTube.</p>`
                            : ""
                      }
                      <div class="report-save-row">
                        <span class="report-save-status" data-report-save-status="${matchItem.id}">Cambios guardados automáticamente</span>
                        ${
                          playerReportHasData(report)
                            ? `<button class="danger-button" data-delete-player-report="${matchItem.id}" type="button">Eliminar informe</button>`
                            : ""
                        }
                        <button class="primary-button" data-save-player-report="${matchItem.id}" type="button">Guardar informe</button>
                      </div>
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty-state">
                <p>Este equipo todavía no tiene partidos. Crea el primero para rellenar el informe y las estadísticas de ${escapeHtml(item.name)}.</p>
                <button class="primary-button" id="create-match-from-player-report" type="button">Crear primer partido</button>
              </div>`
        }
      </div>
    </section>
  `;

  body.querySelector("#create-match-from-player-report")?.addEventListener("click", () => {
    openMatchDialog("", true);
  });
  body.querySelectorAll("[data-player-report-text]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const report = ensurePlayerReport(item, textarea.dataset.playerReportText);
      report.text = textarea.value;
      saveState();
      markPlayerReportPending(body, textarea.dataset.playerReportText);
    });
  });
  body.querySelectorAll("[data-player-report-stat]").forEach((input) => {
    input.addEventListener("input", () => {
      const report = ensurePlayerReport(item, input.dataset.playerReportStat);
      const key = input.dataset.reportStat;
      const maximum = key === "minutes" ? 130 : key === "yellowCards" ? 2 : key === "redCards" ? 1 : 9999;
      report[key] = clamp(Math.round(Number(input.value) || 0), 0, maximum);
      saveState();
      markPlayerReportPending(body, input.dataset.playerReportStat);
    });
  });
  body.querySelectorAll("[data-player-report-rating]").forEach((input) => {
    input.addEventListener("input", () => {
      const report = ensurePlayerReport(item, input.dataset.playerReportRating);
      report.rating = input.value === "" ? 0 : clamp(Number(input.value) || 0, 1, 10);
      saveState();
      markPlayerReportPending(body, input.dataset.playerReportRating);
    });
  });
  body.querySelectorAll("[data-player-report-youtube]").forEach((input) => {
    input.addEventListener("input", () => {
      const report = ensurePlayerReport(item, input.dataset.playerReportYoutube);
      report.youtube = input.value.trim();
      saveState();
      markPlayerReportPending(body, input.dataset.playerReportYoutube);
    });
    input.addEventListener("change", render);
  });
  body.querySelectorAll("[data-save-player-report]").forEach((button) => {
    button.addEventListener("click", async () => {
      const matchId = button.dataset.savePlayerReport;
      const status = body.querySelector(`[data-report-save-status="${matchId}"]`);
      button.disabled = true;
      button.textContent = "Guardando...";
      status.textContent = "Guardando informe...";
      status.classList.remove("pending", "saved", "error");
      saveState();
      clearTimeout(remoteSaveTimer);
      try {
        await pushRemoteState(true);
        status.textContent = "Informe guardado";
        status.classList.add("saved");
      } catch (error) {
        console.error(error);
        status.textContent = "Guardado en este dispositivo; pendiente de sincronizar";
        status.classList.add("error");
      } finally {
        button.disabled = false;
        button.textContent = "Guardar informe";
      }
    });
  });
  body.querySelectorAll("[data-delete-player-report]").forEach((button) => {
    button.addEventListener("click", async () => {
      const matchId = button.dataset.deletePlayerReport;
      const matchItem = matches.find((candidate) => candidate.id === matchId);
      const matchLabel = matchItem
        ? `Jornada ${matchItem.round}: ${matchItem.home} vs ${matchItem.away}`
        : "este partido";
      if (!confirm(`¿Eliminar el informe de ${item.name} para ${matchLabel}? Se borrarán también sus estadísticas, valoración y vídeo.`)) {
        return;
      }

      item.reports = normalizePlayerReports(item.reports);
      delete item.reports[matchId];
      saveState();
      clearTimeout(remoteSaveTimer);
      try {
        await pushRemoteState(true);
      } catch (error) {
        console.error(error);
        alert("El informe se ha eliminado en este dispositivo, pero queda pendiente de sincronizar.");
      }
      render();
    });
  });
}

function markPlayerReportPending(body, matchId) {
  const status = body.querySelector(`[data-report-save-status="${matchId}"]`);
  if (!status) return;
  status.textContent = "Cambios pendientes de confirmar";
  status.classList.remove("saved", "error");
  status.classList.add("pending");
}

function renderReportStatInput(matchId, key, label, value, max = 9999) {
  const displayValue = ["yellowCards", "redCards"].includes(key) ? value : value || "";
  return `
    <label>
      ${escapeHtml(label)}
      <input
        data-player-report-stat="${matchId}"
        data-report-stat="${key}"
        type="number"
        min="0"
        max="${max}"
        value="${displayValue}"
        placeholder="0"
      />
    </label>
  `;
}

function renderPlayerInfo(label, value) {
  return `
    <div class="player-info-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderPlayerRating(key, label, value) {
  return `
    <label class="player-rating-item">
      <span>${escapeHtml(label)}</span>
      <div class="rating-control">
        <input data-player-rating="${key}" type="range" min="0" max="10" step="0.5" value="${value}" />
        <output data-rating-output="${key}">${formatRating(value)}</output>
      </div>
    </label>
  `;
}

function renderMatches() {
  const matches = activeMatches();
  views.matches.innerHTML = `
    <div class="active-team-context">
      <span class="eyebrow">Equipo seleccionado</span>
      <strong>${escapeHtml(currentTeam().name)}</strong>
    </div>
    <div class="match-grid">
      ${matches
        .slice()
        .sort((a, b) => a.round - b.round)
        .map(renderMatchCard)
        .join("")}
    </div>
    ${matches.length ? "" : `<div class="empty-state">Este equipo todavía no tiene partidos.</div>`}
  `;

  views.matches.querySelectorAll("[data-open-match]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMatchId = button.dataset.openMatch;
      state.activeDetailTab = "plan";
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
  const item = activeMatches().find((matchItem) => matchItem.id === state.selectedMatchId) || activeMatches()[0];
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
      <button class="detail-tab ${state.activeDetailTab === "plan" ? "active" : ""}" data-detail-tab="plan" type="button">Plan de partido</button>
      <button class="detail-tab ${state.activeDetailTab === "lineup" ? "active" : ""}" data-detail-tab="lineup" type="button">Alineación</button>
      <button class="detail-tab ${state.activeDetailTab === "information" ? "active" : ""}" data-detail-tab="information" type="button">Información del partido</button>
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
  else if (state.activeDetailTab === "information") renderMatchInformation(item, body);
  else renderLineupEditor(item, body);
}

function renderStandings() {
  const table = FINAL_STANDINGS;

  views.standings.innerHTML = `
    <div class="section-intro">
      <div>
        <h2>Clasificación final · Cadete Preferente</h2>
        <p class="meta">Clasificación definitiva de la categoría Cadete Preferente.</p>
      </div>
      <span class="tag">14 jornadas</span>
    </div>
    ${
      table.length
        ? `<div class="table-panel">
            <div class="data-table-scroll">
              <table class="data-table standings-table">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${table
                    .map(
                      (team, index) => `
                        <tr class="${team.name === currentTeam().name ? "highlight-row" : ""}">
                          <td><strong>${index + 1}</strong></td>
                          <td class="team-cell">${escapeHtml(team.name)}</td>
                          <td>${team.played}</td>
                          <td>${team.won}</td>
                          <td>${team.drawn}</td>
                          <td>${team.lost}</td>
                          <td><strong>${team.points}</strong></td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>`
        : `<div class="empty-state">No hay datos disponibles para la clasificación.</div>`
    }
  `;
}

function renderStatistics() {
  const matches = parsedMatches();
  const teamStats = calculateTeamStats(matches);
  const extraStats = calculateTeamMatchStats();
  const playerRows = buildPlayerStatistics();
  const rankingCards = [
    { title: "Partidos", key: "played", suffix: "" },
    { title: "Minutos", key: "minutes", suffix: "" },
    { title: "Goles", key: "goals", suffix: "" },
    { title: "Asistencias de gol", key: "assists", suffix: "" },
    { title: "Tiros a puerta", key: "shotsOnTarget", suffix: "" },
    { title: "Recuperaciones", key: "recoveries", suffix: "" }
  ];

  views.statistics.innerHTML = `
    <div class="club-statistics-page">
      <div class="statistics-filters">
        <span class="filter-chip">Temporada 2026</span>
        <span class="filter-chip">Todos los partidos</span>
      </div>
      <section class="team-summary-strip">
        ${renderTeamSummary("Partidos", "▣", teamStats.played, [
          [teamStats.won, "ganados"],
          [teamStats.drawn, "empatados"],
          [teamStats.lost, "perdidos"]
        ], true)}
        ${renderTeamSummary("Goles", "⚽", teamStats.goalsFor, [
          [teamStats.goalsFor, "marcados"],
          [teamStats.goalsAgainst, "encajados"]
        ])}
        ${renderTeamSummary("Tarjetas", "▱", 0, [
          [extraStats.yellowCards, "amarillas", "yellow"],
          [extraStats.redCards, "rojas", "red"]
        ])}
        ${renderTeamSummary("Penaltis", "◎", 0, [
          [extraStats.penaltiesFor, "a favor"],
          [extraStats.penaltiesAgainst, "en contra"]
        ])}
        ${renderTeamSummary("Ocasiones de gol", "⌁", 0, [
          [extraStats.chancesCreated, "generadas"],
          [extraStats.chancesAgainst, "recibidas"]
        ])}
      </section>

      <section class="rankings-section">
        <div class="statistics-title-row">
          <div>
            <p class="eyebrow">Rendimiento individual</p>
            <h2>Rankings</h2>
          </div>
          <span class="meta">Datos de alineaciones e informes registrados</span>
        </div>
        <div class="ranking-cards">
          ${rankingCards.map((ranking) => renderRankingCard(ranking, playerRows)).join("")}
        </div>
      </section>

      <section class="players-statistics-section">
        <div class="statistics-title-row">
          <div>
            <p class="eyebrow">${escapeHtml(currentTeam().name)} · 2026</p>
            <h2>Estadísticas jugadores</h2>
          </div>
          <span class="meta">Totales acumulados desde los informes de partido</span>
        </div>
        <div class="table-panel">
          <div class="data-table-scroll">
            <table class="data-table player-statistics-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Titularidades</th>
                  <th>Jugados</th>
                  <th>Minutos</th>
                  <th>Goles</th>
                  <th>Asistencias de gol</th>
                  <th>Tiros a puerta</th>
                  <th>Pases de gol</th>
                  <th>Pases correctos</th>
                  <th>Pases fallados</th>
                  <th>Pérdidas</th>
                  <th>Recuperaciones</th>
                  <th>Amarillas</th>
                  <th>Rojas</th>
                </tr>
              </thead>
              <tbody>
                ${playerRows.map(renderPlayerStatisticsRow).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderTeamSummary(label, icon, value, details, featured = false) {
  return `
    <article class="team-summary-card ${featured ? "featured" : ""}">
      <div class="team-summary-title">
        <span class="team-summary-icon" aria-hidden="true">${icon}</span>
        <span>${escapeHtml(label)}</span>
      </div>
      <div class="team-summary-content">
        ${featured ? `<strong class="team-summary-total">${value}</strong>` : ""}
        <div class="team-summary-details">
          ${details
            .map(
              ([number, text, badge]) => `
                <div>
                  <strong>${number}</strong>
                  <span>${escapeHtml(text)}</span>
                  ${badge ? `<i class="stat-color-badge ${badge}" aria-hidden="true"></i>` : ""}
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function renderRankingCard(ranking, playerRows) {
  const rows = playerRows
    .slice()
    .sort((a, b) => b[ranking.key] - a[ranking.key] || a.number - b.number)
    .slice(0, 5);
  const leader = rows[0];
  const photoStyle = leader?.photo ? `style="background-image:url('${escapeAttr(leader.photo)}')"` : "";

  return `
    <article class="ranking-card">
      <div class="ranking-hero">
        <span class="ranking-title">${escapeHtml(ranking.title)}</span>
        <div class="ranking-watermark">AC</div>
        ${
          leader
            ? `<div class="ranking-leader">
                <div class="ranking-player-photo" ${photoStyle}>${leader.photo ? "" : initials(leader.name)}</div>
                <div>
                  <strong>${escapeHtml(shortName(leader.name))}</strong>
                  <span>${leader[ranking.key]}${ranking.suffix}</span>
                </div>
              </div>`
            : ""
        }
      </div>
      <ol class="ranking-list">
        ${rows
          .map(
            (playerItem) => `
              <li>
                <span>${escapeHtml(playerItem.name)}</span>
                <strong>${playerItem[ranking.key]}${ranking.suffix}</strong>
              </li>
            `
          )
          .join("")}
      </ol>
    </article>
  `;
}

function renderPlayerStatisticsRow(item) {
  const photoStyle = item.photo ? `style="background-image:url('${escapeAttr(item.photo)}')"` : "";
  return `
    <tr>
      <td class="statistics-player-cell">
        <div class="statistics-player-photo" ${photoStyle}>${item.photo ? "" : initials(item.name)}</div>
        <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.position)}</span></div>
      </td>
      <td>${item.starts}</td>
      <td>${item.played}</td>
      <td>${item.minutes}</td>
      <td>${item.goals}</td>
      <td>${item.assists}</td>
      <td>${item.shotsOnTarget}</td>
      <td>${item.goalPasses}</td>
      <td>${item.completedPasses}</td>
      <td>${item.failedPasses}</td>
      <td>${item.losses}</td>
      <td>${item.recoveries}</td>
      <td>${item.yellowCards}</td>
      <td>${item.redCards}</td>
    </tr>
  `;
}

function normalizeLineupSheets(value, matchItem) {
  const normalizeRows = (rows) =>
    (Array.isArray(rows) ? rows : []).map((row) => ({
      playerId: row?.playerId || "",
      name: row?.name || "",
      role: row?.role === "substitute" ? "substitute" : "starter",
      changeMinute: row?.changeMinute === "" || row?.changeMinute == null
        ? ""
        : clamp(nonNegativeInteger(row.changeMinute), 0, 130)
    }));
  if (value?.home || value?.away) {
    return {
      home: normalizeRows(value.home),
      away: normalizeRows(value.away)
    };
  }

  const ownRows = Object.keys(matchItem?.lineup || {})
    .filter((playerId) => !playerId.startsWith("__"))
    .map((playerId) => ({ playerId, name: "", role: "starter", changeMinute: "" }));
  return ownTeamSide(matchItem) === "away"
    ? { home: [], away: ownRows }
    : { home: ownRows, away: [] };
}

function ownTeamSide(item) {
  const selectedTeamName = teamName(item?.teamId);
  return item?.away === selectedTeamName ? "away" : "home";
}

function renderLineupEditor(item, body) {
  item.lineupSheets = normalizeLineupSheets(item.lineupSheets, item);
  body.innerHTML = `
    <div class="lineup-editor-grid">
      ${renderTeamLineupSheet(item, "home", item.home)}
      ${renderTeamLineupSheet(item, "away", item.away)}
    </div>
  `;

  body.querySelectorAll("[data-add-lineup-row]").forEach((button) => {
    button.addEventListener("click", () => {
      const side = button.dataset.addLineupRow;
      const rows = item.lineupSheets[side];
      const ownSide = ownTeamSide(item);
      if (side === ownSide) {
        const used = new Set(rows.map((row) => row.playerId));
        const available = activePlayers().find((playerItem) => !used.has(playerItem.id));
        if (!available) return alert("No quedan jugadores disponibles para añadir.");
        rows.push({
          playerId: available.id,
          name: "",
          role: rows.filter((row) => row.role === "starter").length < 11 ? "starter" : "substitute",
          changeMinute: ""
        });
      } else {
        rows.push({
          playerId: "",
          name: "",
          role: rows.filter((row) => row.role === "starter").length < 11 ? "starter" : "substitute",
          changeMinute: ""
        });
      }
      syncLegacyLineup(item);
      saveState();
      render();
    });
  });

  body.querySelectorAll("[data-lineup-player]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = item.lineupSheets[input.dataset.lineupSide][Number(input.dataset.lineupPlayer)];
      if (input.tagName === "SELECT") row.playerId = input.value;
      else row.name = input.value.trim();
      syncLegacyLineup(item);
      saveState();
    });
  });

  body.querySelectorAll("[data-lineup-role]").forEach((select) => {
    select.addEventListener("change", () => {
      const side = select.dataset.lineupSide;
      const rowIndex = Number(select.dataset.lineupRole);
      const rows = item.lineupSheets[side];
      if (select.value === "starter" && rows.filter((row, index) => index !== rowIndex && row.role === "starter").length >= 11) {
        select.value = "substitute";
        alert("Solo puede haber 11 titulares por equipo.");
      }
      rows[rowIndex].role = select.value;
      syncLegacyLineup(item);
      saveState();
      render();
    });
  });

  body.querySelectorAll("[data-lineup-minute]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = item.lineupSheets[input.dataset.lineupSide][Number(input.dataset.lineupMinute)];
      row.changeMinute = input.value === "" ? "" : clamp(nonNegativeInteger(input.value), 0, 130);
      saveState();
    });
  });

  body.querySelectorAll("[data-remove-lineup-row]").forEach((button) => {
    button.addEventListener("click", () => {
      item.lineupSheets[button.dataset.lineupSide].splice(Number(button.dataset.removeLineupRow), 1);
      syncLegacyLineup(item);
      saveState();
      render();
    });
  });
}

function renderTeamLineupSheet(item, side, name) {
  const rows = item.lineupSheets[side];
  const isOwnTeam = side === ownTeamSide(item);
  const starters = rows.filter((row) => row.role === "starter").length;
  return `
    <section class="panel lineup-sheet">
      <div class="lineup-sheet-heading">
        <div>
          <span class="eyebrow">${side === "home" ? "Equipo local" : "Equipo visitante"}</span>
          <h2>${escapeHtml(name)}</h2>
        </div>
        <span class="lineup-count ${starters === 11 ? "complete" : ""}">${starters}/11 titulares</span>
      </div>
      <div class="lineup-sheet-labels">
        <span>Jugador</span>
        <span>Condición</span>
        <span>Minuto cambio</span>
        <span></span>
      </div>
      <div class="lineup-sheet-rows">
        ${
          rows.length
            ? rows.map((row, index) => renderLineupSheetRow(row, index, side, isOwnTeam)).join("")
            : `<div class="empty-state">Todavía no hay jugadores añadidos.</div>`
        }
      </div>
      <button class="secondary-button" data-add-lineup-row="${side}" type="button">Añadir jugador</button>
    </section>
  `;
}

function renderLineupSheetRow(row, index, side, isOwnTeam) {
  const playerControl = isOwnTeam
    ? `<select data-lineup-player="${index}" data-lineup-side="${side}">
        ${activePlayers()
          .map((playerItem) => `<option value="${playerItem.id}" ${playerItem.id === row.playerId ? "selected" : ""}>${playerItem.number}. ${escapeHtml(playerItem.name)}</option>`)
          .join("")}
      </select>`
    : `<input data-lineup-player="${index}" data-lineup-side="${side}" value="${escapeAttr(row.name)}" maxlength="80" placeholder="Nombre del jugador" />`;
  return `
    <div class="lineup-sheet-row">
      ${playerControl}
      <select data-lineup-role="${index}" data-lineup-side="${side}">
        <option value="starter" ${row.role === "starter" ? "selected" : ""}>Titular</option>
        <option value="substitute" ${row.role === "substitute" ? "selected" : ""}>Suplente</option>
      </select>
      <input data-lineup-minute="${index}" data-lineup-side="${side}" type="number" min="0" max="130" value="${row.changeMinute}" placeholder="-" />
      <button class="icon-button" data-remove-lineup-row="${index}" data-lineup-side="${side}" type="button" aria-label="Quitar jugador">×</button>
    </div>
  `;
}

function syncLegacyLineup(item) {
  const ownRows = item.lineupSheets[ownTeamSide(item)] || [];
  const previous = item.lineup || {};
  item.lineup = {};
  ownRows.forEach((row, index) => {
    if (!row.playerId) return;
    item.lineup[row.playerId] = previous[row.playerId] || FORMATIONS[DEFAULT_FORMATION].slots[index % 11];
  });
}

function renderMatchInformation(item, body) {
  body.innerHTML = `
    <section class="panel match-information-panel">
      <div class="section-intro">
        <div>
          <p class="eyebrow">Apuntes del entrenador</p>
          <h2>Información del partido</h2>
        </div>
        <span class="meta">Los cambios se guardan automáticamente</span>
      </div>
      <label>
        Notas y observaciones
        <textarea id="match-notes" maxlength="12000" placeholder="Análisis del partido, incidencias, conclusiones y aspectos a mejorar...">${escapeHtml(item.notes || "")}</textarea>
      </label>
    </section>
  `;
  body.querySelector("#match-notes").addEventListener("input", (event) => {
    item.notes = event.target.value;
    saveState();
  });
}

function renderLineup(item, body) {
  const lineupIds = new Set(Object.keys(item.lineup || {}));
  const bench = activePlayers().filter((playerItem) => !lineupIds.has(playerItem.id));
  const selectedFormation = FORMATIONS[item.formation] ? item.formation : DEFAULT_FORMATION;

  body.innerHTML = `
    <div class="lineup-layout">
      <div class="panel">
        <div class="lineup-heading">
          <div>
            <h2>Campo</h2>
            <p class="meta">Elige un sistema y ajusta las posiciones arrastrando las fichas.</p>
          </div>
          <label class="formation-control">
            Sistema
            <select id="formation-selector">
              ${Object.entries(FORMATIONS)
                .map(([value, formation]) => `<option value="${value}" ${selectedFormation === value ? "selected" : ""}>${formation.label}</option>`)
                .join("")}
            </select>
          </label>
        </div>
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

  body.querySelector("#formation-selector").addEventListener("change", (event) => {
    applyFormation(item, event.target.value);
    saveState();
    render();
  });

  const pitch = body.querySelector("#pitch");
  pitch.addEventListener("dragover", (event) => event.preventDefault());
  pitch.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!draggedPlayerId) return;
    const rect = pitch.getBoundingClientRect();
    const displayX = clamp(((event.clientX - rect.left) / rect.width) * 100, 5, 95);
    const displayY = clamp(((event.clientY - rect.top) / rect.height) * 100, 7, 93);
    const x = displayY;
    const y = 100 - displayX;
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
  const item = activePlayers().find((playerItem) => playerItem.id === playerId);
  if (!item) return "";
  const displayX = 100 - position.y;
  const displayY = position.x;
  return `
    <div class="lineup-token" draggable="true" data-player-id="${item.id}" style="left:${displayX}%;top:${displayY}%">
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
  item.plan = normalizePlan(item.plan);
  body.innerHTML = `
    <div class="plan-grid">
      ${PLAN_SECTIONS.map(([type, title]) => renderPlanPanel(item, type, title)).join("")}
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

function renderPlanPanel(item, type, title) {
  const videos = item.plan[`${type}Videos`] || [];
  return `
    <section class="panel">
      <h2>${title}</h2>
      <label>
        Plan
        <textarea data-plan-type="${type}" placeholder="Escribe aquí las indicaciones de ${title.toLowerCase()}...">${escapeHtml(item.plan[`${type}Text`] || "")}</textarea>
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

function openMatchDialog(id, returnToPlayerReports = false) {
  returnToPlayerReportsAfterMatchSave = returnToPlayerReports;
  const item = state.matches.find((matchItem) => matchItem.id === id);
  document.querySelector("#match-modal-title").textContent = item ? "Editar partido" : "Nuevo partido";
  document.querySelector("#match-id").value = item?.id || "";
  document.querySelector("#match-round").value = item?.round || nextRound();
  document.querySelector("#match-date").value = item?.date || "";
  document.querySelector("#match-home").value = item?.home || currentTeam().name;
  document.querySelector("#match-away").value = item?.away || "";
  document.querySelector("#match-status").value = item?.status || "Preparación";
  document.querySelector("#match-score").value = item?.score || "";
  const teamStats = normalizeTeamMatchStats(item?.teamStats);
  document.querySelector("#match-yellow-cards").value = teamStats.yellowCards;
  document.querySelector("#match-red-cards").value = teamStats.redCards;
  document.querySelector("#match-penalties-for").value = teamStats.penaltiesFor;
  document.querySelector("#match-penalties-against").value = teamStats.penaltiesAgainst;
  document.querySelector("#match-chances-created").value = teamStats.chancesCreated;
  document.querySelector("#match-chances-against").value = teamStats.chancesAgainst;
  matchDialog.showModal();
}

function deletePlayer(id) {
  const item = state.players.find((playerItem) => playerItem.id === id);
  if (!item || !confirm(`¿Eliminar a ${item.name}?`)) return;
  state.players = state.players.filter((playerItem) => playerItem.id !== id);
  activeMatches().forEach((matchItem) => {
    delete matchItem.lineup[id];
    if (matchItem.lineupSheets) {
      const side = ownTeamSide(matchItem);
      matchItem.lineupSheets[side] = matchItem.lineupSheets[side].filter((row) => row.playerId !== id);
    }
  });
  saveState();
  supabaseDelete("players", "id", id);
  render();
}

function deleteMatch(id) {
  const item = state.matches.find((matchItem) => matchItem.id === id);
  if (!item || !confirm(`¿Eliminar la jornada ${item.round}?`)) return;
  state.matches = state.matches.filter((matchItem) => matchItem.id !== id);
  state.selectedMatchId = activeMatches()[0]?.id || "";
  saveState();
  supabaseDelete("matches", "id", id);
  render();
}

function selectedMatch() {
  const item = activeMatches().find((matchItem) => matchItem.id === state.selectedMatchId) || activeMatches()[0];
  if (item) state.selectedMatchId = item.id;
  return item;
}

function nextRound() {
  return Math.max(0, ...activeMatches().map((item) => item.round)) + 1;
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
  const slots = FORMATIONS[item.formation]?.slots || FORMATIONS[DEFAULT_FORMATION].slots;
  const used = Object.keys(item.lineup || {}).length;
  return slots[used % slots.length];
}

function formationSlots(lines, yPositions) {
  return lines.flatMap((count, lineIndex) => {
    if (count === 1) return [{ x: 50, y: yPositions[lineIndex] }];
    const sideMargin = count >= 5 ? 10 : count === 4 ? 14 : 22;
    const step = (100 - sideMargin * 2) / (count - 1);
    return Array.from({ length: count }, (_, index) => ({
      x: sideMargin + step * index,
      y: yPositions[lineIndex]
    }));
  });
}

function applyFormation(item, formationId) {
  const formation = FORMATIONS[formationId];
  if (!formation) return;

  const playerIds = Object.entries(item.lineup || {})
    .sort(([, first], [, second]) => second.y - first.y || first.x - second.x)
    .map(([playerId]) => playerId)
    .slice(0, formation.slots.length);

  item.formation = formationId;
  playerIds.forEach((playerId, index) => {
    item.lineup[playerId] = { ...formation.slots[index] };
  });
}

function playerRatingLabels() {
  return {
    technical: "Técnica",
    tactical: "Táctica",
    conditional: "Condicional",
    cognitive: "Cognitiva"
  };
}

function defaultPlayerRatings() {
  return Object.fromEntries(Object.keys(playerRatingLabels()).map((key) => [key, 0]));
}

function normalizePlayerRatings(ratings) {
  return Object.fromEntries(
    Object.keys(playerRatingLabels()).map((key) => [
      key,
      clamp(Number(ratings?.[key]) || 0, 0, 10)
    ])
  );
}

function formatRating(value) {
  const rating = Number(value) || 0;
  return rating ? `${rating.toLocaleString("es-ES")} / 10` : "Sin valorar";
}

function normalizePlayerReports(reports) {
  return Object.fromEntries(
    Object.entries(reports || {}).map(([matchId, value]) => {
      if (typeof value === "string") {
        return [matchId, { ...emptyPlayerReport(), text: value }];
      }
      return [
        matchId,
        {
          ...emptyPlayerReport(),
          text: value?.text || "",
          rating: clamp(Number(value?.rating) || 0, 0, 10),
          yellowCards: normalizeCardCount(value?.yellowCards ?? value?.yellowCard, 2),
          redCards: normalizeCardCount(value?.redCards ?? value?.redCard, 1),
          minutes: clamp(Number(value?.minutes) || 0, 0, 130),
          youtube: value?.youtube || "",
          completedPasses: nonNegativeInteger(value?.completedPasses),
          failedPasses: nonNegativeInteger(value?.failedPasses),
          losses: nonNegativeInteger(value?.losses),
          recoveries: nonNegativeInteger(value?.recoveries),
          goals: nonNegativeInteger(value?.goals),
          assists: nonNegativeInteger(value?.assists),
          shotsOnTarget: nonNegativeInteger(value?.shotsOnTarget),
          goalPasses: nonNegativeInteger(value?.goalPasses)
        }
      ];
    })
  );
}

function emptyPlayerReport() {
  return {
    text: "",
    rating: 0,
    yellowCards: 0,
    redCards: 0,
    minutes: 0,
    youtube: "",
    completedPasses: 0,
    failedPasses: 0,
    losses: 0,
    recoveries: 0,
    goals: 0,
    assists: 0,
    shotsOnTarget: 0,
    goalPasses: 0
  };
}

function emptyTeamMatchStats() {
  return {
    yellowCards: 0,
    redCards: 0,
    penaltiesFor: 0,
    penaltiesAgainst: 0,
    chancesCreated: 0,
    chancesAgainst: 0
  };
}

function normalizeTeamMatchStats(value) {
  return {
    yellowCards: nonNegativeInteger(value?.yellowCards),
    redCards: nonNegativeInteger(value?.redCards),
    penaltiesFor: nonNegativeInteger(value?.penaltiesFor),
    penaltiesAgainst: nonNegativeInteger(value?.penaltiesAgainst),
    chancesCreated: nonNegativeInteger(value?.chancesCreated ?? value?.foulsCommitted),
    chancesAgainst: nonNegativeInteger(value?.chancesAgainst ?? value?.foulsReceived)
  };
}

function calculateTeamMatchStats() {
  const totals = activeMatches().reduce(
    (totals, item) => {
      const stats = normalizeTeamMatchStats(item.teamStats);
      ["penaltiesFor", "penaltiesAgainst", "chancesCreated", "chancesAgainst"].forEach((key) => {
        totals[key] += stats[key];
      });
      return totals;
    },
    emptyTeamMatchStats()
  );
  activePlayers().forEach((item) => {
    const playerTotals = playerReportTotals(item);
    totals.yellowCards += playerTotals.yellowCards;
    totals.redCards += playerTotals.redCards;
  });
  return totals;
}

function nonNegativeInteger(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function normalizeCardCount(value, maximum) {
  if (value === true) return 1;
  return clamp(nonNegativeInteger(value), 0, maximum);
}

function playerReport(item, matchId) {
  const value = item.reports?.[matchId];
  if (typeof value === "string") return { ...emptyPlayerReport(), text: value };
  return {
    ...emptyPlayerReport(),
    text: value?.text || "",
    rating: clamp(Number(value?.rating) || 0, 0, 10),
    yellowCards: normalizeCardCount(value?.yellowCards ?? value?.yellowCard, 2),
    redCards: normalizeCardCount(value?.redCards ?? value?.redCard, 1),
    minutes: clamp(Number(value?.minutes) || 0, 0, 130),
    youtube: value?.youtube || "",
    completedPasses: nonNegativeInteger(value?.completedPasses),
    failedPasses: nonNegativeInteger(value?.failedPasses),
    losses: nonNegativeInteger(value?.losses),
    recoveries: nonNegativeInteger(value?.recoveries),
    goals: nonNegativeInteger(value?.goals),
    assists: nonNegativeInteger(value?.assists),
    shotsOnTarget: nonNegativeInteger(value?.shotsOnTarget),
    goalPasses: nonNegativeInteger(value?.goalPasses)
  };
}

function ensurePlayerReport(item, matchId) {
  item.reports = normalizePlayerReports(item.reports);
  item.reports[matchId] ||= emptyPlayerReport();
  return item.reports[matchId];
}

function playerMinutesPlayed(item) {
  return playerReportTotals(item).minutes;
}

function playerReportTotals(item) {
  const keys = ["minutes", "completedPasses", "failedPasses", "losses", "recoveries", "goals", "assists", "shotsOnTarget", "goalPasses", "yellowCards", "redCards"];
  return activeMatches().reduce(
    (totals, matchItem) => {
      const report = playerReport(item, matchItem.id);
      keys.forEach((key) => {
        totals[key] += report[key];
      });
      return totals;
    },
    Object.fromEntries(keys.map((key) => [key, 0]))
  );
}

function playerReportHasData(report) {
  return Boolean(
    report.text.trim() ||
      report.rating ||
      report.yellowCards ||
      report.redCards ||
      report.youtube ||
      report.minutes ||
      report.completedPasses ||
      report.failedPasses ||
      report.losses ||
      report.recoveries ||
      report.goals ||
      report.assists ||
      report.shotsOnTarget ||
      report.goalPasses
  );
}

function youtubeEmbedUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
      else videoId = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || "";
    }
    return /^[a-zA-Z0-9_-]{6,}$/.test(videoId) ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

async function downloadPlayerPdf(item) {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) {
    alert("El navegador ha bloqueado la ventana del PDF. Permite ventanas emergentes y vuelve a intentarlo.");
    return;
  }
  popup.document.write("<p style=\"font:16px Arial;padding:24px\">Preparando la ficha y cargando la fotografía...</p>");

  const printableTeamName = playerTeamName(item);
  const appearances = activeMatches().filter((matchItem) => matchItem.lineup?.[item.id]);
  const totals = playerReportTotals(item);
  const reports = activeMatches()
    .slice()
    .sort((a, b) => a.round - b.round)
    .map((matchItem) => ({ match: matchItem, report: playerReport(item, matchItem.id) }))
    .filter(({ report }) => playerReportHasData(report));
  const printablePhoto = await imageToDataUrl(item.photo);

  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Ficha de ${escapeHtml(item.name)}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #20242a; font: 12px Arial, sans-serif; }
          header { display: grid; grid-template-columns: 120px 1fr; gap: 20px; padding-bottom: 18px; border-bottom: 3px solid #b7192b; }
          .photo { width: 120px; height: 150px; display: grid; place-items: center; overflow: hidden; color: white; background: #b7192b; font-size: 30px; font-weight: bold; }
          .photo img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center; }
          h1 { margin: 0 0 5px; font-size: 27px; }
          h2 { margin: 22px 0 10px; color: #861424; font-size: 17px; }
          .meta { color: #6a717c; }
          .info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 14px; }
          .info div, .metric { padding: 9px; background: #f1f3f5; }
          .info span, .metric span { display: block; color: #6a717c; font-size: 9px; text-transform: uppercase; }
          .info strong, .metric strong { display: block; margin-top: 3px; }
          .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .report-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 8px; }
          .report-stats div { padding: 6px; background: #f1f3f5; }
          .report-stats span { display: block; color: #6a717c; font-size: 8px; text-transform: uppercase; }
          .report-stats strong { display: block; margin-top: 2px; }
          .ratings { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .rating { padding: 10px; border: 1px solid #dde1e7; }
          .rating span { display: block; color: #6a717c; font-size: 9px; text-transform: uppercase; }
          .rating strong { display: block; margin-top: 4px; font-size: 16px; }
          .rating-bar { height: 5px; margin-top: 7px; background: #e3e6e9; }
          .rating-bar i { display: block; height: 100%; background: #b7192b; }
          .description { white-space: pre-wrap; line-height: 1.5; }
          .report { break-inside: avoid; margin-bottom: 10px; padding: 10px; border: 1px solid #dde1e7; }
          .report h3 { margin: 0 0 5px; }
          .report p { margin: 6px 0 0; white-space: pre-wrap; line-height: 1.45; }
          a { color: #125bd8; overflow-wrap: anywhere; }
        </style>
      </head>
      <body>
        <header>
          <div class="photo">${printablePhoto ? `<img src="${escapeAttr(printablePhoto)}" alt="Foto de ${escapeAttr(item.name)}" />` : initials(item.name)}</div>
          <div>
            <div class="meta">${escapeHtml(printableTeamName.toUpperCase())} · FICHA TÉCNICA</div>
            <h1>${escapeHtml(item.name)}</h1>
            <div class="info">
              ${renderPdfInfo("Fecha de nacimiento", formatDate(item.birthdate))}
              ${renderPdfInfo("Edad", `${calculateAge(item.birthdate)} años`)}
              ${renderPdfInfo("Posición", item.position)}
              ${renderPdfInfo("Lateralidad", item.laterality || "Diestro")}
              ${renderPdfInfo("Dorsal", item.number)}
              ${renderPdfInfo("Temporada", "2026")}
            </div>
          </div>
        </header>
        <h2>Descripción</h2>
        <div class="description">${escapeHtml(item.description || "Sin descripción.")}</div>
        <h2>Valoración</h2>
        <div class="ratings">
          ${Object.entries(playerRatingLabels())
            .map(([key, label]) => renderPdfRating(label, normalizePlayerRatings(item.ratings)[key]))
            .join("")}
        </div>
        <h2>Estadísticas</h2>
        <div class="metrics">
          ${renderPdfMetric("Alineaciones", appearances.length)}
          ${renderPdfMetric("Partidos jugados", appearances.filter((matchItem) => parseScore(matchItem.score)).length)}
          ${renderPdfMetric("Minutos jugados", totals.minutes)}
          ${renderPdfMetric("Goles", totals.goals)}
          ${renderPdfMetric("Asistencias de gol", totals.assists)}
          ${renderPdfMetric("Tiros a puerta", totals.shotsOnTarget)}
          ${renderPdfMetric("Pases de gol", totals.goalPasses)}
          ${renderPdfMetric("Pases correctos", totals.completedPasses)}
          ${renderPdfMetric("Pases fallados", totals.failedPasses)}
          ${renderPdfMetric("Pérdidas", totals.losses)}
          ${renderPdfMetric("Recuperaciones", totals.recoveries)}
          ${renderPdfMetric("Tarjetas amarillas", totals.yellowCards)}
          ${renderPdfMetric("Tarjetas rojas", totals.redCards)}
        </div>
        <h2>Trayectoria</h2>
        <div class="description">${escapeHtml(item.career || `${printableTeamName} · Temporada 2026`)}</div>
        <h2>Informes de partido</h2>
        ${
          reports.length
            ? reports
                .map(
                  ({ match, report }) => `
                    <article class="report">
                      <h3>Jornada ${match.round}: ${escapeHtml(match.home)} vs ${escapeHtml(match.away)}</h3>
                      <div class="meta">${match.date ? formatDate(match.date) : "Fecha pendiente"} · ${report.minutes} minutos · Valoración ${report.rating ? `${report.rating} / 10` : "Sin valorar"}</div>
                      <div class="report-stats">
                        ${renderPdfReportStat("Pases correctos", report.completedPasses)}
                        ${renderPdfReportStat("Pases fallados", report.failedPasses)}
                        ${renderPdfReportStat("Pérdidas", report.losses)}
                        ${renderPdfReportStat("Recuperaciones", report.recoveries)}
                        ${renderPdfReportStat("Goles", report.goals)}
                        ${renderPdfReportStat("Asistencias de gol", report.assists)}
                        ${renderPdfReportStat("Tiros a puerta", report.shotsOnTarget)}
                        ${renderPdfReportStat("Pases de gol", report.goalPasses)}
                        ${renderPdfReportStat("Tarjetas amarillas", report.yellowCards)}
                        ${renderPdfReportStat("Tarjetas rojas", report.redCards)}
                      </div>
                      ${report.text ? `<p>${escapeHtml(report.text)}</p>` : ""}
                      ${report.youtube ? `<p><a href="${escapeAttr(report.youtube)}">${escapeHtml(report.youtube)}</a></p>` : ""}
                    </article>
                  `
                )
                .join("")
            : "<p>Sin informes registrados.</p>"
        }
        <script>
          window.addEventListener("load", async () => {
            const images = Array.from(document.images);
            await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            })));
            setTimeout(() => window.print(), 250);
          });
        <\/script>
      </body>
    </html>
  `);
  popup.document.close();
}

async function imageToDataUrl(value) {
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  try {
    const response = await fetch(value, { cache: "force-cache" });
    if (!response.ok) throw new Error(`No se pudo cargar la foto: ${response.status}`);
    const blob = await response.blob();
    return await readFileAsDataUrl(blob);
  } catch (error) {
    console.error(error);
    return value;
  }
}

function renderPdfInfo(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderPdfMetric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderPdfRating(label, value) {
  return `
    <div class="rating">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatRating(value))}</strong>
      <div class="rating-bar"><i style="width:${value * 10}%"></i></div>
    </div>
  `;
}

function renderPdfReportStat(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

function parsedMatches() {
  return activeMatches().flatMap((item) => {
    const score = parseScore(item.score);
    return score ? [{ ...item, homeGoals: score.home, awayGoals: score.away }] : [];
  });
}

function parseScore(value) {
  const match = String(value || "").trim().match(/^(\d+)\s*[-:]\s*(\d+)$/);
  if (!match) return null;
  return { home: Number(match[1]), away: Number(match[2]) };
}

function buildStandings() {
  const teams = new Map();
  const getTeam = (name) => {
    if (!teams.has(name)) {
      teams.set(name, {
        name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      });
    }
    return teams.get(name);
  };

  parsedMatches().forEach((item) => {
    const home = getTeam(item.home);
    const away = getTeam(item.away);
    home.played += 1;
    away.played += 1;
    home.goalsFor += item.homeGoals;
    home.goalsAgainst += item.awayGoals;
    away.goalsFor += item.awayGoals;
    away.goalsAgainst += item.homeGoals;

    if (item.homeGoals > item.awayGoals) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (item.homeGoals < item.awayGoals) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  return [...teams.values()]
    .map((team) => ({ ...team, goalDifference: team.goalsFor - team.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name, "es")
    );
}

function calculateTeamStats(matches) {
  const selectedTeamName = currentTeam().name;
  const stats = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  };

  matches.forEach((item) => {
    const isHome = item.home === selectedTeamName;
    const isAway = item.away === selectedTeamName;
    if (!isHome && !isAway) return;
    const goalsFor = isHome ? item.homeGoals : item.awayGoals;
    const goalsAgainst = isHome ? item.awayGoals : item.homeGoals;
    stats.played += 1;
    stats.goalsFor += goalsFor;
    stats.goalsAgainst += goalsAgainst;
    if (goalsFor > goalsAgainst) {
      stats.won += 1;
      stats.points += 3;
    } else if (goalsFor < goalsAgainst) {
      stats.lost += 1;
    } else {
      stats.drawn += 1;
      stats.points += 1;
    }
  });

  return stats;
}

function buildPlayerStatistics() {
  const matches = activeMatches();
  const matchIds = new Set(matches.map((item) => item.id));
  const totalMatches = matches.length;
  return activePlayers()
    .map((item) => {
      const appearances = matches.filter((matchItem) => matchItem.lineup?.[item.id]);
      const starts = matches.filter((matchItem) => {
        const sheets = normalizeLineupSheets(matchItem.lineupSheets, matchItem);
        return sheets[ownTeamSide(matchItem)].some(
          (row) => row.playerId === item.id && row.role === "starter"
        );
      }).length;
      const played = appearances.filter((matchItem) => Boolean(parseScore(matchItem.score))).length;
      const totals = playerReportTotals(item);
      return {
        id: item.id,
        name: item.name,
        number: item.number,
        position: item.position,
        photo: item.photo || "",
        appearances: appearances.length,
        starts,
        played,
        participation: totalMatches ? Math.round((appearances.length / totalMatches) * 100) : 0,
        ...totals,
        reports: Object.keys(item.reports || {}).filter((matchId) => {
          if (!matchIds.has(matchId)) return false;
          const report = playerReport(item, matchId);
          return playerReportHasData(report);
        }).length
      };
    })
    .sort((a, b) => b.starts - a.starts || b.appearances - a.appearances || a.number - b.number);
}

function countPlayersByPosition() {
  const positions = ["Portero", "Defensa", "Centrocampista", "Delantero"];
  return Object.fromEntries(
    positions.map((position) => [
      position,
      activePlayers().filter((playerItem) => playerItem.position === position).length
    ])
  );
}

function renderMetric(label, value) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function formatGoalDifference(value) {
  return value > 0 ? `+${value}` : String(value);
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

function calculateAge(value) {
  if (!value) return 0;
  const birthdate = new Date(`${value}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const birthdayPending =
    today.getMonth() < birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() && today.getDate() < birthdate.getDate());
  if (birthdayPending) age -= 1;
  return age;
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

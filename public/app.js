/* Loom — Weaver Agent Curriculum & Monochrome Task Management Suite.
   Vanilla JS, zero dependencies, Bun backend. */

const el = {
  form: document.querySelector("#composer"),
  input: document.querySelector("#new-task"),
  prioritySelect: document.querySelector("#task-priority"),
  list: document.querySelector("#list"),
  empty: document.querySelector("#empty"),
  meter: document.querySelector("#meter-fill"),
  counts: document.querySelector("#counts"),
  clear: document.querySelector("#clear"),
  theme: document.querySelector("#theme-toggle"),
  date: document.querySelector("#date"),
  toast: document.querySelector("#toast"),
  boardTitle: document.querySelector("#board-title"),
  boardStats: document.querySelector("#board-stats"),
  boardTabs: document.querySelector("#board-tabs"),
  btnAddBoard: document.querySelector("#btn-add-board"),
  searchInput: document.querySelector("#search-input"),
  filters: Array.from(document.querySelectorAll("[data-filter]")),

  // Header buttons & User
  userPill: document.querySelector("#user-pill"),
  userName: document.querySelector("#user-name"),
  btnCurriculum: document.querySelector("#btn-curriculum"),
  btnOAuthPortal: document.querySelector("#btn-oauth-portal"),
  btnBenchmarkPortal: document.querySelector("#btn-benchmark-portal"),

  // Modals
  refactorModal: document.querySelector("#refactor-modal"),
  btnCloseRefactor: document.querySelector("#btn-close-refactor"),
  refactorTitle: document.querySelector("#refactor-title"),
  refactorDifficulty: document.querySelector("#refactor-difficulty"),
  refactorCategory: document.querySelector("#refactor-category"),
  refactorInstructions: document.querySelector("#refactor-instructions"),
  refactorCriteriaList: document.querySelector("#refactor-criteria-list"),
  codeStarter: document.querySelector("#code-starter"),
  codeSolution: document.querySelector("#code-solution"),
  refactorSubmitCode: document.querySelector("#refactor-submit-code"),
  btnRunVerify: document.querySelector("#btn-run-verify"),
  btnLoadSolution: document.querySelector("#btn-load-solution"),
  verifyResult: document.querySelector("#verify-result"),

  // Auth modal
  authModal: document.querySelector("#auth-modal"),
  btnCloseAuth: document.querySelector("#btn-close-auth"),
  tabLogin: document.querySelector("#tab-login"),
  tabRegister: document.querySelector("#tab-register"),
  authForm: document.querySelector("#auth-form"),
  authTitle: document.querySelector("#auth-title"),
  authUsername: document.querySelector("#auth-username"),
  authDisplayGroup: document.querySelector("#auth-display-group"),
  authDisplayName: document.querySelector("#auth-displayname"),
  authPassword: document.querySelector("#auth-password"),
  btnAuthSubmit: document.querySelector("#btn-auth-submit"),
  btnQuickWeaver: document.querySelector("#btn-quick-weaver"),
  btnQuickPp: document.querySelector("#btn-quick-pp"),

  // OAuth modal
  oauthModal: document.querySelector("#oauth-modal"),
  btnCloseOAuth: document.querySelector("#btn-close-oauth"),
  oauthClientsList: document.querySelector("#oauth-clients-list"),
  btnSimulateOAuth: document.querySelector("#btn-simulate-oauth"),
  oauthSimOutput: document.querySelector("#oauth-sim-output"),
  // Benchmark modal
  benchmarkModal: document.querySelector("#benchmark-modal"),
  btnCloseBenchmark: document.querySelector("#btn-close-benchmark"),
  btnRunFullBenchmark: document.querySelector("#btn-run-full-benchmark"),
  btnDownloadBenchmarkMd: document.querySelector("#btn-download-benchmark-md"),
  benchTotalTasks: document.querySelector("#bench-total-tasks"),
  benchPassRate: document.querySelector("#bench-pass-rate"),
  benchAvgScore: document.querySelector("#bench-avg-score"),
  benchAvgDuration: document.querySelector("#bench-avg-duration"),
  benchTableBody: document.querySelector("#bench-table-body"),

  // Command palette
  palette: document.querySelector("#palette"),
  paletteInput: document.querySelector("#palette-input"),
  paletteList: document.querySelector("#palette-list"),
};

const state = {
  boards: [],
  tasks: [],
  activeBoardId: "board_today",
  user: null,
  oauthClients: [],
  filter: "all",
  searchQuery: "",
  editing: null,
  cursor: -1,
  paletteOpen: false,
  matches: [],
  activeCommandIdx: 0,
  dragId: null,
  currentRefactorTask: null,
  authMode: "login", // 'login' | 'register'
};

const CHECKS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19 7.4"/></svg>`;
const CROSS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

/* ── API helpers ─────────────────────────────────────────── */

async function api(method, path, body) {
  const init = { method, headers: {} };
  if (body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

let toastTimer;
function toast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast?.classList.remove("show"), 2800);
}

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

const isTyping = (node) =>
  !!node &&
  (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT" || node.isContentEditable);

/* ── Filtering & Visibility ──────────────────────────────── */

function currentBoard() {
  return state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0] || null;
}

function visibleTasks() {
  let list = state.tasks.filter((t) => t.boardId === state.activeBoardId);

  if (state.filter === "active") list = list.filter((t) => !t.done);
  else if (state.filter === "done") list = list.filter((t) => t.done);
  else if (state.filter === "refactor") list = list.filter((t) => Boolean(t.refactorData));

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q))),
    );
  }

  return list;
}

function cursorTask() {
  return visibleTasks()[state.cursor] ?? null;
}

function emptyCopy() {
  const inBoard = state.tasks.filter((t) => t.boardId === state.activeBoardId);
  if (inBoard.length === 0) return "This board is empty. Start typing above or press R to seed refactoring tasks.";
  if (state.filter === "active") return "All clear. Everything on this board is done.";
  if (state.filter === "done") return "No finished tasks yet on this board.";
  if (state.filter === "refactor") return "No refactoring challenges found in this view.";
  if (state.searchQuery) return "No tasks matched your search query.";
  return "Nothing here. Breathe.";
}

/* ── Render ──────────────────────────────────────────────── */

function render() {
  renderBoardsNav();
  renderTasks();
  renderUserPill();
}

function renderBoardsNav() {
  if (!el.boardTabs) return;

  el.boardTabs.replaceChildren(
    ...state.boards.map((board) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `board-tab ${board.id === state.activeBoardId ? "active" : ""}`;
      const count = state.tasks.filter((t) => t.boardId === board.id).length;
      btn.innerHTML = `<span>${board.name}</span><span class="count">${count}</span>`;
      btn.addEventListener("click", () => switchBoard(board.id));
      return btn;
    }),
  );

  const active = currentBoard();
  if (active) {
    if (el.boardTitle) el.boardTitle.textContent = `${active.name}.`;
    const inBoard = state.tasks.filter((t) => t.boardId === active.id);
    const doneCount = inBoard.filter((t) => t.done).length;
    if (el.boardStats) el.boardStats.textContent = `${doneCount}/${inBoard.length} completed`;
  }
}

function renderTasks() {
  const items = visibleTasks();
  if (state.cursor >= items.length) state.cursor = items.length - 1;
  if (state.cursor < 0 && items.length > 0 && state.cursor !== -1) state.cursor = -1;

  if (el.list) el.list.replaceChildren(...items.map((task, index) => row(task, index)));

  if (el.empty) {
    el.empty.hidden = items.length > 0;
    el.empty.textContent = emptyCopy();
  }

  const inBoard = state.tasks.filter((t) => t.boardId === state.activeBoardId);
  const total = inBoard.length;
  const done = inBoard.filter((t) => t.done).length;

  if (el.counts) el.counts.textContent = total === 0 ? "No tasks" : `${done} of ${total} done`;
  if (el.meter) el.meter.style.width = total === 0 ? "0%" : `${(done / total) * 100}%`;
  if (el.clear) el.clear.hidden = done === 0;

  for (const button of el.filters) {
    button.setAttribute("aria-selected", String(button.dataset.filter === state.filter));
  }
}

function renderUserPill() {
  if (!el.userName) return;
  if (state.user) {
    el.userName.textContent = `${state.user.username} (${state.user.role || "user"})`;
    el.userPill?.setAttribute("title", `Signed in as ${state.user.displayName || state.user.username}. Click to manage.`);
  } else {
    el.userName.textContent = "Sign in";
    el.userPill?.setAttribute("title", "Click to sign in with 1st-party authentication");
  }
}

function row(task, index) {
  const li = document.createElement("li");
  li.className = "task";
  if (task.done) li.classList.add("done");
  if (index === state.cursor) li.classList.add("cursor");
  li.dataset.id = task.id;
  li.draggable = state.editing !== task.id;

  // Circular completion checkbox
  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.setAttribute("aria-pressed", String(task.done));
  check.setAttribute("aria-label", task.done ? "Mark incomplete" : "Mark complete");
  check.innerHTML = CHECKS;
  check.addEventListener("click", () => toggleTask(task));

  // Center column: title + metadata pills
  const content = document.createElement("div");
  content.className = "task-content";

  const body =
    state.editing === task.id
      ? editField(task)
      : (() => {
          const span = document.createElement("span");
          span.className = "task-title";
          span.textContent = task.title;
          span.title = "Double-click to edit title";
          span.addEventListener("dblclick", () => startEdit(task));
          return span;
        })();

  content.append(body);

  // Metadata pills
  const meta = document.createElement("div");
  meta.className = "task-meta";

  if (task.priority > 0) {
    const dot = document.createElement("span");
    dot.className = `priority-dot p${task.priority}`;
    dot.title = task.priority === 2 ? "Urgent priority" : "Medium priority";
    meta.append(dot);
  }

  if (task.refactorData) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "refactor-inspect-btn";
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6M14 4l-4 16"/></svg> Refactor Inspect (${task.refactorData.difficulty})`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRefactorModal(task);
    });
    meta.append(btn);
  }

  if (Array.isArray(task.tags)) {
    for (const tag of task.tags.slice(0, 3)) {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = `#${tag}`;
      meta.append(pill);
    }
  }

  if (meta.children.length > 0) content.append(meta);

  // Actions
  const actions = document.createElement("div");
  actions.className = "task-actions";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.setAttribute("aria-label", `Delete “${task.title}”`);
  remove.innerHTML = CROSS;
  remove.addEventListener("click", () => deleteTask(task));

  actions.append(remove);
  li.append(check, content, actions);

  // Drag and drop reordering
  li.addEventListener("dragstart", (event) => {
    if (state.editing) return event.preventDefault();
    state.dragId = task.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
    requestAnimationFrame(() => li.classList.add("dragging"));
  });
  li.addEventListener("dragend", () => {
    state.dragId = null;
    li.classList.remove("dragging");
  });
  li.addEventListener("dragover", (event) => {
    if (!state.dragId || state.dragId === task.id) return;
    event.preventDefault();
    li.classList.add("drop-target");
  });
  li.addEventListener("dragleave", () => li.classList.remove("drop-target"));
  li.addEventListener("drop", (event) => {
    event.preventDefault();
    li.classList.remove("drop-target");
    const dragged = event.dataTransfer.getData("text/plain") || state.dragId;
    if (dragged && dragged !== task.id) moveBefore(dragged, task.id);
  });

  return li;
}

function editField(task) {
  const input = document.createElement("input");
  input.className = "task-edit";
  input.value = task.title;
  input.maxLength = 300;
  input.setAttribute("aria-label", "Edit task");

  let settled = false;
  const commit = async () => {
    if (settled || state.editing !== task.id) return;
    settled = true;
    const next = input.value.replace(/\s+/g, " ").trim();
    state.editing = null;

    if (!next || next === task.title) return render();
    try {
      Object.assign(task, await api("PATCH", `/api/tasks/${task.id}`, { title: next }));
    } catch (err) {
      toast(err.message);
    }
    render();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      settled = true;
      state.editing = null;
      render();
    }
  });
  input.addEventListener("blur", commit);

  queueMicrotask(() => {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  return input;
}

/* ── Actions ─────────────────────────────────────────────── */

async function addTask(title, priority = 0) {
  try {
    const board = currentBoard();
    const task = await api("POST", "/api/tasks", {
      title,
      boardId: board ? board.id : state.activeBoardId,
      priority: Number(priority),
    });
    state.tasks.push(task);
    if (state.filter === "done") setFilter("all");
    state.cursor = visibleTasks().length - 1;
    render();
  } catch (err) {
    if (el.input) el.input.value = title;
    toast(err.message);
  }
}

async function toggleTask(task) {
  const before = { done: task.done, doneAt: task.doneAt };
  task.done = !task.done;
  task.doneAt = task.done ? new Date().toISOString() : null;
  render();

  try {
    Object.assign(task, await api("PATCH", `/api/tasks/${task.id}`, { done: task.done }));
  } catch (err) {
    Object.assign(task, before);
    toast(err.message);
  }
  render();
}

async function deleteTask(task) {
  const index = state.tasks.indexOf(task);
  if (index === -1) return;
  state.tasks.splice(index, 1);
  render();
  try {
    await api("DELETE", `/api/tasks/${task.id}`);
  } catch (err) {
    state.tasks.splice(index, 0, task);
    toast(err.message);
  }
  render();
}

function startEdit(task) {
  state.editing = task.id;
  render();
}

async function moveBefore(draggedId, targetId) {
  const from = state.tasks.findIndex((t) => t.id === draggedId);
  const to = state.tasks.findIndex((t) => t.id === targetId);
  if (from === -1 || to === -1 || from === to) return;

  const [task] = state.tasks.splice(from, 1);
  state.tasks.splice(from < to ? to - 1 : to, 0, task);
  render();

  try {
    const { tasks } = await api("POST", "/api/tasks/reorder", {
      boardId: state.activeBoardId,
      ids: state.tasks.filter((t) => t.boardId === state.activeBoardId).map((t) => t.id),
    });
    if (Array.isArray(tasks)) state.tasks = tasks;
  } catch (err) {
    toast(err.message);
  }
  render();
}

async function clearCompleted() {
  const inBoard = state.tasks.filter((t) => t.boardId === state.activeBoardId);
  if (!inBoard.some((t) => t.done)) return toast("Nothing completed on this board yet.");
  try {
    const { tasks, removed } = await api("POST", "/api/tasks/clear-completed", {
      boardId: state.activeBoardId,
    });
    if (Array.isArray(tasks)) state.tasks = tasks;
    state.cursor = -1;
    render();
    toast(`Cleared ${removed} completed task${removed === 1 ? "" : "s"}.`);
  } catch (err) {
    toast(err.message);
  }
}

function setFilter(filter) {
  state.filter = filter;
  state.cursor = -1;
  state.editing = null;
  render();
}

function switchBoard(boardId) {
  state.activeBoardId = boardId;
  state.cursor = -1;
  state.editing = null;
  render();
}

async function createBoardPrompt() {
  const name = prompt("Enter new board name:");
  if (!name || !name.trim()) return;
  try {
    const board = await api("POST", "/api/boards", { name: name.trim() });
    state.boards.push(board);
    switchBoard(board.id);
    toast(`Created board “${board.name}”.`);
  } catch (err) {
    toast(err.message);
  }
}

function moveCursor(delta) {
  const items = visibleTasks();
  if (items.length === 0) return;
  state.cursor = clamp((state.cursor < 0 ? -1 : state.cursor) + delta, 0, items.length - 1);
  render();
  el.list?.querySelector(".task.cursor")?.scrollIntoView({ block: "nearest" });
}

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("loom.theme", next);
  } catch {}
}

/* ── Refactoring Tasks Curriculum ────────────────────────── */

async function seedCurriculum() {
  toast("Seeding Weaver 1M Curriculum tasks...");
  try {
    const res = await api("POST", "/api/curriculum/seed");
    // Reload state
    await loadInitialState();
    switchBoard("board_refactor_curriculum");
    toast(`Seeded ${res.seededCount} refactoring curriculum tasks!`);
  } catch (err) {
    toast(err.message);
  }
}

function openRefactorModal(task) {
  if (!task.refactorData) return;
  state.currentRefactorTask = task;
  const data = task.refactorData;

  if (el.refactorTitle) el.refactorTitle.textContent = task.title;
  if (el.refactorDifficulty) el.refactorDifficulty.textContent = (data.difficulty || "intermediate").toUpperCase();
  if (el.refactorCategory) el.refactorCategory.textContent = (task.category || "Refactor").toUpperCase();
  if (el.refactorInstructions) el.refactorInstructions.textContent = data.instructions || "";

  if (el.refactorCriteriaList) {
    el.refactorCriteriaList.replaceChildren(
      ...(data.criteria || []).map((c) => {
        const li = document.createElement("li");
        li.textContent = c;
        return li;
      }),
    );
  }

  if (el.codeStarter) el.codeStarter.textContent = data.starterCode || "";
  if (el.codeSolution) el.codeSolution.textContent = data.solutionCode || "";
  if (el.refactorSubmitCode) el.refactorSubmitCode.value = data.starterCode || "";
  if (el.verifyResult) el.verifyResult.hidden = true;

  switchRefactorTab("starter");
  if (el.refactorModal) el.refactorModal.hidden = false;
}

function closeRefactorModal() {
  if (el.refactorModal) el.refactorModal.hidden = true;
  state.currentRefactorTask = null;
}

function switchRefactorTab(tabName) {
  document.querySelectorAll(".code-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.toggle("active", p.id === `tab-${tabName}`));

  if (tabName === "diff" && state.currentRefactorTask) {
    renderDiff();
  }
}

function renderDiff() {
  const container = document.querySelector("#diff-output");
  if (!container || !state.currentRefactorTask) return;

  const starter = state.currentRefactorTask.refactorData.starterCode || "";
  const current = el.refactorSubmitCode?.value || starter;

  const starterLines = starter.split("\n");
  const currentLines = current.split("\n");

  const diffLines = [];
  const max = Math.max(starterLines.length, currentLines.length);

  for (let i = 0; i < max; i++) {
    const s = starterLines[i];
    const c = currentLines[i];

    if (s === undefined && c !== undefined) {
      diffLines.push({ type: "added", text: `+ ${c}` });
    } else if (c === undefined && s !== undefined) {
      diffLines.push({ type: "removed", text: `- ${s}` });
    } else if (s !== c) {
      diffLines.push({ type: "removed", text: `- ${s}` });
      diffLines.push({ type: "added", text: `+ ${c}` });
    } else {
      diffLines.push({ type: "unchanged", text: `  ${s}` });
    }
  }

  container.innerHTML = diffLines
    .map((l) => `<div class="diff-line ${l.type}">${escapeHtml(l.text)}</div>`)
    .join("");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function runRefactorVerification() {
  if (!state.currentRefactorTask) return;
  const code = el.refactorSubmitCode.value;
  try {
    const result = await api("POST", "/api/curriculum/evaluate", {
      taskId: state.currentRefactorTask.id,
      code,
    });

    if (el.verifyResult) {
      el.verifyResult.hidden = false;
      const passColor = result.passed ? "color: #10b981;" : "color: #ef4444;";
      el.verifyResult.innerHTML = `
        <div class="telemetry-grid">
          <div class="stat-card">
            <div class="stat-value">${result.telemetry.durationMs}ms</div>
            <div class="stat-label">Execution Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.telemetry.assertions.passed}/${result.telemetry.assertions.total}</div>
            <div class="stat-label">Assertions Passed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.score}%</div>
            <div class="stat-label">Evaluator Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.diff.lineDelta >= 0 ? "+" : ""}${result.diff.lineDelta}</div>
            <div class="stat-label">Line Delta</div>
          </div>
        </div>

        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.6rem; ${passColor}">
          ${result.passed ? "✓ Sandbox Evaluation Passed!" : "✗ Sandbox Evaluation Incomplete"}
        </div>
        <div style="margin-bottom: 0.4rem; color: var(--ink);">Test Assertions & Criteria:</div>
        <ul style="margin: 0 0 0.5rem 1.2rem; padding: 0;">
          ${result.assertionResults
            .map(
              (a) => `
            <li style="color: ${a.passed ? "#10b981" : "#ef4444"}; margin-bottom: 0.25rem;">
              <strong>${a.passed ? "✓" : "✗"} ${escapeHtml(a.name)}:</strong>
              <span style="color: var(--muted);">${escapeHtml(a.detail || "")}</span>
            </li>
          `,
            )
            .join("")}
        </ul>
      `;
    }

    if (result.passed && !state.currentRefactorTask.done) {
      toggleTask(state.currentRefactorTask);
      toast("Challenge verified and marked complete!");
    }
  } catch (err) {
    toast(err.message);
  }
}

/* ── 1st-Party Proprietary Authentication ─────────────────── */

function openAuthModal() {
  if (state.user) {
    // Already logged in: offer logout or view profile
    if (confirm(`Signed in as ${state.user.displayName || state.user.username} (${state.user.role}). Log out?`)) {
      logout();
    }
    return;
  }
  setAuthMode("login");
  if (el.authModal) el.authModal.hidden = false;
  if (el.authUsername) el.authUsername.focus();
}

function closeAuthModal() {
  if (el.authModal) el.authModal.hidden = true;
}

function setAuthMode(mode) {
  state.authMode = mode;
  el.tabLogin?.classList.toggle("active", mode === "login");
  el.tabRegister?.classList.toggle("active", mode === "register");
  if (el.authTitle) el.authTitle.textContent = mode === "login" ? "Sign In to Loom" : "Create Loom Account";
  if (el.btnAuthSubmit) el.btnAuthSubmit.textContent = mode === "login" ? "Sign In" : "Register Account";
  if (el.authDisplayGroup) el.authDisplayGroup.hidden = mode === "login";
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const username = el.authUsername.value.trim();
  const password = el.authPassword.value;
  const displayName = el.authDisplayName?.value?.trim() || username;

  try {
    if (state.authMode === "login") {
      const data = await api("POST", "/api/auth/login", { username, password });
      state.user = data.user;
      toast(`Welcome back, ${state.user.displayName || state.user.username}!`);
    } else {
      const data = await api("POST", "/api/auth/register", { username, password, displayName });
      state.user = data.user;
      toast(`Registered & logged in as ${state.user.username}!`);
    }
    closeAuthModal();
    render();
  } catch (err) {
    toast(err.message);
  }
}

async function quickSignIn(username, password) {
  try {
    const data = await api("POST", "/api/auth/login", { username, password });
    state.user = data.user;
    closeAuthModal();
    render();
    toast(`Authenticated as ${state.user.displayName}!`);
  } catch (err) {
    toast(err.message);
  }
}

async function logout() {
  try {
    await api("POST", "/api/auth/logout");
    state.user = null;
    toast("Logged out successfully.");
    render();
  } catch (err) {
    toast(err.message);
  }
}

/* ── 1st-Party Proprietary OAuth 2.0 & PKCE Simulator ─────── */

function openOAuthModal() {
  renderOAuthClients();
  if (el.oauthModal) el.oauthModal.hidden = false;
}

function closeOAuthModal() {
  if (el.oauthModal) el.oauthModal.hidden = true;
}

function renderOAuthClients() {
  if (!el.oauthClientsList) return;
  if (!state.oauthClients || state.oauthClients.length === 0) {
    el.oauthClientsList.innerHTML = `<div style="color:var(--muted);font-size:0.8rem;">No clients loaded.</div>`;
    return;
  }

  el.oauthClientsList.innerHTML = state.oauthClients
    .map(
      (c) => `
    <div class="client-item">
      <div class="client-title">${c.name} ${c.isFirstParty ? `<span class="badge" style="margin-left:0.4rem;">1st-Party</span>` : ""}</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:0.4rem;">${c.description || ""}</div>
      <div class="client-meta">client_id: ${c.clientId}</div>
      <div class="client-meta">allowed_scopes: ${(c.allowedScopes || []).join(" ")}</div>
    </div>
  `,
    )
    .join("");
}

// Browser-native PKCE SHA-256 implementation
async function generatePkce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const codeVerifier = Array.from(bytes)
    .map((b) => ("00" + b.toString(16)).slice(-2))
    .join("");

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = btoa(String.fromCharCode.apply(null, hashArray));
  const codeChallenge = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return { codeVerifier, codeChallenge };
}

async function simulateAgentOAuthPkce() {
  if (!el.oauthSimOutput) return;
  el.oauthSimOutput.hidden = false;
  el.oauthSimOutput.textContent = "Initiating Weaver 1M Agent PKCE Authorization Flow...\n";

  try {
    const { codeVerifier, codeChallenge } = await generatePkce();
    el.oauthSimOutput.textContent += `[Step 1] Generated PKCE Code Verifier: ${codeVerifier.slice(0, 16)}...\n`;
    el.oauthSimOutput.textContent += `[Step 1] SHA-256 Code Challenge: ${codeChallenge}\n`;

    const clientId = "weaver-agent-runner";
    const redirectUri = "http://localhost:3000/oauth/callback";
    const scope = "read:tasks write:tasks tasks:refactor";

    el.oauthSimOutput.textContent += `[Step 2] Requesting Authorization Code from /oauth/authorize/decision...\n`;
    const authRes = await api("POST", "/oauth/authorize/decision", {
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state: "state_" + Math.random().toString(36).slice(2, 8),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      approved: "true",
    });

    const code = authRes.code;
    el.oauthSimOutput.textContent += `[Step 2] Authorization Code Granted: ${code.slice(0, 20)}...\n`;

    el.oauthSimOutput.textContent += `[Step 3] Exchanging Code & Verifier at /oauth/token...\n`;
    const tokenRes = await api("POST", "/oauth/token", {
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    el.oauthSimOutput.textContent += `[Step 3] Access Token Issued: ${tokenRes.access_token.slice(0, 22)}... (expires in ${tokenRes.expires_in}s)\n`;
    el.oauthSimOutput.textContent += `[Step 3] Refresh Token Issued: ${tokenRes.refresh_token.slice(0, 22)}...\n`;

    el.oauthSimOutput.textContent += `[Step 4] Fetching User Claims with Bearer Token from /oauth/userinfo...\n`;
    const userinfo = await fetch("/oauth/userinfo", {
      headers: { authorization: `Bearer ${tokenRes.access_token}` },
    }).then((r) => r.json());

    el.oauthSimOutput.textContent += `[Step 4] Verified UserInfo: ${JSON.stringify(userinfo, null, 2)}\n\n`;
    el.oauthSimOutput.textContent += `✓ 1st-Party Proprietary OAuth 2.0 PKCE Handshake Complete & Verified!`;
    toast("OAuth PKCE Flow Successfully Simulated!");
  } catch (err) {
    el.oauthSimOutput.textContent += `\nError during OAuth flow: ${err.message}`;
    toast(err.message);
  }
}

/* ── Weaver 1M Benchmark Suite Modal ───────────────────── */

async function openBenchmarkModal() {
  if (el.benchmarkModal) el.benchmarkModal.hidden = false;
  try {
    const stats = await api("GET", "/api/curriculum/benchmark");
    if (el.benchTotalTasks) el.benchTotalTasks.textContent = stats.totalTasks || 12;
  } catch {}
}

function closeBenchmarkModal() {
  if (el.benchmarkModal) el.benchmarkModal.hidden = true;
}

async function runFullBenchmarkUI() {
  if (!el.btnRunFullBenchmark) return;
  const originalText = el.btnRunFullBenchmark.textContent;
  el.btnRunFullBenchmark.disabled = true;
  el.btnRunFullBenchmark.textContent = "Running Benchmark Suite...";

  try {
    const data = await api("POST", "/api/curriculum/benchmark/run-all");
    const { summary, results } = data;

    if (el.benchTotalTasks) el.benchTotalTasks.textContent = summary.totalTasks;
    if (el.benchPassRate) el.benchPassRate.textContent = summary.passRate;
    if (el.benchAvgScore) el.benchAvgScore.textContent = `${summary.averageScore}%`;
    if (el.benchAvgDuration) el.benchAvgDuration.textContent = `${summary.averageDurationMs}ms`;

    if (el.benchTableBody) {
      el.benchTableBody.innerHTML = results
        .map(
          (r) => `
        <tr>
          <td>${escapeHtml(r.title)}</td>
          <td><span class="tag-pill">${escapeHtml(r.category)}</span></td>
          <td><span class="badge">${escapeHtml(r.difficulty)}</span></td>
          <td>${r.durationMs}ms</td>
          <td>${r.score}%</td>
          <td style="color:${r.passed ? "#10b981" : "#ef4444"};font-weight:600;">
            ${r.passed ? "PASSED" : "FAILED"}
          </td>
        </tr>
      `,
        )
        .join("");
    }

    toast(`Benchmark complete: ${summary.passedTasks}/${summary.totalTasks} passed (${summary.averageScore}%)`);
  } catch (err) {
    toast(`Benchmark error: ${err.message}`);
  } finally {
    el.btnRunFullBenchmark.disabled = false;
    el.btnRunFullBenchmark.textContent = originalText;
  }
}

async function downloadBenchmarkMarkdown() {
  try {
    const res = await fetch("/api/curriculum/benchmark?format=markdown");
    const md = await res.text();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weaver-1m-benchmark-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Downloaded Weaver Benchmark Report (Markdown).");
  } catch (err) {
    toast(`Failed to download report: ${err.message}`);
  }
}
/* ── Command Palette ─────────────────────────────────────── */

const commands = [
  { label: "New task", hint: "N", run: () => el.input?.focus() },
  { label: "Toggle theme", hint: "T", run: toggleTheme },
  { label: "Weaver Refactoring Curriculum", hint: "R", run: seedCurriculum },
  { label: "Weaver 1M Benchmark Suite", hint: "B", run: openBenchmarkModal },
  { label: "OAuth 2.0 Applications & Simulator", hint: "O", run: openOAuthModal },
  { label: "Switch to Today board", hint: "", run: () => switchBoard("board_today") },
  { label: "Switch to Weaver Refactoring board", hint: "", run: () => switchBoard("board_refactor_curriculum") },
  { label: "New Board...", hint: "", run: createBoardPrompt },
  { label: "Sign In / Switch User", hint: "", run: openAuthModal },
  { label: "Show all tasks", hint: "1", run: () => setFilter("all") },
  { label: "Show active tasks", hint: "2", run: () => setFilter("active") },
  { label: "Show completed tasks", hint: "3", run: () => setFilter("done") },
  { label: "Show refactoring tasks", hint: "4", run: () => setFilter("refactor") },
  { label: "Clear completed tasks", hint: "", run: clearCompleted },
  { label: "Export as JSON", hint: "", run: exportJSON },
  { label: "Copy summary", hint: "", run: copySummary },
];

function renderPalette(query) {
  if (!el.paletteList) return;
  const q = query.trim().toLowerCase();
  state.matches = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands.slice();
  state.activeCommandIdx = clamp(state.activeCommandIdx, 0, Math.max(state.matches.length - 1, 0));

  el.paletteList.replaceChildren(
    ...state.matches.map((command, index) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(index === state.activeCommandIdx));

      const label = document.createElement("span");
      label.textContent = command.label;
      li.append(label);

      if (command.hint) {
        const hint = document.createElement("span");
        hint.className = "hint";
        hint.textContent = command.hint;
        li.append(hint);
      }

      li.addEventListener("mouseenter", () => {
        if (state.activeCommandIdx === index) return;
        state.activeCommandIdx = index;
        renderPalette(el.paletteInput.value);
      });
      li.addEventListener("click", () => runCommand(command));
      return li;
    }),
  );
}

function openPalette() {
  state.paletteOpen = true;
  state.activeCommandIdx = 0;
  if (el.palette) el.palette.hidden = false;
  if (el.paletteInput) {
    el.paletteInput.value = "";
    renderPalette("");
    el.paletteInput.focus();
  }
}

function closePalette() {
  state.paletteOpen = false;
  if (el.palette) el.palette.hidden = true;
}

function runCommand(command) {
  closePalette();
  command.run();
}

/* ── Export & Summary ────────────────────────────────────── */

function exportJSON() {
  const payload = {
    exportedAt: new Date().toISOString(),
    boards: state.boards,
    tasks: state.tasks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `loom-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast("Exported state as JSON.");
}

async function copySummary() {
  const inBoard = state.tasks.filter((t) => t.boardId === state.activeBoardId);
  if (inBoard.length === 0) return toast("Nothing to summarise.");
  const done = inBoard.filter((t) => t.done);
  const lines = [
    `Board: ${currentBoard()?.name || "Tasks"} — ${done.length}/${inBoard.length} done`,
    ...inBoard.map((t) => `${t.done ? "[x]" : "[ ]"} ${t.title}`),
  ];
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    toast("Summary copied to clipboard.");
  } catch {
    toast("Clipboard unavailable in this environment.");
  }
}

/* ── SSE Live Event Stream ───────────────────────────────── */

function connectEvents() {
  if (typeof EventSource === "undefined") return;
  const es = new EventSource("/api/events");
  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "state") {
        loadInitialState(false);
      }
    } catch {}
  };
  es.onerror = () => {
    es.close();
    setTimeout(connectEvents, 5000);
  };
}

/* ── Wiring Event Listeners ──────────────────────────────── */

el.form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = el.input?.value?.trim();
  if (!title) return el.input?.focus();
  const priority = el.prioritySelect?.value ?? 0;
  if (el.input) el.input.value = "";
  addTask(title, priority);
  el.input?.focus();
});

el.input?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    el.input.value = "";
    el.input.blur();
  }
});

el.clear?.addEventListener("click", clearCompleted);
el.theme?.addEventListener("click", toggleTheme);
el.btnAddBoard?.addEventListener("click", createBoardPrompt);
el.btnCurriculum?.addEventListener("click", seedCurriculum);
el.userPill?.addEventListener("click", openAuthModal);
el.btnOAuthPortal?.addEventListener("click", openOAuthModal);

for (const button of el.filters) {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
}

el.searchInput?.addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  state.cursor = -1;
  renderTasks();
});

// Refactor Modal Wiring
el.btnCloseRefactor?.addEventListener("click", closeRefactorModal);
document.querySelectorAll(".code-tab").forEach((btn) => {
  btn.addEventListener("click", () => switchRefactorTab(btn.dataset.tab));
});
el.btnRunVerify?.addEventListener("click", runRefactorVerification);
el.btnLoadSolution?.addEventListener("click", () => {
  if (state.currentRefactorTask?.refactorData?.solutionCode && el.refactorSubmitCode) {
    el.refactorSubmitCode.value = state.currentRefactorTask.refactorData.solutionCode;
  }
});

// Auth Modal Wiring
el.btnCloseAuth?.addEventListener("click", closeAuthModal);
el.tabLogin?.addEventListener("click", () => setAuthMode("login"));
el.tabRegister?.addEventListener("click", () => setAuthMode("register"));
el.authForm?.addEventListener("submit", handleAuthSubmit);
el.btnQuickWeaver?.addEventListener("click", () => quickSignIn("weaver", "weaver-agent-2026"));
el.btnQuickPp?.addEventListener("click", () => quickSignIn("pp", "curriculum-1m"));

// OAuth Modal Wiring
el.btnCloseOAuth?.addEventListener("click", closeOAuthModal);
el.btnSimulateOAuth?.addEventListener("click", simulateAgentOAuthPkce);
// Benchmark Modal Wiring
el.btnBenchmarkPortal?.addEventListener("click", openBenchmarkModal);
el.btnCloseBenchmark?.addEventListener("click", closeBenchmarkModal);
el.btnRunFullBenchmark?.addEventListener("click", runFullBenchmarkUI);
el.btnDownloadBenchmarkMd?.addEventListener("click", downloadBenchmarkMarkdown);

// Command palette wiring
el.palette?.addEventListener("mousedown", (event) => {
  if (event.target === el.palette) closePalette();
});

el.paletteInput?.addEventListener("input", () => {
  state.activeCommandIdx = 0;
  renderPalette(el.paletteInput.value);
});

el.paletteInput?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "Tab") {
    event.preventDefault();
    state.activeCommandIdx = clamp(state.activeCommandIdx + 1, 0, state.matches.length - 1);
    renderPalette(el.paletteInput.value);
  } else if (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)) {
    event.preventDefault();
    state.activeCommandIdx = clamp(state.activeCommandIdx - 1, 0, state.matches.length - 1);
    renderPalette(el.paletteInput.value);
  } else if (event.key === "Enter") {
    event.preventDefault();
    const command = state.matches[state.activeCommandIdx];
    if (command) runCommand(command);
  } else if (event.key === "Escape") {
    event.preventDefault();
    closePalette();
  }
});

// Global Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  const mod = event.metaKey || event.ctrlKey;

  if (mod && event.key.toLowerCase() === "k") {
    event.preventDefault();
    state.paletteOpen ? closePalette() : openPalette();
    return;
  }

  if (event.key === "Escape") {
    if (state.paletteOpen) closePalette();
    if (!el.refactorModal?.hidden) closeRefactorModal();
    if (!el.authModal?.hidden) closeAuthModal();
    if (!el.oauthModal?.hidden) closeOAuthModal();
    if (!el.benchmarkModal?.hidden) closeBenchmarkModal();
    return;
  }

  if (
    state.paletteOpen ||
    !el.refactorModal?.hidden ||
    !el.authModal?.hidden ||
    !el.oauthModal?.hidden ||
    !el.benchmarkModal?.hidden ||
    isTyping(event.target) ||
    state.editing
  ) {
    return;
  }

  switch (event.key) {
    case "n":
    case "N":
      event.preventDefault();
      el.input?.focus();
      break;
    case "/":
      event.preventDefault();
      el.searchInput?.focus();
      break;
    case "t":
    case "T":
      event.preventDefault();
      toggleTheme();
      break;
    case "r":
    case "R": {
      event.preventDefault();
      const curr = cursorTask();
      if (curr && curr.refactorData) {
        openRefactorModal(curr);
      } else {
        seedCurriculum();
      }
      break;
    }
    case "b":
    case "B":
      event.preventDefault();
      openBenchmarkModal();
      break;
    case "o":
    case "O":
      event.preventDefault();
      openOAuthModal();
      break;
    case "1":
      setFilter("all");
      break;
    case "2":
      setFilter("active");
      break;
    case "3":
      setFilter("done");
      break;
    case "4":
      setFilter("refactor");
      break;
    case "j":
    case "ArrowDown":
      event.preventDefault();
      moveCursor(1);
      break;
    case "k":
    case "ArrowUp":
      event.preventDefault();
      moveCursor(-1);
      break;
    case "x":
    case "X": {
      const task = cursorTask();
      if (task) {
        event.preventDefault();
        toggleTask(task);
      }
      break;
    }
    case "Backspace":
    case "Delete": {
      const task = cursorTask();
      if (task) {
        event.preventDefault();
        deleteTask(task);
      }
      break;
    }
    case "Enter": {
      const task = cursorTask();
      if (task) {
        event.preventDefault();
        startEdit(task);
      }
      break;
    }
  }
});

/* ── Boot ────────────────────────────────────────────────── */

if (el.date) {
  el.date.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

async function loadInitialState(shouldRerender = true) {
  try {
    const data = await api("GET", "/api/state");
    state.boards = Array.isArray(data.boards) ? data.boards : [];
    state.tasks = Array.isArray(data.tasks) ? data.tasks : [];
    state.user = data.user || null;
    state.oauthClients = Array.isArray(data.oauthClients) ? data.oauthClients : [];

    const urlParams = new URLSearchParams(window.location.search);
    const askedBoard = urlParams.get("board");
    if (askedBoard && state.boards.some((b) => b.id === askedBoard || b.slug === askedBoard)) {
      const found = state.boards.find((b) => b.id === askedBoard || b.slug === askedBoard);
      state.activeBoardId = found.id;
    } else if (!state.boards.some((b) => b.id === state.activeBoardId)) {
      state.activeBoardId = state.boards[0]?.id || "board_today";
    }

    if (shouldRerender) render();
  } catch (err) {
    // Fallback: load /api/tasks directly
    try {
      const { tasks } = await api("GET", "/api/tasks");
      state.tasks = tasks || [];
      render();
    } catch {
      render();
      toast("Could not reach the server.");
    }
  }
}

loadInitialState();
connectEvents();

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const progressWrap = document.getElementById("progressWrap");
const progressEl = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const result = document.getElementById("result");
const fileListEl = document.getElementById("fileList");
const beatsListEl = document.getElementById("beatsList");

// backend origin (e.g. http://localhost:3000) — prefer window.API_BASE if provided
const BACKEND_ROOT = window.API_BASE ? window.API_BASE : window.location.origin;
// beats API base (used for object/list/upload endpoints)
const API_BASE = BACKEND_ROOT.endsWith("/beats")
  ? BACKEND_ROOT
  : `${BACKEND_ROOT}/beats`;

let player = new Audio();
let currentPlayingKey = null;

let selectedFile = null;

// debug info
console.debug("upload.js init", {
  BACKEND_ROOT,
  API_BASE,
  frontendOrigin: window.location.origin,
});

// show JS errors in-page for easier debugging
window.addEventListener("error", (e) => {
  const msg = `JS error: ${e.message} at ${e.filename}:${e.lineno}`;
  console.error(msg, e.error);
  if (fileListEl) fileListEl.innerHTML = `<div class="muted">${msg}</div>`;
  if (beatsListEl) beatsListEl.innerHTML = `<div class="muted">${msg}</div>`;
});

// (debug UI removed) keep console.debug for dev use

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  dropzone.textContent = selectedFile
    ? selectedFile.name
    : "Drag & drop a file here or click to select";
});

["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  }),
);
["dragleave", "drop", "dragend"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  }),
);

dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) {
    selectedFile = f;
    fileInput.files = e.dataTransfer.files;
    dropzone.textContent = f.name;
  }
});

uploadBtn.addEventListener("click", () => {
  if (!selectedFile) {
    result.textContent = "Please choose a file first.";
    return;
  }
  uploadFile(selectedFile);
});

function uploadFile(file) {
  const url = window.UPLOAD_URL
    ? window.UPLOAD_URL
    : window.API_BASE
      ? `${window.API_BASE}/beats/upload-audio`
      : `${window.location.origin}/beats/upload-audio`;
  const form = new FormData();
  form.append("audio", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressWrap.hidden = false;
      progressEl.value = percent;
      progressText.textContent = percent + "%";
    }
  };

  xhr.onload = () => {
    progressWrap.hidden = true;
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const json = JSON.parse(xhr.responseText);
        result.innerHTML = `<div>Uploaded: <a href="${API_BASE}/object/${encodeURIComponent(
          json.fileName,
        )}" target="_blank">${json.fileName}</a></div>`;
        // refresh list after successful upload
        refreshList();
      } catch (err) {
        result.textContent = "Upload succeeded.";
      }
    } else {
      result.textContent =
        "Upload failed: " + xhr.status + " " + xhr.statusText;
    }
  };

  xhr.onerror = () => {
    progressWrap.hidden = true;
    result.textContent = "Upload failed (network error)";
  };
  xhr.send(form);
}

// Fetch and render file list
async function refreshList() {
  try {
    const url = `${API_BASE}/list`;
    console.debug("refreshList: fetching", url);
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text().catch(() => "(no body)");
      const msg = `list fetch failed: ${resp.status} ${resp.statusText} - ${body}`;
      console.error(msg);
      if (fileListEl) fileListEl.innerHTML = `<div class="muted">${msg}</div>`;
      return;
    }
    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await resp.text().catch(() => "(no body)");
      const msg = `list returned unexpected content-type: ${contentType} - body: ${text.slice(0, 200)}`;
      console.error(msg);
      if (fileListEl) fileListEl.innerHTML = `<div class="muted">${msg}</div>`;
      return;
    }
    const json = await resp.json();
    const items = json.items || [];
    renderList(items);
  } catch (err) {
    console.error("refreshList error:", err);
    const m = err && err.message ? err.message : String(err);
    if (fileListEl)
      fileListEl.innerHTML = `<div class="muted">Could not load list: ${m}</div>`;
  }
}

function renderList(items) {
  if (!items || items.length === 0) {
    fileListEl.innerHTML = '<div class="muted">No files uploaded yet.</div>';
    return;
  }

  fileListEl.innerHTML = "";
  items.forEach((it) => {
    const key = it.key || it.Key || it.name;
    const name = key;
    const size = it.size || it.Size || "-";

    const item = document.createElement("div");
    item.className = "file-item";

    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = `${name} - ${size} bytes`;

    const actions = document.createElement("div");
    actions.className = "file-actions";

    const playBtn = document.createElement("button");
    playBtn.className = "btn btn-secondary";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => onPlay(name, playBtn));

    const pauseBtn = document.createElement("button");
    pauseBtn.className = "btn btn-secondary";
    pauseBtn.textContent = "Pause";
    pauseBtn.addEventListener("click", () => onPause(name, pauseBtn));

    const downloadLink = document.createElement("a");
    downloadLink.className = "btn btn-secondary";
    downloadLink.textContent = "Download";
    downloadLink.href = `${API_BASE}/object/${encodeURIComponent(name)}`;
    downloadLink.setAttribute("download", name);
    downloadLink.target = "_blank";

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => onDelete(name, item));

    actions.appendChild(playBtn);
    actions.appendChild(pauseBtn);
    actions.appendChild(downloadLink);
    actions.appendChild(delBtn);

    item.appendChild(meta);
    item.appendChild(actions);
    fileListEl.appendChild(item);
  });
}

function onPlay(key, btn) {
  const src = `${API_BASE}/object/${encodeURIComponent(key)}`;
  if (currentPlayingKey !== key) {
    player.src = src;
    currentPlayingKey = key;
  }
  player.play().catch((err) => console.error("play error", err));
  // update buttons UI
  updatePlayButtons(key, true);
}

function onPause(key) {
  if (currentPlayingKey === key) {
    player.pause();
    updatePlayButtons(key, false);
  }
}

function updatePlayButtons(activeKey, isPlaying) {
  // toggle text on buttons to reflect state
  const items = Array.from(document.querySelectorAll(".file-item"));
  items.forEach((it) => {
    const meta = it.querySelector(".file-meta");
    const name = meta ? meta.textContent.split(" - ")[0] : null;
    const play = it.querySelector("button");
    if (!name || !play) return;
    if (name === activeKey) {
      play.textContent = isPlaying ? "Playing" : "Play";
    } else {
      play.textContent = "Play";
    }
  });
}

async function onDelete(key, itemEl) {
  if (!confirm(`Delete ${key}?`)) return;
  try {
    const resp = await fetch(`${API_BASE}/object/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    const json = await resp.json();
    if (resp.ok) {
      // remove element
      itemEl.remove();
    } else {
      alert(json.error || "Delete failed");
    }
  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
}

// load list on start
refreshList();

// Load beats metadata (from DB) and render in the new beatsList section
async function refreshBeats() {
  if (!beatsListEl) return;
  try {
    console.debug("refreshBeats: fetching", `${BACKEND_ROOT}/api/beats`);
    const resp = await fetch(`${BACKEND_ROOT}/api/beats`);
    if (!resp.ok) {
      const body = await resp.text().catch(() => "(no body)");
      throw new Error(`${resp.status} ${resp.statusText} - ${body}`);
    }
    const json = await resp.json();
    const items = json.items || [];

    // Also fetch uploaded objects from R2 and merge any that are not present in DB
    let listItems = [];
    try {
      const listResp = await fetch(`${API_BASE}/list`);
      if (listResp.ok) {
        const listJson = await listResp.json();
        listItems = listJson.items || [];
      } else {
        console.warn("could not fetch object list", listResp.status);
      }
    } catch (e) {
      console.warn("list fetch failed", e);
    }

    // map existing audio_url values for quick lookup
    const dbKeys = new Set((items || []).map((b) => b.audio_url));
    const synthetic = (listItems || [])
      .map((it) => ({
        key: it.key || it.Key || it.name,
        size: it.size || it.Size || 0,
      }))
      .filter((it) => it.key && !dbKeys.has(it.key))
      .map((it) => ({ beat_name: it.key, audio_url: it.key, _size: it.size }));

    const combined = items.concat(synthetic);

    // debug UI removed; keep info in console
    console.debug(`refreshBeats: db=${items.length} uploaded=${listItems.length} combined=${combined.length}`);

    renderBeats(combined);
  } catch (err) {
    console.error("refreshBeats error:", err);
    const m = err && err.message ? err.message : String(err);
    beatsListEl.innerHTML = `<div class="muted">Could not load beats: ${m}</div>`;
  }
}

function renderBeats(items) {
  if (!beatsListEl) return;
  if (!items || items.length === 0) {
    beatsListEl.innerHTML = '<div class="muted">No beats found.</div>';
    return;
  }
  beatsListEl.innerHTML = "";
  items.forEach((b) => {
    const audioUrl = b.audio_url || b.fileName || b.key || "";
    const displayName = b.beat_name || b.title || b.created_at || audioUrl;
    const item = document.createElement("div");
    item.className = "file-item";
    item.dataset.key = audioUrl;

    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = `${displayName} - ${b.artist_name || b.artist || "Unknown"} ${b.created_at ? "- " + b.created_at : ""}`;

    const actions = document.createElement("div");
    actions.className = "file-actions";

    const playBtn = document.createElement("button");
    playBtn.className = "btn btn-secondary play-btn";
    playBtn.textContent = "Play";
    const src =
      audioUrl.startsWith("http://") || audioUrl.startsWith("https://")
        ? audioUrl
        : `${API_BASE}/object/${encodeURIComponent(audioUrl)}`;
    playBtn.addEventListener("click", () => onPlay(audioUrl, src));

    const pauseBtn = document.createElement("button");
    pauseBtn.className = "btn btn-secondary pause-btn";
    pauseBtn.textContent = "Pause";
    pauseBtn.addEventListener("click", () => onPause(audioUrl));

    const downloadLink = document.createElement("a");
    downloadLink.className = "btn btn-secondary download-link";
    downloadLink.textContent = "Download";
    downloadLink.href = src;
    downloadLink.setAttribute("download", displayName);
    downloadLink.target = "_blank";

    actions.appendChild(playBtn);
    actions.appendChild(pauseBtn);
    actions.appendChild(downloadLink);

    item.appendChild(meta);
    item.appendChild(actions);
    beatsListEl.appendChild(item);
  });
}

// initial load of beats
refreshBeats();

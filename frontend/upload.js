const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const progressWrap = document.getElementById("progressWrap");
const progressEl = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const result = document.getElementById("result");
const fileListEl = document.getElementById("fileList");

const API_BASE = window.API_BASE || "http://localhost:3000/beats";

let player = new Audio();
let currentPlayingKey = null;

let selectedFile = null;

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
    : "http://localhost:3000/beats/upload-audio";
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
    const resp = await fetch(`${API_BASE}/list`);
    const json = await resp.json();
    const items = json.items || [];
    renderList(items);
  } catch (err) {
    console.error(err);
    fileListEl.innerHTML = '<div class="muted">Could not load list.</div>';
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

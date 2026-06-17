const API_BASE = window.API_BASE || window.location.origin;

async function postJSON(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

// Create user
document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = Object.fromEntries(new FormData(form));
  const res = await postJSON(`${API_BASE}/api/users`, body);
  document.getElementById("userResult").textContent = JSON.stringify(res);
  form.reset();
  await refreshUsers();
});

// Create artist
document.getElementById("artistForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = Object.fromEntries(new FormData(form));
  const res = await postJSON(`${API_BASE}/api/artists`, body);
  document.getElementById("artistResult").textContent = JSON.stringify(res);
  form.reset();
  await refreshArtists();
  await refreshArtistsList();
});

// Upload beat: first upload audio, then create beat metadata
document.getElementById("beatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const audioFile = document.getElementById("audioFile").files[0];
  if (!audioFile)
    return (document.getElementById("beatResult").textContent =
      "Select audio file first");

  // upload audio to backend R2 via existing endpoint
  const upForm = new FormData();
  upForm.append("audio", audioFile);
  const upResp = await fetch(`${API_BASE}/beats/upload-audio`, {
    method: "POST",
    body: upForm,
  });
  const upJson = await upResp.json();
  if (!upJson || !upJson.fileName)
    return (document.getElementById("beatResult").textContent =
      JSON.stringify(upJson));

  // helper to upload image files
  async function uploadImageFile(file) {
    if (!file) return null;
    const f = new FormData();
    f.append("image", file);
    const r = await fetch(`${API_BASE}/beats/upload-image`, {
      method: "POST",
      body: f,
    });
    const j = await r.json();
    if (j && j.fileName) return j.fileName;
    return null;
  }

  // upload cover/banner images in parallel
  const coverFile = document.getElementById("coverFile").files[0];
  const bannerFile = document.getElementById("bannerFile").files[0];
  const [coverKey, bannerKey] = await Promise.all([
    uploadImageFile(coverFile),
    uploadImageFile(bannerFile),
  ]);

  // assemble beat metadata
  const meta = Object.fromEntries(data.entries());
  meta.audio_url = upJson.fileName; // store key
  if (coverKey) meta.cover_image_url = coverKey;
  if (bannerKey) meta.banner_image_url = bannerKey;

  // if artist not selected, allow artist_name field
  const res = await postJSON(`${API_BASE}/api/beats/create`, meta);
  document.getElementById("beatResult").textContent = JSON.stringify(res);
  form.reset();
  document.getElementById("audioFile").value = null;
  document.getElementById("coverFile").value = null;
  document.getElementById("bannerFile").value = null;
  await refreshBeatsList();
});

async function fetchJSON(url) {
  const r = await fetch(url);
  return r.json();
}

async function refreshUsers() {
  try {
    const json = await fetchJSON(`${API_BASE}/api/users`);
    const el = document.getElementById("usersList");
    el.innerHTML = "";
    (json.items || []).forEach((u) => {
      const node = document.createElement("div");
      node.className = "file-item";
      node.innerHTML = `<div><strong>${u.name}</strong> <div class="file-meta">${u.email || ""} - ${u.mobile || ""}</div></div>`;
      el.appendChild(node);
    });
  } catch (err) {
    console.error(err);
  }
}

async function refreshArtistsList() {
  try {
    const json = await fetchJSON(`${API_BASE}/api/artists`);
    const el = document.getElementById("artistsList");
    el.innerHTML = "";
    (json.items || []).forEach((a) => {
      const node = document.createElement("div");
      node.className = "file-item";
      node.innerHTML = `<div><strong>${a.artist_name}</strong> <div class="file-meta">${a.email || ""} - ${a.mobile || ""}</div></div>`;
      el.appendChild(node);
    });
  } catch (err) {
    console.error(err);
  }
}

async function refreshBeatsList() {
  try {
    const json = await fetchJSON(`${API_BASE}/api/beats`);
    const el = document.getElementById("beatsList");
    el.innerHTML = "";
    (json.items || []).forEach((b) => {
      const node = document.createElement("div");
      node.className = "file-item";
      node.innerHTML = `<div><strong>${b.beat_name}</strong> <div class="file-meta">by ${b.artist_name || "Unknown"} - ${b.genre || "-"} - ${b.bpm || "-"} BPM - ${b.selling_status || "-"}</div></div><div class="file-actions"><button class="btn-secondary">Play</button></div>`;
      const playBtn = node.querySelector("button");
      playBtn.addEventListener("click", () => {
        const audio = new Audio(
          `${API_BASE}/beats/object/${encodeURIComponent(b.audio_url)}`,
        );
        audio.play();
      });
      el.appendChild(node);
    });
  } catch (err) {
    console.error(err);
  }
}

// initial lists
refreshUsers();
refreshArtistsList();
refreshBeatsList();

async function refreshArtists() {
  const sel = document.getElementById("artistSelect");
  sel.innerHTML = "<option value=''>-- choose artist --</option>";
  try {
    const resp = await fetch(`${API_BASE}/api/artists`);
    const json = await resp.json();
    (json.items || []).forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.artist_name + (a.email ? ` (${a.email})` : "");
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

refreshArtists();

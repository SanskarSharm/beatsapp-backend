const API_BASE = window.API_BASE || "http://localhost:3000";

async function fetchJSON(url) {
  const r = await fetch(url);
  return r.json();
}

async function refreshBuyers() {
  const sel = document.getElementById("buyerSelect");
  sel.innerHTML = "<option value=''>-- choose user --</option>";
  try {
    const json = await fetchJSON(`${API_BASE}/api/users`);
    (json.items || []).forEach((u) => {
      const o = document.createElement("option");
      o.value = u.id;
      o.textContent = `${u.name} (${u.email || "no-email"})`;
      sel.appendChild(o);
    });
  } catch (err) {
    console.error(err);
  }
}

function renderBeats(items) {
  const grid = document.getElementById("beatsGrid");
  grid.innerHTML = "";
  if (!items || items.length === 0)
    return (grid.innerHTML = '<div class="muted">No beats</div>');
  items.forEach((b) => {
    const card = document.createElement("div");
    card.className = "file-item";
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.gap = "12px";
    let imgHtml;
    if (b.cover_image_url) {
      const src = b.cover_image_url.startsWith("http")
        ? b.cover_image_url
        : `${API_BASE}/beats/object/${encodeURIComponent(b.cover_image_url)}`;
      imgHtml = `<img src="${src}" style="width:72px;height:72px;border-radius:6px;object-fit:cover"/>`;
    } else {
      imgHtml = `<div style="width:72px;height:72px;border-radius:6px;background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:center;color:var(--muted)">No image</div>`;
    }
    left.innerHTML = `${imgHtml}<div><div><strong>${b.beat_name}</strong> <span class="muted">by ${b.artist_name || "Unknown"}</span></div><div class="file-meta">Genre: ${b.genre || "-"} - BPM: ${b.bpm || "-"} - Price: ${b.price || "Free"}</div><div class="file-meta">Duration: ${b.duration || "-"}s - Mood: ${b.mood || "-"}</div></div>`;
    const actions = document.createElement("div");
    actions.className = "file-actions";
    const playBtn = document.createElement("button");
    playBtn.className = "btn-secondary";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => {
      const audio = new Audio(
        `${API_BASE}/beats/object/${encodeURIComponent(b.audio_url)}`,
      );
      audio.play();
    });
    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = b.selling_status === "sold" ? "Sold" : "Buy";
    buyBtn.disabled = b.selling_status === "sold";
    buyBtn.addEventListener("click", () => buyBeat(b.id));
    actions.appendChild(playBtn);
    actions.appendChild(buyBtn);

    card.appendChild(left);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}

async function refreshBeats() {
  const json = await fetchJSON(`${API_BASE}/api/beats`);
  renderBeats(json.items || []);
}

async function refreshPurchases() {
  const json = await fetchJSON(`${API_BASE}/api/purchases`);
  const el = document.getElementById("purchasesList");
  el.innerHTML = "";
  (json.items || []).forEach((p) => {
    const d = document.createElement("div");
    d.className = "file-item";
    d.innerHTML = `<div>${p.beat_name} — ${p.user_name} <span class="muted">(${p.purchased_at})</span></div><div class="file-meta">Price: ${p.purchase_price || "-"}</div>`;
    el.appendChild(d);
  });
}

async function buyBeat(beatId) {
  const buyer = document.getElementById("buyerSelect").value;
  if (!buyer) return alert("Select a buyer first");
  const resp = await fetch(`${API_BASE}/api/purchases/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: buyer, beat_id: beatId }),
  });
  const j = await resp.json();
  if (j.success) {
    alert("Purchase successful");
    await refreshBeats();
    await refreshPurchases();
  } else {
    alert("Purchase failed: " + (j.error || JSON.stringify(j)));
  }
}

async function init() {
  await refreshBuyers();
  await refreshBeats();
  await refreshPurchases();
}

init();

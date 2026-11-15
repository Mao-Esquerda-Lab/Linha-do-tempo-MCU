(() => {
  const KEY = "mcu-assistidos";
  const $ = (id) => document.getElementById(id);
  const items = window.MCU.map((m, i) => ({ ...m, pos: i }));
  let watched = new Set();
  try { watched = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...watched])); } catch (e) {} };

  [...new Set(items.map((i) => i.fase))].sort().forEach((f) => {
    const o = document.createElement("option");
    o.value = f; o.textContent = "Fase " + f; $("phase").appendChild(o);
  });

  let view = "list";
  const tipoNome = { filme: "Filme", serie: "Série", especial: "Especial" };

  function render() {
    const order = $("order").value, st = $("status").value, tp = $("type").value;
    const ph = $("phase").value, q = $("search").value.trim().toLowerCase();
    let list = items.slice();
    if (order === "lanc") list.sort((a, b) => a.lancamento - b.lancamento || a.pos - b.pos);
    list = list.filter((i) =>
      (st === "all" || (st === "done") === watched.has(i.id)) &&
      (tp === "all" || i.tipo === tp) &&
      (ph === "all" || String(i.fase) === ph) &&
      (!q || i.titulo.toLowerCase().includes(q)));

    $("list").hidden = view !== "list";
    $("timeline").hidden = view !== "line";
    if (view === "line") renderTimeline(list, order);
    $("list").innerHTML = "";
    if (view === "list") list.forEach((i) => {
      const li = document.createElement("li");
      const done = watched.has(i.id);
      li.className = "item" + (done ? " done" : "");
      li.innerHTML = `
        <label>
          <input type="checkbox" ${done ? "checked" : ""}>
          <span class="check"></span>
          ${i.poster ? `<img class="poster" loading="lazy" alt="" src="https://image.tmdb.org/t/p/w154${i.poster}">` : '<span class="poster ph"></span>'}
          <span class="info">
            <strong></strong>
            <small>${order === "cron" ? i.ano : "Lançado em " + i.lancamento}
              · <em class="tag ${i.tipo}">${tipoNome[i.tipo]}</em> · Fase ${i.fase}</small>
          </span>
        </label>`;
      li.querySelector("strong").textContent = i.titulo;
      li.querySelector("input").addEventListener("change", (e) => {
        e.target.checked ? watched.add(i.id) : watched.delete(i.id);
        save(); render();
      });
      $("list").appendChild(li);
    });
    if (view === "list" && !list.length) $("list").innerHTML = '<li class="empty">Nada encontrado.</li>';

    const total = items.length, n = items.filter((i) => watched.has(i.id)).length;
    $("fill").style.width = (n / total) * 100 + "%";
    $("count").textContent = `${n} de ${total} assistidos (${Math.round((n / total) * 100)}%)`;
  }

  function renderTimeline(list, order) {
    const t = $("timeline");
    const keep = t.scrollLeft;
    t.innerHTML = "";
    if (!list.length) { t.innerHTML = '<p class="empty">Nada encontrado.</p>'; return; }
    const track = document.createElement("div");
    track.className = "track";
    list.forEach((i, n) => {
      const done = watched.has(i.id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "node " + (n % 2 ? "down" : "up") + (done ? " done" : "");
      b.title = i.titulo + (done ? " — assistido" : "");
      b.setAttribute("aria-pressed", done);
      b.innerHTML = `
        <span class="card">
          <span class="when">${order === "cron" ? i.ano : i.lancamento}</span>
          ${i.poster ? `<img loading="lazy" alt="" src="https://image.tmdb.org/t/p/w185${i.poster}">` : '<span class="ph"></span>'}
          <span class="name"></span>
        </span>
        <span class="dot"></span>`;
      b.querySelector(".name").textContent = i.titulo;
      b.addEventListener("click", () => {
        done ? watched.delete(i.id) : watched.add(i.id);
        save(); render();
      });
      track.appendChild(b);
    });
    t.appendChild(track);
    t.scrollLeft = keep;
  }

  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    view = b.dataset.view;
    document.querySelectorAll("[data-view]").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }));

  ["order", "status", "type", "phase"].forEach((id) => $(id).addEventListener("change", render));
  $("search").addEventListener("input", render);
  $("reset").addEventListener("click", () => {
    if (confirm("Desmarcar todos os títulos?")) { watched.clear(); save(); render(); }
  });
  render();
})();

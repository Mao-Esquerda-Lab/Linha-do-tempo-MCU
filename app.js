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

    $("list").innerHTML = "";
    list.forEach((i) => {
      const li = document.createElement("li");
      const done = watched.has(i.id);
      li.className = "item" + (done ? " done" : "");
      li.innerHTML = `
        <label>
          <input type="checkbox" ${done ? "checked" : ""}>
          <span class="check"></span>
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
    if (!list.length) $("list").innerHTML = '<li class="empty">Nada encontrado.</li>';

    const total = items.length, n = items.filter((i) => watched.has(i.id)).length;
    $("fill").style.width = (n / total) * 100 + "%";
    $("count").textContent = `${n} de ${total} assistidos (${Math.round((n / total) * 100)}%)`;
  }

  ["order", "status", "type", "phase"].forEach((id) => $(id).addEventListener("change", render));
  $("search").addEventListener("input", render);
  $("reset").addEventListener("click", () => {
    if (confirm("Desmarcar todos os títulos?")) { watched.clear(); save(); render(); }
  });
  render();
})();

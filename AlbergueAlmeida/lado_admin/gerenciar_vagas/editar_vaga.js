// editar_vaga.js
(function () {
  const API_LISTAR_QUARTOS = "../gerenciar_quartos/api/listar_quartos.php"; // reuse
  const API_CARREGAR = "api/carregar_vaga.php";
  const API_SALVAR = "api/salvar_vaga.php";
  const API_BUSCAR_CARAC = "api/buscar_caracteristicas.php";
  const API_CRIA_CARAC = "api/criar_caracteristica.php";
  const API_VINCULAR = "api/vincular_caracteristica.php";
  const API_DESVINCULAR = "api/desvincular_caracteristica.php";

  const params = new URLSearchParams(window.location.search);
  const vagaId = params.get("vaga_id");
  const quartoParam = params.get("quarto_id");

  const quartoSelect = document.getElementById("quarto_id");
  const nomeEl = document.getElementById("nome");
  const adicionalEl = document.getElementById("adicional");
  const disponivelEl = document.getElementById("disponivel");
  const caracSearch = document.getElementById("carac-search");
  const suggestionsEl = document.getElementById("suggestions");
  const tagsContainer = document.getElementById("carac-tags");
  const form = document.getElementById("form-vaga");
  const vagaIdEl = document.getElementById("vaga_id");

  // estado local: array de {id, nome}
  let tags = [];

  // Lista de tags que foram vinculadas durante esta edição
  let vinculadasDuranteEdicao = [];

  window.addEventListener("load", () => {
    carregarQuartos().then(() => {
      if (quartoParam) quartoSelect.value = quartoParam;
      if (vagaId) carregarVaga(vagaId);
    });

    caracSearch.addEventListener("input", debounce(onSearch, 250));
    document.addEventListener("click", () => { suggestionsEl.style.display = "none"; });

    form.addEventListener("submit", onSubmit);

    // BOTÃO CANCELAR → desfaz vínculos novos e volta
    document.getElementById("btn-cancel").addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (vagaIdEl.value) {
        // desfazer vínculos criados nesta sessão
        await Promise.all(
          vinculadasDuranteEdicao.map(cid =>
            new Promise(resolve => {
              desvincularCaracteristica(vagaIdEl.value, cid, resolve);
            })
          )
        );
      }

      window.history.back();
    });
  });

  function carregarQuartos() {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", API_LISTAR_QUARTOS, true);
      xhr.onload = function () {
        const arr = JSON.parse(xhr.responseText);
        quartoSelect.innerHTML = "";
        arr.forEach(q => {
          const opt = document.createElement("option");
          opt.value = q.id;
          opt.text = q.titulo;
          quartoSelect.appendChild(opt);
        });
        resolve();
      };
      xhr.send();
    });
  }

  function carregarVaga(id) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_CARREGAR + "?id=" + encodeURIComponent(id), true);
    xhr.onload = function () {
      const v = JSON.parse(xhr.responseText);
      vagaIdEl.value = v.id;
      nomeEl.value = v.nome;
      adicionalEl.value = v.adicional;
      disponivelEl.checked = (v.disponivel == 1 || v.disponivel === true);
      quartoSelect.value = v.quarto_id;

      tags = Array.isArray(v.caracteristicas) ? v.caracteristicas.map(c => ({ id: c.id, nome: c.nome })) : [];
      renderTags();
    };
    xhr.send();
  }

  // busca de características
  function onSearch(e) {
    const q = e.target.value.trim();
    if (!q) { suggestionsEl.style.display = "none"; return; }

    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_BUSCAR_CARAC + "?q=" + encodeURIComponent(q), true);
    xhr.onload = function () {
      const arr = JSON.parse(xhr.responseText);
      suggestionsEl.innerHTML = "";
      if (arr.length === 0) {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = `Criar "${q}" e associar`;
        item.addEventListener("click", () => {
          criarCaracteristica(q, (newCarac) => {

            if (vagaIdEl.value) {
              vincularCaracteristica(vagaIdEl.value, newCarac.id, () => {
                tags.push(newCarac);
                vinculadasDuranteEdicao.push(newCarac.id); // novo vínculo
                renderTags();
              });
            } else {
              tags.push(newCarac);
              renderTags();
            }

            suggestionsEl.style.display = "none";
            caracSearch.value = "";
          });
        });
        suggestionsEl.appendChild(item);
      } else {
        arr.forEach(c => {
          const item = document.createElement("div");
          item.className = "suggestion-item";
          item.textContent = c.nome;
          item.addEventListener("click", () => {

            if (!tags.some(t => t.id == c.id)) {

              if (vagaIdEl.value) {
                vincularCaracteristica(vagaIdEl.value, c.id, () => {
                  tags.push({ id: c.id, nome: c.nome });

                  vinculadasDuranteEdicao.push(c.id); // registra novo vínculo

                  renderTags();
                });
              } else {
                tags.push({ id: c.id, nome: c.nome });
                renderTags();
              }
            }

            suggestionsEl.style.display = "none";
            caracSearch.value = "";
          });
          suggestionsEl.appendChild(item);
        });
      }
      suggestionsEl.style.display = "block";
    };
    xhr.send();
  }

  function criarCaracteristica(nome, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_CRIA_CARAC, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      const res = JSON.parse(xhr.responseText);
      if (res.id) cb({ id: res.id, nome: res.nome });
      else alert("Erro ao criar característica.");
    };
    xhr.send("nome=" + encodeURIComponent(nome) + "&tipo=vaga");
  }

  function vincularCaracteristica(vaga_id, carac_id, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_VINCULAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      cb && cb();
    };
    xhr.send("vaga_id=" + encodeURIComponent(vaga_id) + "&caracteristica_id=" + encodeURIComponent(carac_id));
  }

  function desvincularCaracteristica(vaga_id, carac_id, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_DESVINCULAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () { cb && cb(); };
    xhr.send("vaga_id=" + encodeURIComponent(vaga_id) + "&caracteristica_id=" + encodeURIComponent(carac_id));
  }

  function renderTags() {
    tagsContainer.innerHTML = "";
    tags.forEach(t => {
      const span = document.createElement("span");
      span.className = "tag";
      span.innerHTML = `${t.nome} <span class="remove" data-id="${t.id}">✕</span>`;
      tagsContainer.appendChild(span);
    });

    Array.from(tagsContainer.querySelectorAll(".remove")).forEach(el => {
      el.addEventListener("click", (ev) => {
        const cid = el.getAttribute("data-id");
        if (!cid) return;

        if (vagaIdEl.value) {
          desvincularCaracteristica(vagaIdEl.value, cid, () => {
            tags = tags.filter(x => x.id != cid);
            renderTags();
          });
        } else {
          tags = tags.filter(x => x.id != cid);
          renderTags();
        }
      });
    });
  }

  function onSubmit(e) {
    e.preventDefault();

    const payload = {
      id: vagaIdEl.value || "",
      quarto_id: quartoSelect.value,
      nome: nomeEl.value,
      adicional: adicionalEl.value,
      disponivel: disponivelEl.checked ? 1 : 0,
      caracteristicas: tags.map(t => t.id)
    };

    const params = Object.keys(payload).map(k => {
      return encodeURIComponent(k) + "=" + encodeURIComponent(typeof payload[k] === "object" ? JSON.stringify(payload[k]) : payload[k]);
    }).join("&");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_SALVAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      const res = JSON.parse(xhr.responseText);
      if (res.status === "OK") {
        alert("Vaga salva.");
        window.location.href = "gerenciar_vagas.html?quarto_id=" + encodeURIComponent(payload.quarto_id);
      } else {
        alert("Erro ao salvar: " + (res.erro || "desconhecido"));
      }
    };
    xhr.send(params);
  }

  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

})();

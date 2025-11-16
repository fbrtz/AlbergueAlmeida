// editar_quarto.js
(function(){
  const API_CARREGAR = "api/carregar_quarto.php";
  const API_SALVAR = "api/salvar_quarto.php";
  const API_LISTAR_CARAC = "api/listar_caracteristicas.php";
  const API_CRIAR_CARAC = "api/criar_caracteristica.php";
  const API_VINCULAR = "api/vincular_caracteristica_quarto.php";
  const API_DESVINCULAR = "api/desvincular_caracteristica_quarto.php";

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  const novo = params.get("novo");

  const quartoIdEl = document.getElementById("quarto_id");
  const tituloEl = document.getElementById("titulo");
  const descricaoEl = document.getElementById("descricao");
  const totalEl = document.getElementById("total_vagas");
  const precoEl = document.getElementById("preco_base");
  const imgEls = ["img0","img1","img2"].map(id => document.getElementById(id));
  const previewEls = ["preview0","preview1","preview2"].map(id => document.getElementById(id));

  const caracSearch = document.getElementById("carac-search");
  const suggestionsEl = document.getElementById("suggestions");
  const tagsContainer = document.getElementById("carac-tags");
  const form = document.getElementById("form-editar");
  const btnCancel = document.getElementById("btn-cancel");
  const pageTitle = document.getElementById("page-title");

  let tags = []; // {id, nome}
  let vinculadasDuranteEdicao = []; // ids vinculadas enquanto editando

  // Pré-visualização (Opção A)
  function ativarPreview(campo, preview) {
    const input = document.getElementById(campo);
    const img = document.getElementById(preview);

    const atualizarPreview = () => {
      const url = input.value.trim();
      if (!url) {
        img.src = "";
        img.style.display = "none";
        return;
      }
      img.src = url;
      img.style.display = "block";
      img.onerror = () => { img.style.display = "none"; };
    };

    input.addEventListener("input", atualizarPreview);
    return atualizarPreview; // devolve a função para chamar manualmente
  }

  // init
  window.addEventListener("load", () => {
    if (idParam) {
      quartoIdEl.value = idParam;
      loadQuarto(idParam);
      pageTitle.innerText = "Editar Quarto";
    } else if (novo) {
      pageTitle.innerText = "Novo Quarto";
    }

    // ativa os três previews e guarda as funções
    const previewsAtualizar = [
      ativarPreview("img0", "preview0"),
      ativarPreview("img1", "preview1"),
      ativarPreview("img2", "preview2")
    ];

    // tags autocomplete
    caracSearch.addEventListener("input", debounce(onSearch, 220));
    document.addEventListener("click", (ev) => {
      if (!suggestionsEl.contains(ev.target) && ev.target !== caracSearch) suggestionsEl.style.display = "none";
    });

    form.addEventListener("submit", onSubmit);
    btnCancel.addEventListener("click", onCancel);

    // guarda as funções para usar dentro do loadQuarto
    window.previewsAtualizar = previewsAtualizar;
  });

  function loadQuarto(id) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_CARREGAR + "?id=" + encodeURIComponent(id), true);
    xhr.onload = function() {
      if (xhr.status !== 200) { alert("Erro ao carregar quarto"); return; }
      const q = JSON.parse(xhr.responseText);
      if (q.erro) { alert(q.erro); return; }

      quartoIdEl.value = q.id;
      tituloEl.value = q.titulo || "";
      descricaoEl.value = q.descricao || "";
      totalEl.value = q.total_vagas || 0;
      precoEl.value = q.preco_base || 0;
      document.getElementById("img0").value = q.img0 || "";
      document.getElementById("img1").value = q.img1 || "";
      document.getElementById("img2").value = q.img2 || "";

      // **Chama os previews manualmente após preencher os campos**
      if (window.previewsAtualizar) {
        window.previewsAtualizar.forEach(fn => fn());
      }

      // fetch characteristics for this quarto
      const xhr2 = new XMLHttpRequest();
      xhr2.open("GET", "api/listar_caracteristicas_quarto.php?quarto_id=" + encodeURIComponent(id), true);
      xhr2.onload = function() {
        const arr = JSON.parse(xhr2.responseText);
        tags = Array.isArray(arr) ? arr.map(c => ({id: c.id, nome: c.nome})) : [];
        renderTags();
      };
      xhr2.send();
    };
    xhr.send();
  }

  // resto do código permanece igual (renderTags, onSearch, criarCaracteristica, vincular, desvincular, onCancel, onSubmit, debounce, escapeHtml)
  function renderTags(){
    tagsContainer.innerHTML = "";
    tags.forEach(t => {
      const span = document.createElement("span");
      span.className = "tag";
      span.innerHTML = `${escapeHtml(t.nome)} <span class="remove" data-id="${t.id}">✕</span>`;
      tagsContainer.appendChild(span);
    });
    Array.from(tagsContainer.querySelectorAll(".remove")).forEach(el => {
      el.style.cursor = "pointer";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const cid = el.getAttribute("data-id");
        if (!cid) return;
        if (quartoIdEl.value) {
          desvincular(quartoIdEl.value, cid, () => {
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

  function onSearch(e){
    const q = e.target.value.trim();
    if (!q) { suggestionsEl.style.display = "none"; return; }
    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_LISTAR_CARAC + "?q=" + encodeURIComponent(q) + "&tipo=quarto", true);
    xhr.onload = function(){
      if (xhr.status !== 200) return;
      const arr = JSON.parse(xhr.responseText);
      suggestionsEl.innerHTML = "";
      if (!arr || arr.length === 0) {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = `Criar "${q}" e associar`;
        item.addEventListener("click", () => {
          criarCaracteristica(q, (newCarac) => {
            if (quartoIdEl.value) {
              vincular(quartoIdEl.value, newCarac.id, () => {
                tags.push(newCarac);
                vinculadasDuranteEdicao.push(newCarac.id);
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
              if (quartoIdEl.value) {
                vincular(quartoIdEl.value, c.id, () => {
                  tags.push({id: c.id, nome: c.nome});
                  vinculadasDuranteEdicao.push(c.id);
                  renderTags();
                });
              } else {
                tags.push({id: c.id, nome: c.nome});
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
    xhr.open("POST", API_CRIAR_CARAC, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function() {
      if (xhr.status !== 200) { alert("Erro criar"); return; }
      const res = JSON.parse(xhr.responseText);
      if (res.id) cb({id: res.id, nome: res.nome});
      else alert("Erro ao criar característica");
    };
    xhr.send("nome=" + encodeURIComponent(nome) + "&tipo=quarto");
  }

  function vincular(quarto_id, carac_id, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_VINCULAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function(){ cb && cb(); };
    xhr.send("quarto_id=" + encodeURIComponent(quarto_id) + "&caracteristica_id=" + encodeURIComponent(carac_id));
  }

  function desvincular(quarto_id, carac_id, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_DESVINCULAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function(){ cb && cb(); };
    xhr.send("quarto_id=" + encodeURIComponent(quarto_id) + "&caracteristica_id=" + encodeURIComponent(carac_id));
  }

  async function onCancel(e) {
    e.preventDefault();
    const qid = quartoIdEl.value;
    if (qid && vinculadasDuranteEdicao.length) {
      await Promise.all(vinculadasDuranteEdicao.map(cid => new Promise(res => desvincular(qid, cid, res))));
    }
    window.history.back();
  }

  function onSubmit(e) {
    e.preventDefault();
    if (document.getElementById("img0").value.trim() === "") { alert("Imagem 1 obrigatória"); return; }

    const payload = {
      id: quartoIdEl.value || "",
      titulo: tituloEl.value,
      descricao: descricaoEl.value,
      total_vagas: totalEl.value,
      preco_base: precoEl.value,
      img0: document.getElementById("img0").value,
      img1: document.getElementById("img1").value,
      img2: document.getElementById("img2").value,
      caracteristicas: tags.map(t => t.id)
    };

    const params = Object.keys(payload).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(typeof payload[k] === "object" ? JSON.stringify(payload[k]) : payload[k])).join("&");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_SALVAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function(){
      if (xhr.status !== 200) { alert("Erro salvar"); return; }
      const res = JSON.parse(xhr.responseText);
      if (res.status === "OK") {
        alert("Salvo com sucesso");
        window.location.href = "gerenciar_quartos.html";
      } else {
        alert("Erro: " + (res.erro || JSON.stringify(res)));
      }
    };
    xhr.send(params);
  }

  // helpers
  function debounce(fn, wait) {
    let t = null;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

})();

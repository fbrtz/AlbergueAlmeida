// gerenciar_vagas.js
(function () {
  const API_LISTAR = "api/listar_vagas.php";
  const API_EXCLUIR = "api/excluir_vaga.php";

  window.addEventListener("load", function () {
    const btnAdd = document.getElementById("btnAdd");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        const params = new URLSearchParams(window.location.search);
        const qid = params.get("quarto_id");
        let url = "editar_vaga.html";
        if (qid) url += "?quarto_id=" + encodeURIComponent(qid);
        window.location.href = url;
      });
    }
    carregarVagas();
  });

  function carregarVagas() {
    const params = new URLSearchParams(window.location.search);
    const quartoId = params.get("quarto_id") || "";

    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_LISTAR + (quartoId ? ("?quarto_id=" + encodeURIComponent(quartoId)) : ""), true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          renderizarGrupos(data);
        } catch (err) {
          document.getElementById("vagas-container").innerText = "Erro ao processar resposta do servidor.";
          console.error("parse error", err, xhr.responseText);
        }
      } else {
        document.getElementById("vagas-container").innerText = "Erro ao carregar vagas.";
      }
    };
    xhr.onerror = function () {
      document.getElementById("vagas-container").innerText = "Erro de rede ao carregar vagas.";
    };
    xhr.send();
  }

  // data: array de vagas
  function renderizarGrupos(vagas) {
    const container = document.getElementById("vagas-container");
    container.innerHTML = "";

    const grupos = {};
    vagas.forEach(v => {
      const qid = v.quarto_id;
      if (!grupos[qid]) grupos[qid] = { quarto_titulo: v.quarto_titulo || ("Quarto " + qid), vagas: [] };
      grupos[qid].vagas.push(v);
    });

    if (vagas.length === 0) {
      container.innerHTML = "<p>Nenhuma vaga encontrada.</p>";
      return;
    }

    Object.keys(grupos).forEach(qid => {
      const grupo = grupos[qid];
      const gEl = document.createElement("div");
      gEl.className = "vaga-group";

      const header = document.createElement("div");
      header.className = "group-header";
      header.innerHTML = `<h3>${escapeHtml(grupo.quarto_titulo)}</h3><div>${grupo.vagas.length} vagas</div>`;

      const list = document.createElement("div");
      list.className = "vaga-list";

      grupo.vagas.forEach(v => {
        const item = document.createElement("div");
        item.className = "vaga-item";

        const info = document.createElement("div");
        info.className = "vaga-info";

        // garantir números corretos (parse + fallback para 0)
        const adicional = Number(v.adicional || 0);
        // coluna do PHP: quarto_preco_base
        const precoBase = Number(v.quarto_preco_base || v.preco_base || 0);

        const total = adicional + precoBase;

        const nome = document.createElement("div");
        nome.innerHTML = `
          <div>
            <span class="preco-total"><strong>${escapeHtml(v.nome)}</strong> — R$ ${total.toFixed(2)}</span>
          </div>
          <div>
            <small class="preco-detalhe">
              Preço base: R$ ${precoBase.toFixed(2)} &nbsp; | &nbsp; Adicional: R$ ${adicional.toFixed(2)}
            </small>
          </div>
        `;

        const dispon = document.createElement("div");
        dispon.innerText = (v.disponivel == 1 || v.disponivel === true) ? "Disponível" : "Indisponível";

        const tags = document.createElement("div");
        if (Array.isArray(v.caracteristicas) && v.caracteristicas.length) {
          v.caracteristicas.forEach(c => {
            const t = document.createElement("span");
            t.className = "tag";
            t.innerText = c.nome;
            tags.appendChild(t);
          });
        }

        info.appendChild(nome);
        info.appendChild(dispon);
        info.appendChild(tags);

        const actions = document.createElement("div");
        actions.className = "vaga-actions";
        actions.innerHTML = `
          <button class="btn-edit" data-id="${v.id}">Editar</button>
          <button class="btn-delete" data-id="${v.id}">Excluir</button>
          <button class="btn-vagas" data-id="${v.id}">Ver Reservas</button>
        `;

        // eventos
        const btnEdit = actions.querySelector(".btn-edit");
        if (btnEdit) {
          btnEdit.addEventListener("click", () => {
            window.location.href = `editar_vaga.html?vaga_id=${v.id}&quarto_id=${v.quarto_id}`;
          });
        }

        const btnDelete = actions.querySelector(".btn-delete");
        if (btnDelete) {
          btnDelete.addEventListener("click", () => {
            if (!confirm("Deseja excluir esta vaga?")) return;
            excluirVaga(v.id, item);
          });
        }

        const btnVagas = actions.querySelector(".btn-vagas");
        if (btnVagas) {
          btnVagas.addEventListener("click", () => {
            window.location.href = `../reservas/listar_reservas.html?vaga_id=${v.id}`;
          });
        }

        item.appendChild(info);
        item.appendChild(actions);
        list.appendChild(item);
      });

      // toggle collapse
      header.addEventListener("click", () => {
        list.classList.toggle("show");
      });

      gEl.appendChild(header);
      gEl.appendChild(list);
      container.appendChild(gEl);
    });
  }

  function excluirVaga(id, el) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_EXCLUIR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      if (xhr.status === 200) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
        alert("Vaga excluída.");
      } else {
        alert("Erro ao excluir vaga.");
      }
    };
    xhr.send("id=" + encodeURIComponent(id));
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

})();

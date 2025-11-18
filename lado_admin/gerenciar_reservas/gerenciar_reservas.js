// gerenciar_reservas.js
(function () {
  const API_LISTAR = "api/listar_reservas.php";
  const API_ATUALIZAR = "api/atualizar_status_reserva.php";
  const API_EXCLUIR = "api/excluir_reserva.php";

  window.addEventListener("load", function () {
    carregarReservas();
  });

  function carregarReservas() {
    const params = new URLSearchParams(window.location.search);
    const vagaId = params.get("vaga_id") || "";
    const quartoId = params.get("quarto_id") || "";

    const xhr = new XMLHttpRequest();
    // Sempre busca todas as reservas (o filtro será feito no front-end)
    xhr.open("GET", API_LISTAR + (quartoId ? ("?quarto_id=" + encodeURIComponent(quartoId)) : ""), true);
    xhr.onload = function () {
      const container = document.getElementById("reservas-container");
      if (xhr.status === 200) {
        try {
          let data = JSON.parse(xhr.responseText);

          // Se houver vaga_id na URL, filtra apenas essa reserva
          if (vagaId) {
            data = data.filter(r => String(r.vaga_id) === vagaId);

            // Remove o parâmetro da URL sem recarregar a página
            params.delete("vaga_id");
            const newQuery = params.toString();
            const newUrl = window.location.pathname + (newQuery ? "?" + newQuery : "");
            window.history.replaceState({}, "", newUrl);
          }

          renderizarGrupos(data);
        } catch (err) {
          container.innerText = "Erro ao processar resposta do servidor.";
          console.error("parse error", err, xhr.responseText);
        }
      } else {
        container.innerText = "Erro ao carregar reservas.";
      }
    };
    xhr.onerror = function () {
      document.getElementById("reservas-container").innerText = "Erro de rede ao carregar reservas.";
    };
    xhr.send();
  }

  // array de reservas (cada reserva tem campos: id, vaga_id, vaga_nome, quarto_id, quarto_titulo, hospede_id, hospede_nome, inicio_periodo, fim_periodo, status, valor_total)
  function renderizarGrupos(reservas) {
    const container = document.getElementById("reservas-container");
    container.innerHTML = "";

    if (!Array.isArray(reservas) || reservas.length === 0) {
      container.innerHTML = "<p>Nenhuma reserva encontrada.</p>";
      return;
    }

    // agrupar por quarto
    const grupos = {};
    reservas.forEach(r => {
      const qid = r.quarto_id || "0";
      if (!grupos[qid]) grupos[qid] = { quarto_titulo: r.quarto_titulo || ("Quarto " + qid), reservas: [] };
      grupos[qid].reservas.push(r);
    });

    Object.keys(grupos).forEach(qid => {
      const grupo = grupos[qid];
      const gEl = document.createElement("div");
      gEl.className = "reserva-group";

      const header = document.createElement("div");
      header.className = "group-header";
      header.innerHTML = `<h3>${escapeHtml(grupo.quarto_titulo)}</h3><div>${grupo.reservas.length} reservas</div>`;

      const list = document.createElement("div");
      list.className = "reserva-list";

      // separar por seção
      const agora = new Date();

      const emAndamento = [];
      const futuras = [];
      const encerradas = [];

      grupo.reservas.forEach(r => {
        const inicio = new Date(r.inicio_periodo.replace(' ', 'T'));
        const fim = new Date(r.fim_periodo.replace(' ', 'T'));

        if (inicio <= agora && agora <= fim && r.status === "confirmado") emAndamento.push(r);
        else if (fim < agora) encerradas.push(r);
        else futuras.push(r);
      });

      // ajuda a renderizar seção
      function renderSection(title, arr) {
        const sec = document.createElement("div");
        sec.className = "reserva-section";
        sec.innerHTML = `<h4>${title} (${arr.length})</h4>`;
        arr.forEach(r => sec.appendChild(renderReservaItem(r)));
        return sec;
      }

      list.appendChild(renderSection("Em andamento", emAndamento));
      list.appendChild(renderSection("Futuras / Não iniciadas", futuras));
      list.appendChild(renderSection("Encerradas", encerradas));

      // colapsar/expandir
      header.addEventListener("click", () => {
        list.classList.toggle("show");
      });

      gEl.appendChild(header);
      gEl.appendChild(list);
      container.appendChild(gEl);
    });
  }

  function renderReservaItem(r) {
    const item = document.createElement("div");
    item.className = "reserva-item";

    const info = document.createElement("div");
    info.className = "reserva-info";

    const periodo = document.createElement("div");
    periodo.innerHTML = `<strong>${escapeHtml(r.vaga_nome || "Vaga")}</strong> — <span class="res-date">${fmtDateTime(r.inicio_periodo)} → ${fmtDateTime(r.fim_periodo)}</span>`;

    const hosp = document.createElement("div");
    hosp.innerHTML = `Hóspede: <strong>${escapeHtml(r.hospede_nome)}</strong>`;

    const valor = document.createElement("div");
    valor.innerHTML = `Valor total: <span class="res-value">R$ ${Number(r.valor_total).toFixed(2)}</span>`;

    const status = document.createElement("div");
    const stClass = r.status === "confirmado" ? "status-confirmado" : (r.status === "pendente" ? "status-pendente" : "status-cancelado");
    status.innerHTML = `<span class="r-tag ${stClass}">${escapeHtml(r.status)}</span>`;

    info.appendChild(periodo);
    info.appendChild(hosp);
    info.appendChild(valor);
    info.appendChild(status);

    const actions = document.createElement("div");
    actions.className = "reserva-actions";

    // Buttons:
    const btnViewGuest = document.createElement("button");
    btnViewGuest.className = "btn-edit";
    btnViewGuest.textContent = "Ver Hóspede";
    btnViewGuest.addEventListener("click", () => {
      window.location.href = `../gerenciar_usuarios/gerenciar_usuarios.html?usuario_id=${encodeURIComponent(r.hospede_id)}`;
    });

    const btnConfirm = document.createElement("button");
    btnConfirm.className = "btn-confirm";
    btnConfirm.textContent = "Confirmar";
    btnConfirm.addEventListener("click", () => atualizarStatus(r.id, "confirmado", item));

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn-cancel";
    btnCancel.textContent = "Cancelar";
    btnCancel.addEventListener("click", () => {
      if (!confirm("Deseja cancelar esta reserva?")) return;
      atualizarStatus(r.id, "cancelado", item);
    });

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-edit";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      window.location.href = `editar_reserva.html?id=${r.id}`;
    });
    actions.appendChild(btnEdit);

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-delete";
    btnDelete.textContent = "Excluir";
    btnDelete.addEventListener("click", () => {
      if (!confirm("Deseja excluir permanentemente esta reserva?")) return;
      excluirReserva(r.id, item);
    });

    // lógica: se já confirmado, esconder confirmar; se cancelado, esconder cancelar
    if (r.status === "confirmado") {
      btnConfirm.style.display = "none";
    } else if (r.status === "cancelado") {
      btnCancel.style.display = "none";
      btnConfirm.style.display = "inline-block";
    }

    actions.appendChild(btnViewGuest);
    actions.appendChild(btnConfirm);
    actions.appendChild(btnCancel);
    actions.appendChild(btnDelete);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  function atualizarStatus(id, status, elToUpdate) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_ATUALIZAR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.status === "OK") {
            alert("Status atualizado.");
            carregarReservas();
          } else {
            alert("Erro: " + (res.erro || "desconhecido"));
          }
        } catch (err) {
          alert("Resposta inválida do servidor.");
        }
      } else {
        alert("Erro ao atualizar status.");
      }
    };
    xhr.send("id=" + encodeURIComponent(id) + "&status=" + encodeURIComponent(status));
  }

  function excluirReserva(id, el) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_EXCLUIR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.status === "OK") {
            alert("Reserva excluída.");
            carregarReservas();
          } else {
            alert("Erro: " + (res.erro || "desconhecido"));
          }
        } catch (err) {
          alert("Resposta inválida do servidor.");
        }
      } else {
        alert("Erro ao excluir reserva.");
      }
    };
    xhr.send("id=" + encodeURIComponent(id));
  }

  function fmtDateTime(s) {
    if (!s) return "";
    const t = s.replace(' ', 'T');
    const d = new Date(t);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString();
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

})();

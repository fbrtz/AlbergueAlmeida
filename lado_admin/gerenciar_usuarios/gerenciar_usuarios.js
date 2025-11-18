// gerenciar_usuarios.js
(function () {
  const API_LISTAR = "api/listar_usuarios.php";

  const container = document.getElementById("usuarios-container");
  const searchInput = document.getElementById("searchInput");
  const filterStatus = document.getElementById("filterStatus");
  const filterFuncao = document.getElementById("filterFuncao");
  const nascFrom = document.getElementById("nascFrom");
  const nascTo = document.getElementById("nascTo");
  const btnSearch = document.getElementById("btnSearch");
  const btnClear = document.getElementById("btnClear");
  const btnAdd = document.getElementById("btnAdd");

  window.addEventListener("load", () => {
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        window.location.href = "editar_usuario.html?modo=criar";
      });
    }

    // carregar possivel usuario_id (se vier na URL, mostramos apenas esse usuário e limpamos a URL)
    const params = new URLSearchParams(window.location.search);
    const usuarioId = params.get("usuario_id");

    if (usuarioId) {
      // buscar só esse e depois limpar a url (opção A)
      fetchAndRender({ usuario_id: usuarioId }).then(() => {
        history.replaceState({}, "", "gerenciar_usuarios.html");
      });
    } else {
      fetchAndRender();
    }

    btnSearch.addEventListener("click", () => {
      doFilter();
    });

    btnClear.addEventListener("click", () => {
      searchInput.value = "";
      filterStatus.value = "";
      filterFuncao.value = "";
      nascFrom.value = "";
      nascTo.value = "";
      fetchAndRender();
    });

    // pesquisa ao digitar (debounced)
    searchInput.addEventListener("input", debounce(() => doFilter(), 300));
  });

  function doFilter() {
    const q = searchInput.value.trim();
    const status = filterStatus.value;
    const funcao = filterFuncao.value;
    const from = nascFrom.value;
    const to = nascTo.value;

    const params = {};
    if (q) params.q = q;
    if (status) params.status = status;
    if (funcao) params.funcao = funcao;
    if (from) params.nascimento_from = from;
    if (to) params.nascimento_to = to;

    fetchAndRender(params);
  }

  // params: { q, status, funcao, nascimento_from, nascimento_to, usuario_id }
  function fetchAndRender(params = {}) {
    container.innerHTML = "<p>Carregando usuários...</p>";

    const qs = Object.keys(params).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
    const url = API_LISTAR + (qs ? "?" + qs : "");

    return fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.erro) {
          container.innerHTML = "<p>Erro: " + escapeHtml(data.erro) + "</p>";
          return;
        }
        renderList(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error(err);
        container.innerHTML = "<p>Erro ao carregar usuários.</p>";
      });
  }

  function renderList(users) {
    container.innerHTML = "";
    if (!users || users.length === 0) {
      container.innerHTML = "<p>Nenhum usuário encontrado.</p>";
      return;
    }

    users.forEach(u => {
      const el = document.createElement("div");
      el.className = "panel-user";

      const left = document.createElement("div");
      left.className = "user-left";

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.innerText = initials(u.nome || u.email || "U");

      const meta = document.createElement("div");
      meta.className = "user-meta";

      const h = document.createElement("h3");
      h.innerHTML = `
      ${escapeHtml(u.nome || "(sem nome)")}
      <span class="status-badge status-${u.status}">
          ${capitalize(u.status)}
      </span>
      `;

      const p1 = document.createElement("p");
      p1.innerText = (u.email || "") + " • " + maskCPF(u.cpf || "");

      const p2 = document.createElement("p");
      p2.innerText = "Nasc: " + (u.nascimento || "—") + " • Função: " + (u.funcao || "—");

      meta.appendChild(h);
      meta.appendChild(p1);
      meta.appendChild(p2);

      left.appendChild(avatar);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "user-right";

      /* status removido
      const status = document.createElement("span");
      status.className = "status-badge " + ("status-" + (u.status || "inativo"));
      status.innerText = capitalize(u.status || "inativo"); */

      // actions
      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-edit-user";
      btnEdit.innerText = "Editar";
      btnEdit.addEventListener("click", () => {
        window.location.href = `editar_usuario.html?usuario_id=${encodeURIComponent(u.id)}&modo=editar`;
      });

      const btnDes = document.createElement("button");
      btnDes.className = "btn-desativar";
      btnDes.innerText = (u.status === "inativo") ? "Reativar" : "Desativar";
      btnDes.addEventListener("click", () => {
        const action = (u.status === "inativo") ? "reativar" : "desativar";
        if (!confirm(`Deseja ${action} o usuário ${u.nome || u.email}?`)) return;
        toggleActive(u.id, u.status).then(() => {
          doFilter(); // recarrega
        });
      });

      //right.appendChild(status);
      right.appendChild(btnEdit);
      right.appendChild(btnDes);

      el.appendChild(left);
      el.appendChild(right);

      container.appendChild(el);
    });
  }

  function toggleActive(id, currentStatus) {
    // se estiver inativo -> setar ativo; caso contrário setar inativo
    const novo = (currentStatus === "inativo") ? "ativo" : "inativo";
    return fetch("api/desativar_usuario.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "id=" + encodeURIComponent(id) + "&status=" + encodeURIComponent(novo)
    }).then(r => r.json());
  }

  // helpers
  function initials(name) {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + (parts[1][0]||"")).toUpperCase();
  }

  function maskCPF(cpf) {
    if (!cpf) return "";
    const d = String(cpf).replace(/\D/g,"");
    if (d.length !== 11) return cpf;
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4");
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function capitalize(s) {
    if (!s) return "";
    return s[0].toUpperCase() + s.slice(1);
  }

  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

})();

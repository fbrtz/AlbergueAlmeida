// editar_usuario.js
(function () {
  const API_CARREGAR = "api/carregar_usuario.php";
  const API_SALVAR = "api/salvar_usuario.php";

  const params = new URLSearchParams(window.location.search);
  const usuarioId = params.get("usuario_id");
  const modo = params.get("modo") || (usuarioId ? "editar" : "criar");

  const formTitle = document.getElementById("form-title");
  const form = document.getElementById("user-form");
  const msg = document.getElementById("form-msg");
  const btnToggleSenha = document.getElementById("btnToggleSenha");
  const novaSenhaRow = document.getElementById("nova-senha-row");
  const novaSenhaInput = document.getElementById("nova_senha");
  const senhaMsg = document.getElementById("senha-msg");
  const btnCancel = document.getElementById("btnCancel");

  window.addEventListener("load", () => {
    if (modo === "criar") {
      formTitle.innerText = "Criar Usuário";
      document.getElementById("usuario_id").value = "";
    } else {
      formTitle.innerText = "Editar Usuário";
      if (!usuarioId) {
        alert("Usuário inválido");
        window.location.href = "gerenciar_usuarios.html";
        return;
      }
      carregar(usuarioId);
    }

    btnToggleSenha.addEventListener("click", () => {
      novaSenhaRow.style.display = novaSenhaRow.style.display === "none" ? "block" : "none";
      if (novaSenhaRow.style.display === "none") {
        novaSenhaInput.value = "";
        senhaMsg.innerText = "";
      }
    });

    btnCancel.addEventListener("click", () => {
      window.history.back();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm();
    });

    // máscara simples CPF ao digitar
    const cpfEl = document.getElementById("cpf");
    cpfEl.addEventListener("input", () => {
        let v = cpfEl.value.replace(/\D/g, "").slice(0,11);

        if (v.length > 9) {
            v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        } else if (v.length > 6) {
            v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        } else if (v.length > 3) {
            v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
        }

        cpfEl.value = v;
    });
  });

  function carregar(id) {
    fetch(API_CARREGAR + "?id=" + encodeURIComponent(id))
      .then(r => r.json())
      .then(data => {
        if (data.erro) {
          msg.innerText = data.erro;
          return;
        }
        // preencher
        document.getElementById("usuario_id").value = data.id;
        document.getElementById("nome").value = data.nome || "";
        document.getElementById("cpf").value = maskCPF(data.cpf || "");
        document.getElementById("nascimento").value = (data.nascimento || "");
        document.getElementById("email").value = data.email || "";
        document.getElementById("funcao").value = data.funcao || "cliente";
        document.getElementById("status").value = data.status || "ativo";
      })
      .catch(err => {
        console.error(err);
        msg.innerText = "Erro ao carregar usuário.";
      });
  }

  function submitForm() {
    msg.innerText = "";

    const fd = new FormData();
    const id = document.getElementById("usuario_id").value || "";
    fd.append("id", id);
    fd.append("nome", document.getElementById("nome").value.trim());
    fd.append("cpf", document.getElementById("cpf").value.replace(/\D/g,""));
    fd.append("nascimento", document.getElementById("nascimento").value);
    fd.append("email", document.getElementById("email").value.trim());
    fd.append("funcao", document.getElementById("funcao").value);
    fd.append("status", document.getElementById("status").value);

    // só enviar nova senha se campo visível e preenchido com >=6 chars
    if (novaSenhaRow.style.display !== "none") {
      const ns = novaSenhaInput.value;
      if (ns && ns.length > 0) {
        if (ns.length < 6) {
          senhaMsg.innerText = "Senha precisa ter ao menos 6 caracteres.";
          return;
        }
        fd.append("nova_senha", ns);
      } else {
        // admin abriu o campo mas deixou em branco -> não enviar senha
      }
    }

    fetch(API_SALVAR, { method: "POST", body: fd })
      .then(r => r.json())
      .then(res => {
        if (res.status === "OK") {
          alert("Usuário salvo.");
          window.location.href = "gerenciar_usuarios.html";
        } else {
          msg.innerText = res.erro || "Erro ao salvar.";
        }
      })
      .catch(err => {
        console.error(err);
        msg.innerText = "Erro de rede ao salvar.";
      });
  }


  function maskCPF(cpf) {
    const d = String(cpf).replace(/\D/g, "");
    if (d.length !== 11) return cpf;
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

})();

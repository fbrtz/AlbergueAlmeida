document.addEventListener("DOMContentLoaded", () => {

    const tags = [];
    const selecionadas = new Set();

    // carregar lista completa de características
    fetch("api/listar_caracteristicas.php?tipo=quarto")
        .then(r => r.json())
        .then(lista => {
            lista.forEach(t => tags.push(t));
        });

    // elementos DOM
    const input = document.getElementById("tag-search");
    const results = document.getElementById("tag-results");
    const container = document.getElementById("tags-container");

    // AUTOCOMPLETE -------------------------------------------------------
    input.addEventListener("input", () => {
        const textoOriginal = input.value.trim(); 
        const txt = textoOriginal.toLowerCase(); // apenas para filtrar
        results.innerHTML = "";

        if (txt.length < 1) {
            results.style.display = "none";
            return;
        }

        // filtrar por nome e tipo permitido
        const filtradas = tags
            .filter(t =>
                (t.tipo === "quarto" || t.tipo === "ambos") &&
                t.nome.toLowerCase().includes(txt)
            )
            .slice(0, 8);

        // montar itens da lista
        filtradas.forEach(t => {
            const div = document.createElement("div");
            div.className = "tag-option";
            div.textContent = t.nome;

            div.onclick = () => {
                addTag(t.id, t.nome);
            };

            results.appendChild(div);
        });

        // opção de criar característica nova
        if (filtradas.length === 0 || !filtradas.some(f => f.nome.toLowerCase() === txt)) {
            const criar = document.createElement("div");
            criar.className = "tag-option criar-opcao";
            criar.innerHTML = `Criar nova característica: <strong>"${textoOriginal}"</strong>`;
            criar.onclick = () => criarCaracteristica(textoOriginal);
            results.appendChild(criar);
        }

        results.style.display = "block";
    });

    // adiciona chip
    function addTag(id, nome) {
        if (!selecionadas.has(id)) {
            selecionadas.add(id);
            renderTags();
        }

        input.value = "";
        results.innerHTML = "";
        results.style.display = "none";
    }

    // CRIAR NOVA CARACTERÍSTICA -----------------------------------------
    function criarCaracteristica(nomeDigitado) {
        const fd = new FormData();
        fd.append("nome", nomeDigitado);
        fd.append("tipo", "quarto");

        fetch("api/criar_caracteristica.php", {
            method: "POST",
            body: fd
        })
        .then(r => r.json())
        .then(nova => {
            if (!nova.id) {
                alert("Erro ao criar característica!");
                return;
            }

            // adiciona na lista
            tags.push({
                id: nova.id,
                nome: nova.nome,
                tipo: "quarto"
            });

            // já marca como selecionada
            addTag(nova.id, nova.nome);
        });
    }

    // renderiza os chips -------------------------------------------------
    function renderTags() {
        container.innerHTML = "";

        selecionadas.forEach(id => {
            const t = tags.find(x => x.id == id);
            if (!t) return;

            const chip = document.createElement("span");
            chip.className = "tag-chip";
            chip.innerHTML = `${t.nome} <span class="remove-tag" data-id="${id}">×</span>`;
            container.appendChild(chip);
        });

        // remover tag
        document.querySelectorAll(".remove-tag").forEach(btn => {
            btn.onclick = () => {
                selecionadas.delete(btn.dataset.id);
                renderTags();
            };
        });
    }

    // SALVAR NOVO QUARTO -------------------------------------------------
    const form = document.getElementById("form-quarto");
    form.addEventListener("submit", e => {
        e.preventDefault();

        const fd = new FormData(form);

        // envia atributos selecionados
        fd.append("caracteristicas", JSON.stringify([...selecionadas]));

        fetch("api/salvar_quarto.php", {
            method: "POST",
            body: fd
        })
        .then(r => r.text())
        .then(txt => {
            // retorno OK|id_quarto
            if (!txt.startsWith("OK")) {
                alert("Inserido: " + txt);
                return;
            }

            const quartoID = txt.replace("OK|", "").trim();

            // agora vincula características
            const lista = [...selecionadas];

            Promise.all(lista.map(id => {
                const fd2 = new FormData();
                fd2.append("quarto_id", quartoID);
                fd2.append("caracteristica_id", id);

                return fetch("api/vincular_caracteristica_quarto.php", {
                    method: "POST",
                    body: fd2
                });
            }))
            .then(() => {
                alert("Quarto criado com sucesso!");
                window.location.href = "gerenciar_quartos.html";
            });
        });
    });

    document.getElementById("btn-cancel").onclick = () => history.back();



    // ================== PREVIEW DAS IMAGENS ==================
    function ativarPreview(campo, preview) {
        const input = document.getElementById(campo);
        const img = document.getElementById(preview);

        const atualizarPreview = () => {
            const url = input.value.trim();

            if (url === "") {
                img.src = "";
                img.style.display = "none";
                return;
            }

            img.src = url;
            img.style.display = "block";
        };

        input.addEventListener("input", atualizarPreview);
        atualizarPreview();
    }

    ativarPreview("img0", "preview0");
    ativarPreview("img1", "preview1");
    ativarPreview("img2", "preview2");

});

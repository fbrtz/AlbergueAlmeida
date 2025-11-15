const params = new URLSearchParams(window.location.search);
const id = params.get("id");

function atualizarPreview(campoId, imgId) {
    const url = document.getElementById(campoId).value;
    document.getElementById(imgId).src = url || "";
}

window.onload = () => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "api/carregar_quarto.php?id=" + id);

    xhr.onload = function () {
        let q = JSON.parse(this.responseText);

        // Preenche campos
        document.getElementById("titulo").value = q.titulo;
        document.getElementById("descricao").value = q.descricao;
        document.getElementById("total_vagas").value = q.total_vagas;
        document.getElementById("preco_base").value = q.preco_base;

        document.getElementById("img0").value = q.img0 || "";
        document.getElementById("img1").value = q.img1 || "";
        document.getElementById("img2").value = q.img2 || "";

        atualizarPreview("img0", "preview0");
        atualizarPreview("img1", "preview1");
        atualizarPreview("img2", "preview2");
    };

    xhr.send();
};

// Ativa previews em tempo real
["0","1","2"].forEach(i => {
    document.getElementById("img" + i).addEventListener("input", () => {
        atualizarPreview("img" + i, "preview" + i);
    });
});

document.getElementById("form-editar").onsubmit = function (e) {
    e.preventDefault();

    // Validação da imagem obrigatória
    if (document.getElementById("img0").value.trim() === "") {
        alert("A imagem 1 é obrigatória!");
        return;
    }

    let dados =
        "id=" + id +
        "&titulo=" + encodeURIComponent(document.getElementById("titulo").value) +
        "&descricao=" + encodeURIComponent(document.getElementById("descricao").value) +
        "&total_vagas=" + document.getElementById("total_vagas").value +
        "&preco_base=" + document.getElementById("preco_base").value +
        "&img0=" + encodeURIComponent(document.getElementById("img0").value) +
        "&img1=" + encodeURIComponent(document.getElementById("img1").value) +
        "&img2=" + encodeURIComponent(document.getElementById("img2").value);

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "api/editar_quarto.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
        alert("Alterações salvas!");
        window.location.href = "gerenciar_quartos.html";
    };

    xhr.send(dados);
};

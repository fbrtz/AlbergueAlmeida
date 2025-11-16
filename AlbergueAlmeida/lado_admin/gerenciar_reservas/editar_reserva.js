(function () {

const API_GET_RESERVA = "api/obter_reserva.php";
const API_GET_VAGAS = "api/listar_vagas_do_quarto.php";
const API_UPDATE = "api/atualizar_reserva.php";

// quando abrir a tela
window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
        alert("Reserva inválida");
        return;
    }

    document.getElementById("reserva_id").value = id;

    carregarReserva(id);
});

// carregar dados da reserva
function carregarReserva(id) {
    fetch(API_GET_RESERVA + "?id=" + id)
    .then(r => r.json())
    .then(data => {
        if (data.erro) {
            alert(data.erro);
            return;
        }

        // preencher campos
        document.getElementById("inicio_periodo").value = data.inicio_periodo.replace(" ", "T");
        document.getElementById("fim_periodo").value = data.fim_periodo.replace(" ", "T");
        document.getElementById("valor_total").value = data.valor_total;
        document.getElementById("status").value = data.status;

        // carregar vagas do quarto
        carregarVagas(data.id);
    });
}

// carregar vagas do quarto correspondente
function carregarVagas(reserva_id) {
    fetch(API_GET_VAGAS + "?reserva_id=" + reserva_id)
    .then(r => r.json())
    .then(vagas => {

        const select = document.getElementById("vaga_id");
        select.innerHTML = "";

        vagas.forEach(v => {
            const op = document.createElement("option");
            op.value = v.id;
            op.textContent = v.nome;
            select.appendChild(op);
        });

        // marcar vaga atual
        fetch(API_GET_RESERVA + "?id=" + reserva_id)
        .then(r => r.json())
        .then(r => {
            select.value = r.vaga_id;
        });

    });
}

// submeter
document.getElementById("form-edit").addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("id", document.getElementById("reserva_id").value);
    fd.append("vaga_id", document.getElementById("vaga_id").value);
    fd.append("inicio_periodo", document.getElementById("inicio_periodo").value);
    fd.append("fim_periodo", document.getElementById("fim_periodo").value);
    fd.append("valor_total", document.getElementById("valor_total").value);
    fd.append("status", document.getElementById("status").value);

    fetch(API_UPDATE, { method: "POST", body: fd })
    .then(r => r.json())
    .then(res => {
        if (res.status === "OK") {
            alert("Reserva atualizada com sucesso!");
            window.location.href = "gerenciar_reservas.html";
        } else {
            alert(res.erro || "Erro ao atualizar");
        }
    });
});

})();

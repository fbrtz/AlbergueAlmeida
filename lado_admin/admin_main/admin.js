window.onload = function () {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "get_dashboard_data.php", true);

    xhr.onload = function () {
        try {
            let dados = JSON.parse(this.responseText);

            document.getElementById("porcentagem-ocupadas").innerText =
                dados.porcentagem_ocupadas + "%";

            document.getElementById("total-vagas").innerText =
                dados.total_vagas;

            document.getElementById("vagas-disponiveis").innerText =
                dados.vagas_disponiveis;

            document.getElementById("reservas-ativas").innerText =
                dados.reservas_ativas;

        } catch (e) {
            console.error("Erro ao processar JSON:", e);
        }
    };

    xhr.send();
};

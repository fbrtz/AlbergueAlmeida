const inputCPF = document.getElementById("cpf");

// Mascara dinâmica de CPF
inputCPF.addEventListener("input", function () {
    let cpf = inputCPF.value.replace(/\D/g, ""); // remove tudo que não é número

    if (cpf.length > 11) cpf = cpf.slice(0, 11);

    // aplica máscara
    if (cpf.length <= 3) {
        inputCPF.value = cpf;
    } else if (cpf.length <= 6) {
        inputCPF.value = cpf.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    } else if (cpf.length <= 9) {
        inputCPF.value = cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else {
        inputCPF.value = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    }
});

document.getElementById("formCadastro").addEventListener("submit", function(e){
    e.preventDefault();

    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value.replace(/\D/g, ""); // remove máscara
    let nascimento = document.getElementById("nascimento").value;
    let senha = document.getElementById("senha").value;
    let confirmar = document.getElementById("confirmar").value;
    let msg = document.getElementById("msg");

    // Validação CPF
    if(cpf.length !== 11){
        msg.textContent = "CPF inválido. Digite 11 números.";
        return;
    }

    // Validação maior de idade
    let dataNasc = new Date(nascimento);
    let hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    let mes = hoje.getMonth() - dataNasc.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
        idade--;
    }

    if(idade < 18){
        msg.textContent = "É necessário ter 18 anos ou mais para se cadastrar.";
        return;
    }

    // Validação senha
    if(senha !== confirmar){
        msg.textContent = "As senhas não coincidem.";
        return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "cadastro.php", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onload = function(){
        msg.textContent = this.responseText;

        if(this.responseText === "sucesso"){
            window.location.href = "../login/login.html";
        }
    };

    xhr.send(
        "nome=" + nome +
        "&email=" + email +
        "&cpf=" + cpf + // já tratado
        "&nascimento=" + nascimento +
        "&senha=" + senha
    );
});

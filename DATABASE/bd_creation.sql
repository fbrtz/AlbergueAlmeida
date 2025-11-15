-- Criação do Banco
DROP DATABASE albergue_almeida;

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS albergue_almeida;
USE albergue_almeida;

-- Tabela usuarios (deve ser criada primeiro por ser referenciada)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR (255) NOT NULL,
    funcao ENUM('cliente', 'administrador') NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela caracteristicas (independente)
CREATE TABLE IF NOT EXISTS caracteristicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('quarto', 'vaga', 'ambos') NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela quartos (depende de usuarios)
CREATE TABLE IF NOT EXISTS quartos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    img0 TEXT NOT NULL,
    img1 TEXT,
    img2 TEXT,
    total_vagas INT NOT NULL,
    preco_base DECIMAL(10,2) NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela vagas (depende de quartos)
CREATE TABLE IF NOT EXISTS vagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quarto_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    adicional DECIMAL(10,2) NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE CASCADE
);

CREATE TABLE imagem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caminho TEXT NOT NULL
);

CREATE TABLE quarto_imagem (
    id_quarto INT,
    id_imagem INT,
    ordem INT DEFAULT 0,
    PRIMARY KEY (id_quarto, id_imagem),
    FOREIGN KEY (id_quarto) REFERENCES quartos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_imagem) REFERENCES imagem(id) ON DELETE CASCADE
);

-- Tabela caracteristicas_quartos (depende de quartos e caracteristicas)
CREATE TABLE IF NOT EXISTS caracteristicas_quartos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quarto_id INT NOT NULL,
    caracteristica_id INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE CASCADE,
    FOREIGN KEY (caracteristica_id) REFERENCES caracteristicas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_quarto_caracteristica (quarto_id, caracteristica_id)
);

-- Tabela caracteristicas_vagas (depende de vagas e caracteristicas)
CREATE TABLE IF NOT EXISTS caracteristicas_vagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaga_id INT NOT NULL,
    caracteristica_id INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,
    FOREIGN KEY (caracteristica_id) REFERENCES caracteristicas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vaga_caracteristica (vaga_id, caracteristica_id)
);

-- Tabela reservas (depende de vagas e usuarios)
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaga_id INT NOT NULL,
    hospede_id INT NOT NULL,
    inicio_periodo DATETIME NOT NULL,
    fim_periodo DATETIME NOT NULL,
    status ENUM('pendente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'pendente',
    valor_total DECIMAL(10,2) NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,
    FOREIGN KEY (hospede_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_vagas_quarto ON vagas(quarto_id);
CREATE INDEX idx_vagas_disponivel ON vagas(disponivel);
CREATE INDEX idx_caracteristicas_quartos_quarto ON caracteristicas_quartos(quarto_id);
CREATE INDEX idx_caracteristicas_quartos_caracteristica ON caracteristicas_quartos(caracteristica_id);
CREATE INDEX idx_caracteristicas_vagas_vaga ON caracteristicas_vagas(vaga_id);
CREATE INDEX idx_caracteristicas_vagas_caracteristica ON caracteristicas_vagas(caracteristica_id);
CREATE INDEX idx_reservas_vaga ON reservas(vaga_id);
CREATE INDEX idx_reservas_hospede ON reservas(hospede_id);
CREATE INDEX idx_reservas_periodo ON reservas(inicio_periodo, fim_periodo);
CREATE INDEX idx_reservas_status ON reservas(status);

-- Inserir alguns dados iniciais para teste
INSERT INTO usuarios (nome, email, senha, funcao) VALUES 
('Administrador Principal', 'admin@example.com', '123', 'administrador'),
('João Silva', 'joao@example.com', '123', 'cliente'),
('Maria Santos', 'maria@example.com', '123', 'cliente');


INSERT INTO quartos (titulo, descricao, total_vagas, preco_base,img0,img1) VALUES
('Q101','Quarto confortável',4,100.00,'https://d2iwr6cbo83dtj.cloudfront.net/2025/03/biblioteca-escondida-abriga-encontros-leitura-ape-estudio-elmor-credito-bia-nauiack-39.jpg','https://quartosetc.com.br/wp-content/uploads/2022/02/KAREN_PISACANE1-scaled-e1645810950545.jpg');


INSERT INTO vagas (quarto_id, nome, adicional) VALUES
(1,'Beliche Superior',30.00);


INSERT INTO caracteristicas (nome, tipo) VALUES 
('Wi-Fi', 'ambos'),
('Ar Condicionado', 'quarto'),
('Projetor', 'quarto'),
('Tomadas', 'vaga'),
('Iluminação Natural', 'vaga');

INSERT INTO caracteristicas_quartos (quarto_id,caracteristica_id) VALUES 
(1,1);

INSERT INTO caracteristicas_vagas (vaga_id,caracteristica_id) VALUES 
(1,5);

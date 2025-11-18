-- Criação do Banco
DROP DATABASE IF EXISTS  albergue_almeida;

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS albergue_almeida;
USE albergue_almeida;

-- Tabela usuarios (deve ser criada primeiro por ser referenciada)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    nascimento DATE,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR (255) NOT NULL,
    status ENUM('ativo', 'inativo', 'bloqueado') DEFAULT 'ativo',
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

 ###
-- INSERTS DE TESTE COMPLETOS
 ###

-- Usuários (IDs automáticos)
INSERT INTO usuarios (nome, cpf, nascimento, email, senha, funcao) VALUES 
('Administrador Principal', '111.111.111-11', '1980-01-01', 'admin@example.com', '123', 'administrador'),
('João Silva', '222.222.222-22', '1990-05-12', 'joao@example.com', '123', 'cliente'),
('Maria Santos', '333.333.333-33', '1992-08-20', 'maria@example.com', '123', 'cliente'),
('Carlos Pereira', '444.444.444-44', '1995-03-15', 'carlos@example.com', '123', 'cliente'),
('Ana Oliveira', '555.555.555-55', '1998-11-22', 'ana@example.com', '123', 'cliente'),
('Roberta Lima', '666.666.666-66', '1987-07-09', 'roberta@example.com', '123', 'cliente');



-- Características (IDs automáticos)
INSERT INTO caracteristicas (nome, tipo) VALUES 
('Wi-Fi', 'ambos'),            -- id 1
('Ar Condicionado', 'quarto'), -- id 2
('Projetor', 'quarto'),        -- id 3
('Tomadas', 'vaga'),            -- id 4
('Iluminação Natural', 'vaga'), -- id 5
('Ventilador', 'quarto'),      -- id 6
('Cortina Blackout', 'vaga'),  -- id 7
('Luz de Leitura', 'vaga'),    -- id 8
('Armário Individual', 'vaga'),-- id 9
('Frigobar', 'quarto');        -- id 10



 
-- QUARTO 1: Q101
 
INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0, img1) VALUES
('Q101','Quarto confortável',4,100.00,
 'https://d2iwr6cbo83dtj.cloudfront.net/2025/03/biblioteca-escondida-abriga-encontros-leitura-ape-estudio-elmor-credito-bia-nauiack-39.jpg',
 'https://quartosetc.com.br/wp-content/uploads/2022/02/KAREN_PISACANE1-scaled-e1645810950545.jpg');

INSERT INTO vagas (quarto_id, nome, adicional, disponivel) VALUES
(1,'Beliche Superior',30.00, TRUE); -- id 1

INSERT INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES
(1,1); -- Wi-Fi

INSERT INTO caracteristicas_vagas (vaga_id, caracteristica_id) VALUES
(1,5); -- Iluminação Natural

-- Reservas
INSERT INTO reservas (vaga_id, hospede_id, inicio_periodo, fim_periodo, valor_total) 
VALUES (1, 2, '2025-12-01 14:00:00','2025-12-05 11:00:00',450.00);

INSERT INTO reservas (vaga_id, hospede_id, inicio_periodo, fim_periodo, status, valor_total) 
VALUES (1, 3, '2025-12-10 14:00:00','2025-12-12 11:00:00','confirmado',260.00);



 
-- QUARTO 2: Q102 - sem vagas
 
INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0) VALUES
('Q102 - Sala Privativa', 'Sala para estudo ou leitura, não possui vagas de cama.', 0, 80.00,
'https://i.pinimg.com/originals/e3/03/c2/e303c280dddc433ba2e27404eb33888e.jpg');

INSERT INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES
(2,1), -- Wi-Fi
(2,2), -- Ar Condicionado
(2,6); -- Ventilador




-- QUARTO 3: Q103 - com vagas, sem reservas

INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0) VALUES
('Q103 - Quarto Feminino', 'Quarto coletivo feminino, ventilado e iluminado.', 3, 90.00,
'https://i.imgur.com/8QZ7yUO.jpeg');

INSERT INTO vagas (quarto_id, nome, adicional, disponivel) VALUES
(3,'Beliche Superior A',25.00,TRUE),  -- id 2
(3,'Beliche Inferior A',20.00,TRUE),  -- id 3
(3,'Cama Solteiro A',10.00,TRUE);     -- id 4

INSERT INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES
(3,1), -- Wi-Fi
(3,2), -- Ar Condicionado
(3,3); -- Projetor

INSERT INTO caracteristicas_vagas (vaga_id, caracteristica_id) VALUES
(2,6), -- Ventilador
(3,7), -- Cortina Blackout
(4,8); -- Luz de Leitura




-- QUARTO 4: Q104 - vagas com reservas

INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0) VALUES
('Q104 - Misto Conforto', 'Quarto misto com camas confortáveis.', 2, 120.00,
'https://cdn.homedit.com/wp-content/uploads/2020/04/Shared-bedroom-design-for-adult.jpg');

INSERT INTO vagas (quarto_id, nome, adicional, disponivel) VALUES
(4,'Cama Solteiro B',15.00,FALSE), -- id 5
(4,'Cama Solteiro C',15.00,TRUE);  -- id 6

INSERT INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES
(4,1),  -- Wi-Fi
(4,2),  -- Ar Condicionado
(4,10); -- Frigobar

INSERT INTO caracteristicas_vagas (vaga_id, caracteristica_id) VALUES
(5,9), -- Armário Individual
(6,7); -- Cortina Blackout

INSERT INTO reservas (vaga_id, hospede_id, inicio_periodo, fim_periodo, status, valor_total) VALUES
(5,4,'2025-11-10 14:00:00','2025-11-15 11:00:00','confirmado',600.00),
(5,5,'2025-12-01 14:00:00','2025-12-03 11:00:00','pendente',240.00);




-- QUARTO 5: Q105 - várias vagas, algumas reservadas

INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0) VALUES
('Q105 - Dormitório Grande', 'Quarto amplo com várias camas e boa circulação.', 6, 70.00,
'https://i.imgur.com/MtXqz0A.jpeg');

INSERT INTO vagas (quarto_id, nome, adicional, disponivel) VALUES
(5,'Beliche Sup D',10.00,FALSE), -- id 7
(5,'Beliche Inf D',10.00,FALSE), -- id 8
(5,'Beliche Sup E',10.00,TRUE),  -- id 9
(5,'Beliche Inf E',10.00,TRUE),  -- id 10
(5,'Beliche Sup F',10.00,TRUE),  -- id 11
(5,'Beliche Inf F',10.00,TRUE);  -- id 12

INSERT INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES
(5,1),  -- Wi-Fi
(5,2),  -- Ar Condicionado
(5,3),  -- Projetor
(5,10); -- Frigobar

INSERT INTO caracteristicas_vagas (vaga_id, caracteristica_id) VALUES
(7,7),  -- Cortina Blackout
(8,8),  -- Luz de Leitura
(9,9),  -- Armário Individual
(10,4), -- Tomadas
(11,6), -- Ventilador
(12,7); -- Cortina Blackout

INSERT INTO reservas (vaga_id, hospede_id, inicio_periodo, fim_periodo, status, valor_total) VALUES
(7,6,'2025-10-10 14:00:00','2025-10-12 11:00:00','confirmado',160.00),
(8,2,'2025-12-20 14:00:00','2025-12-25 11:00:00','pendente',350.00);

-- =====================================================================
-- INTAKA VILLAGE — Base de Dados
-- Sistema de agendamento de visitas a imóveis para arrendamento
-- Compatível com MySQL 5.7+ / MariaDB 10.3+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS intaka_village
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE intaka_village;

-- ---------------------------------------------------------------------
-- UTILIZADORES
-- Perfis: inquilino, proprietario, administrador (conforme RF1 / RF9)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(150)        NOT NULL,
  email           VARCHAR(150)        NOT NULL UNIQUE,
  senha_hash      VARCHAR(255)        NOT NULL,
  telefone        VARCHAR(30)         DEFAULT NULL,
  tipo            ENUM('inquilino','proprietario','administrador') NOT NULL DEFAULT 'inquilino',
  ativo           TINYINT(1)          NOT NULL DEFAULT 1,
  criado_em       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- IMÓVEIS (RF3)
-- ---------------------------------------------------------------------
CREATE TABLE imoveis (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proprietario_id   INT UNSIGNED         DEFAULT NULL,
  titulo            VARCHAR(150)         NOT NULL,
  tipo              ENUM('Apartamento T1','Apartamento T2','Moradia T2','Moradia T3','Moradia T4') NOT NULL,
  bairro            VARCHAR(100)         NOT NULL,
  cidade            VARCHAR(100)         NOT NULL DEFAULT 'Maputo',
  endereco          VARCHAR(255)         DEFAULT NULL,
  preco_mensal      DECIMAL(12,2)        NOT NULL,
  quartos           TINYINT UNSIGNED     NOT NULL,
  casas_banho       TINYINT UNSIGNED     NOT NULL,
  area_m2           DECIMAL(8,2)         NOT NULL,
  descricao         TEXT                 DEFAULT NULL,
  comodidades       VARCHAR(500)         DEFAULT NULL COMMENT 'lista separada por vírgulas',
  status            ENUM('disponivel','reservado','arrendado') NOT NULL DEFAULT 'disponivel',
  destaque          TINYINT(1)           NOT NULL DEFAULT 0,
  imagem_capa       VARCHAR(255)         NOT NULL,
  latitude          DECIMAL(10,7)        DEFAULT NULL,
  longitude         DECIMAL(10,7)        DEFAULT NULL,
  criado_em         TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proprietario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_bairro (bairro),
  INDEX idx_tipo (tipo),
  INDEX idx_preco (preco_mensal)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- GALERIA DE IMAGENS DO IMÓVEL (RF3 / RNF10)
-- ---------------------------------------------------------------------
CREATE TABLE imovel_imagens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  imovel_id   INT UNSIGNED    NOT NULL,
  caminho     VARCHAR(255)    NOT NULL,
  legenda     VARCHAR(150)    DEFAULT NULL,
  ordem       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
  INDEX idx_imovel (imovel_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VISITAS AGENDADAS (funcionalidade central da landing page)
-- ---------------------------------------------------------------------
CREATE TABLE visitas (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  imovel_id         INT UNSIGNED    NOT NULL,
  nome              VARCHAR(150)    NOT NULL,
  telefone          VARCHAR(30)     NOT NULL,
  email             VARCHAR(150)    DEFAULT NULL,
  data_preferida    DATE            NOT NULL,
  hora_preferida    TIME            NOT NULL,
  mensagem          TEXT            DEFAULT NULL,
  status            ENUM('pendente','confirmada','concluida','cancelada') NOT NULL DEFAULT 'pendente',
  criado_em         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_data (data_preferida)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- MENSAGENS (RF7 — comunicação inquilino/proprietário)
-- ---------------------------------------------------------------------
CREATE TABLE mensagens (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  imovel_id             INT UNSIGNED    DEFAULT NULL,
  remetente_nome        VARCHAR(150)    NOT NULL,
  remetente_contacto    VARCHAR(150)    NOT NULL,
  conteudo              TEXT            NOT NULL,
  status                ENUM('nao_lida','lida') NOT NULL DEFAULT 'nao_lida',
  criado_em             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- FAVORITOS
-- ---------------------------------------------------------------------
CREATE TABLE favoritos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT UNSIGNED    NOT NULL,
  imovel_id     INT UNSIGNED    NOT NULL,
  criado_em     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unico_favorito (usuario_id, imovel_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- DADOS DE EXEMPLO (seed) — Intaka Village, Maputo
-- =====================================================================
-- Utilizadores de demonstração para testar o login com os 3 perfis.
-- Palavras-passe em texto simples (apenas para referência do gestor):
--   inquilino@intakavillage.co.mz     | Inquilino123
--   proprietario@intakavillage.co.mz  | Proprietario123
--   admin@intakavillage.co.mz         | Admin123
-- Os hashes abaixo foram gerados com bcrypt (compatível com password_hash
-- do PHP). ALTERE estas contas antes de publicar em produção.
INSERT INTO usuarios (nome, email, senha_hash, telefone, tipo) VALUES
('Intaka Village Gestão', 'gestao@intakavillage.co.mz', '$2y$10$lXJS/Bod6FE5oBfna73L8.s0O/1wK2ql/iiX51ukQZMeVOsEg.w8S', '+258 84 000 0000', 'administrador'),
('Admin Demo', 'admin@intakavillage.co.mz', '$2y$10$lXJS/Bod6FE5oBfna73L8.s0O/1wK2ql/iiX51ukQZMeVOsEg.w8S', '+258 84 000 0001', 'administrador'),
('Proprietário Demo', 'proprietario@intakavillage.co.mz', '$2y$10$4KlYdFVdZtIWHzhzLzkRhOKrqLSeAJBWK59sE7ThYbt/1M30/57WC', '+258 84 000 0002', 'proprietario'),
('Inquilino Demo', 'inquilino@intakavillage.co.mz', '$2y$10$DvEe/9g6eWog92Y8eijotuzdGcL0CUQ8cRis5KmzKPobLId2rI3CC', '+258 84 000 0003', 'inquilino');

INSERT INTO imoveis
(proprietario_id, titulo, tipo, bairro, cidade, endereco, preco_mensal, quartos, casas_banho, area_m2, descricao, comodidades, status, destaque, imagem_capa, latitude, longitude)
VALUES
(1, 'Apartamento T1 Vista Jardim', 'Apartamento T1', 'Intaka', 'Maputo', 'Rua das Palmeiras, Intaka Village', 65000.00, 1, 1, 55.00,
 'O ponto de partida perfeito para viver sozinho. Espaço compacto e bem pensado, com cozinha equipada e muita luz natural — ideal para quem procura o primeiro passo rumo à independência.',
 'Segurança 24h,Jardins geridos,Estacionamento,Água canalizada,Perto de comércio', 'disponivel', 1, 'images/sala-estar-1.jpg', -25.9418, 32.5750),

(1, 'Apartamento T2 Horizonte', 'Apartamento T2', 'Intaka', 'Maputo', 'Rua dos Flamboyants, Intaka Village', 85000.00, 2, 1, 75.00,
 'Dois quartos, uma sala ampla e varanda privativa. Pensado para quem quer espaço para receber amigos sem abdicar da privacidade do seu próprio cantinho.',
 'Segurança 24h,Jardins geridos,Estacionamento,Varanda,Perto de escolas', 'disponivel', 1, 'images/sala-estar-2.jpg', -25.9420, 32.5755),

(1, 'Moradia T2 Acácia', 'Moradia T2', 'Intaka', 'Maputo', 'Avenida das Acácias, Intaka Village', 95000.00, 2, 1, 85.00,
 'Moradia térrea com quintal próprio, portão eletrónico e acabamentos modernos. A privacidade de uma casa inteira, ao alcance de quem está a começar uma vida nova.',
 'Segurança 24h,Jardim privativo,Estacionamento coberto,Portão eletrónico', 'disponivel', 1, 'images/fachada-casa-1.jpg', -25.9425, 32.5760),

(1, 'Moradia T3 Baobá', 'Moradia T3', 'Intaka', 'Maputo', 'Rua dos Baobás, Intaka Village', 130000.00, 3, 2, 120.00,
 'Moradia espaçosa com três quartos e duas casas de banho, cozinha em ilha e sala ampla com muita luz natural. Perfeita para quem quer crescer sem sair de Intaka Village.',
 'Segurança 24h,Jardim privativo,Estacionamento coberto,Cozinha equipada,Área de churrasco', 'disponivel', 0, 'images/fachada-casa-2.jpg', -25.9430, 32.5765),

(1, 'Moradia T3 Coral', 'Moradia T3', 'Intaka', 'Maputo', 'Rua Coral, Intaka Village', 150000.00, 3, 2, 140.00,
 'Acabamentos premium, closet no quarto principal e quintal generoso. Uma moradia pensada ao pormenor para quem não quer abdicar de conforto.',
 'Segurança 24h,Jardim privativo,Suite principal,Estacionamento coberto,Painel solar', 'disponivel', 0, 'images/quarto-2.jpg', -25.9433, 32.5768),

(1, 'Moradia T4 Horizonte Sul', 'Moradia T4', 'Intaka', 'Maputo', 'Rua Horizonte Sul, Intaka Village', 190000.00, 4, 3, 180.00,
 'A maior tipologia de Intaka Village. Quatro quartos, três casas de banho e amplas áreas sociais — espaço de sobra para a família crescer com conforto e segurança.',
 'Segurança 24h,Jardim privativo,Suite principal,Garagem dupla,Sala de jantar', 'disponivel', 0, 'images/quarto-1.jpg', -25.9436, 32.5770);

-- Galeria de imagens por imóvel (usa o mesmo pool de fotos reais da vila)
INSERT INTO imovel_imagens (imovel_id, caminho, legenda, ordem) VALUES
(1, 'images/sala-estar-1.jpg', 'Sala de estar', 0),
(1, 'images/cozinha-1.jpg', 'Cozinha', 1),
(1, 'images/wc-1.jpg', 'Casa de banho', 2),

(2, 'images/sala-estar-2.jpg', 'Sala de estar', 0),
(2, 'images/quarto-1.jpg', 'Quarto', 1),
(2, 'images/cozinha-1.jpg', 'Cozinha', 2),

(3, 'images/fachada-casa-1.jpg', 'Fachada', 0),
(3, 'images/sala-estar-1.jpg', 'Sala de estar', 1),
(3, 'images/quarto-1.jpg', 'Quarto', 2),

(4, 'images/fachada-casa-2.jpg', 'Fachada', 0),
(4, 'images/sala-estar-2.jpg', 'Sala de estar', 1),
(4, 'images/cozinha-1.jpg', 'Cozinha', 2),

(5, 'images/quarto-2.jpg', 'Quarto principal', 0),
(5, 'images/wc-1.jpg', 'Casa de banho', 1),
(5, 'images/sala-estar-1.jpg', 'Sala de estar', 2),

(6, 'images/quarto-1.jpg', 'Quarto', 0),
(6, 'images/quarto-2.jpg', 'Quarto principal', 1),
(6, 'images/cozinha-1.jpg', 'Cozinha', 2);

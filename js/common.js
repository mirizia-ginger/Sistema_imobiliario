/* =========================================================================
   INTAKA VILLAGE — common.js
   Código e dados partilhados entre index.html e detalhes.html:
   dados de reserva, formatação, cabeçalho/menu, popup WhatsApp,
   modal de agendamento e componente de carrossel.
   Expõe tudo em window.Intaka para ser usado por main.js e detalhes.js.
   ========================================================================= */

(function () {
  'use strict';

  const WHATSAPP_NUMERO = '258840000000';

  /* ----------------------------------------------------------------------
     DADOS DE RESERVA — usados quando a API PHP não responde
     (ex.: pré-visualização estática sem servidor/MySQL ativo).
     Espelha exatamente o conteúdo semeado em sql/schema.sql.
     ---------------------------------------------------------------------- */
  const IMOVEIS_RESERVA = [
    {
      id: 1, titulo: 'Apartamento T1 Vista Jardim', tipo: 'Apartamento T1',
      bairro: 'Intaka', cidade: 'Maputo', endereco: 'Rua das Palmeiras, Intaka Village',
      preco_mensal: 65000, quartos: 1, casas_banho: 1, area_m2: 55, destaque: 1,
      descricao: 'O ponto de partida perfeito para viver sozinho. Espaço compacto e bem pensado, com cozinha equipada e muita luz natural — ideal para quem procura o primeiro passo rumo à independência.',
      comodidades: 'Segurança 24h,Jardins geridos,Estacionamento,Água canalizada,Perto de comércio',
      imagem_capa: 'images/sala-estar-1.jpg',
      latitude: -25.9418, longitude: 32.5750,
      imagens: [
        { caminho: 'images/sala-estar-1.jpg', legenda: 'Sala de estar' },
        { caminho: 'images/cozinha-1.jpg', legenda: 'Cozinha' },
        { caminho: 'images/wc-1.jpg', legenda: 'Casa de banho' }
      ]
    },
    {
      id: 2, titulo: 'Apartamento T2 Horizonte', tipo: 'Apartamento T2',
      bairro: 'Intaka', cidade: 'Maputo', endereco: 'Rua dos Flamboyants, Intaka Village',
      preco_mensal: 85000, quartos: 2, casas_banho: 1, area_m2: 75, destaque: 1,
      descricao: 'Dois quartos, uma sala ampla e varanda privativa. Pensado para quem quer espaço para receber amigos sem abdicar da privacidade do seu próprio cantinho.',
      comodidades: 'Segurança 24h,Jardins geridos,Estacionamento,Varanda,Perto de escolas',
      imagem_capa: 'images/sala-estar-2.jpg',
      latitude: -25.9420, longitude: 32.5755,
      imagens: [
        { caminho: 'images/sala-estar-2.jpg', legenda: 'Sala de estar' },
        { caminho: 'images/quarto-1.jpg', legenda: 'Quarto' },
        { caminho: 'images/cozinha-1.jpg', legenda: 'Cozinha' }
      ]
    },
    {
      id: 3, titulo: 'Moradia T2 Acácia', tipo: 'Moradia T2',
      bairro: 'Intaka', cidade: 'Maputo', endereco: 'Avenida das Acácias, Intaka Village',
      preco_mensal: 95000, quartos: 2, casas_banho: 1, area_m2: 85, destaque: 1,
      descricao: 'Moradia térrea com quintal próprio, portão eletrónico e acabamentos modernos. A privacidade de uma casa inteira, ao alcance de quem está a começar uma vida nova.',
      comodidades: 'Segurança 24h,Jardim privativo,Estacionamento coberto,Portão eletrónico',
      imagem_capa: 'images/fachada-casa-1.jpg',
      latitude: -25.9425, longitude: 32.5760,
      imagens: [
        { caminho: 'images/fachada-casa-1.jpg', legenda: 'Fachada' },
        { caminho: 'images/sala-estar-1.jpg', legenda: 'Sala de estar' },
        { caminho: 'images/quarto-1.jpg', legenda: 'Quarto' }
      ]
    },
    {
      id: 4, titulo: 'Moradia T3 Baobá', tipo: 'Moradia T3',
      bairro: 'Intaka', cidade: 'Maputo', endereco: 'Rua dos Baobás, Intaka Village',
      preco_mensal: 130000, quartos: 3, casas_banho: 2, area_m2: 120, destaque: 0,
      descricao: 'Moradia espaçosa com três quartos e duas casas de banho, cozinha em ilha e sala ampla com muita luz natural. Perfeita para quem quer crescer sem sair de Intaka Village.',
      comodidades: 'Segurança 24h,Jardim privativo,Estacionamento coberto,Cozinha equipada,Área de churrasco',
      imagem_capa: 'images/fachada-casa-2.jpg',
      latitude: -25.9430, longitude: 32.5765,
      imagens: [
        { caminho: 'images/fachada-casa-2.jpg', legenda: 'Fachada' },
        { caminho: 'images/sala-estar-2.jpg', legenda: 'Sala de estar' },
        { caminho: 'images/cozinha-1.jpg', legenda: 'Cozinha' }
      ]
    },
    {
      id: 5, titulo: 'Moradia T3 Coral', tipo: 'Moradia T3',
      bairro: 'Intaka', cidade: 'Maputo', endereco: 'Rua Coral, Intaka Village',
      preco_mensal: 150000, quartos: 3, casas_banho: 2, area_m2: 140, destaque: 0,
      descricao: 'Acabamentos premium, closet no quarto principal e quintal generoso. Uma moradia pensada ao pormenor para quem não quer abdicar de conforto.',
      comodidades: 'Segurança 24h,Jardim privativo,Suite principal,Estacionamento coberto,Painel solar',
      imagem_capa: 'images/quarto-2.jpg',
      latitude: -25.9433, longitude: 32.5768,
      imagens: [
        { caminho: 'images/quarto-2.jpg', legenda: 'Quarto principal' },
        { caminho: 'images/wc-1.jpg', legenda: 'Casa de banho' },
        { caminho: 'images/sala-estar-1.jpg', legenda: 'Sala de estar' }
      ]
    },
    {
      id: 6, titulo: 'Moradia T4 Horizonte Sul', tipo: 'Moradia T4',
      bairro: 'Intaka', cidade: 'Maputo', endereco: 'Rua Horizonte Sul, Intaka Village',
      preco_mensal: 190000, quartos: 4, casas_banho: 3, area_m2: 180, destaque: 0,
      descricao: 'A maior tipologia de Intaka Village. Quatro quartos, três casas de banho e amplas áreas sociais — espaço de sobra para a família crescer com conforto e segurança.',
      comodidades: 'Segurança 24h,Jardim privativo,Suite principal,Garagem dupla,Sala de jantar',
      imagem_capa: 'images/quarto-1.jpg',
      latitude: -25.9436, longitude: 32.5770,
      imagens: [
        { caminho: 'images/quarto-1.jpg', legenda: 'Quarto' },
        { caminho: 'images/quarto-2.jpg', legenda: 'Quarto principal' },
        { caminho: 'images/cozinha-1.jpg', legenda: 'Cozinha' }
      ]
    }
  ];

  /* ----------------------------------------------------------------------
     FORMATAÇÃO / ÍCONES
     ---------------------------------------------------------------------- */
  const formatarMZN = (valor) =>
    new Intl.NumberFormat('pt-MZ', { maximumFractionDigits: 0 }).format(valor) + ' MZN';

  /**
   * Deriva a tipologia (T1–T4) de um imóvel a partir do nº de quartos,
   * independentemente de ser apartamento ou moradia. Usado pelos filtros
   * "Tipo 01" a "Tipo 04" no index.html.
   */
  function tipologiaDoImovel(imovel) {
    const quartos = Math.max(1, Math.min(4, Number(imovel.quartos) || 1));
    return 'T' + quartos;
  }

  /* ----------------------------------------------------------------------
     FAVORITOS — persistidos no browser (localStorage)
     ---------------------------------------------------------------------- */
  const CHAVE_FAVORITOS = 'intaka_favoritos';

  function obterFavoritos() {
    try {
      const bruto = localStorage.getItem(CHAVE_FAVORITOS);
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  }

  function isFavorito(id) {
    return obterFavoritos().includes(Number(id));
  }

  function alternarFavorito(id) {
    id = Number(id);
    const listaAtual = obterFavoritos();
    const jaEraFavorito = listaAtual.includes(id);
    const novaLista = jaEraFavorito ? listaAtual.filter((x) => x !== id) : [...listaAtual, id];
    try {
      localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(novaLista));
    } catch (erro) { /* localStorage indisponível — favoritos não persistem, mas não bloqueia a UI */ }
    return !jaEraFavorito; // devolve o novo estado (true = agora é favorito)
  }

  const ICONES = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    cama: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6M2 18v2M22 18v2M2 12V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    banho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6 6.5 3.5A1.5 1.5 0 0 0 4 4.5V12M4 12h18v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-2Z"/><path d="M8 21v1M16 21v1"/></svg>',
    area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>',
    seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    setaEsq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 18l-6-6 6-6"/></svg>',
    coracao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 13 4 4L19 7"/></svg>',
    telefone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.3-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/></svg>',
    mapa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 16V4m0 3L9 4"/></svg>'
  };
  function iconeSVG(nome) { return ICONES[nome] || ''; }

  /* ----------------------------------------------------------------------
     SCROLL REVEAL — fade-in genérico para elementos .reveal
     ---------------------------------------------------------------------- */
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('em-vista');
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  function observarRevelacoes(escopo = document) {
    escopo.querySelectorAll('.reveal:not(.em-vista)').forEach((el) => observador.observe(el));
  }

  /* ----------------------------------------------------------------------
     CABEÇALHO — fundo sólido ao rolar + menu móvel
     ---------------------------------------------------------------------- */
  const cabecalho = document.querySelector('.cabecalho');
  const navToggle = document.querySelector('.nav-toggle');
  const navPrincipal = document.querySelector('.nav-principal');

  if (cabecalho) {
    const semHero = document.body.classList.contains('pagina-detalhes');
    function alternarCabecalho() {
      cabecalho.classList.toggle('esta-fixo', semHero || window.scrollY > 40);
    }
    window.addEventListener('scroll', alternarCabecalho, { passive: true });
    alternarCabecalho();
  }

  if (navToggle && navPrincipal) {
    navToggle.addEventListener('click', () => {
      const aberto = navPrincipal.classList.toggle('aberto');
      navToggle.setAttribute('aria-expanded', String(aberto));
      document.body.style.overflow = aberto ? 'hidden' : '';
    });
    navPrincipal.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navPrincipal.classList.remove('aberto');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ----------------------------------------------------------------------
     CARROSSEL DE IMAGENS (reutilizável — listagem, detalhes)
     ---------------------------------------------------------------------- */
  function iniciarCarrossel(raiz) {
    if (!raiz || raiz.dataset.carrosselIniciado === '1') return;
    const pista = raiz.querySelector('.carrossel-pista');
    const slides = Array.from(raiz.querySelectorAll('.carrossel-slide'));
    const pontosWrap = raiz.querySelector('.carrossel-controlos');
    if (!pista || !slides.length || !pontosWrap) return;

    raiz.dataset.carrosselIniciado = '1';
    pontosWrap.innerHTML = '';
    let indiceAtual = 0;
    let temporizador = null;

    slides.forEach((_, i) => {
      const ponto = document.createElement('button');
      ponto.type = 'button';
      ponto.className = 'carrossel-ponto' + (i === 0 ? ' ativo' : '');
      ponto.setAttribute('aria-label', 'Ir para imagem ' + (i + 1));
      ponto.addEventListener('click', () => { irPara(i); reiniciarAuto(); });
      pontosWrap.appendChild(ponto);
    });
    const pontos = Array.from(pontosWrap.querySelectorAll('.carrossel-ponto'));

    function irPara(indice) {
      indiceAtual = (indice + slides.length) % slides.length;
      pista.style.transform = `translateX(-${indiceAtual * 100}%)`;
      pontos.forEach((p, i) => p.classList.toggle('ativo', i === indiceAtual));
    }

    const setaDir = raiz.querySelector('.carrossel-seta--dir');
    const setaEsq = raiz.querySelector('.carrossel-seta--esq');
    if (setaDir) setaDir.addEventListener('click', () => { irPara(indiceAtual + 1); reiniciarAuto(); });
    if (setaEsq) setaEsq.addEventListener('click', () => { irPara(indiceAtual - 1); reiniciarAuto(); });

    function autoAvancar() { irPara(indiceAtual + 1); }
    function reiniciarAuto() {
      clearInterval(temporizador);
      if (slides.length > 1) temporizador = setInterval(autoAvancar, 4800);
    }
    reiniciarAuto();
    raiz.addEventListener('mouseenter', () => clearInterval(temporizador));
    raiz.addEventListener('mouseleave', reiniciarAuto);

    let xInicial = null;
    raiz.addEventListener('touchstart', (e) => { xInicial = e.touches[0].clientX; }, { passive: true });
    raiz.addEventListener('touchend', (e) => {
      if (xInicial === null) return;
      const delta = e.changedTouches[0].clientX - xInicial;
      if (Math.abs(delta) > 40) irPara(indiceAtual + (delta < 0 ? 1 : -1));
      xInicial = null;
      reiniciarAuto();
    });
  }
  document.querySelectorAll('[data-carrossel]').forEach(iniciarCarrossel);

  /* ----------------------------------------------------------------------
     MODAL — AGENDAR VISITA (partilhado entre páginas)
     ---------------------------------------------------------------------- */
  const overlayAgendamento = document.getElementById('overlay-agendamento');
  const formAgendamento = document.getElementById('form-agendamento');
  const selectImovelModal = document.getElementById('agendamento-imovel');
  const modalTituloImovel = document.getElementById('modal-titulo-imovel');
  const formMsg = document.getElementById('agendamento-msg');
  const campoData = document.getElementById('agendamento-data');

  if (campoData) {
    campoData.min = new Date().toISOString().split('T')[0];
  }

  function preencherSelectImoveisModal(lista) {
    if (!selectImovelModal || !Array.isArray(lista)) return;
    const valorAtual = selectImovelModal.value;
    selectImovelModal.innerHTML = '<option value="" disabled>Escolha o imóvel</option>' +
      lista.map((im) => `<option value="${im.id}">${im.titulo} — ${formatarMZN(im.preco_mensal)}/mês</option>`).join('');
    if (valorAtual) selectImovelModal.value = valorAtual;
  }

  function abrirModalAgendamento(imovelId, imovelTitulo) {
    if (!overlayAgendamento || !formAgendamento) return;
    formMsg.className = 'form-msg';
    formMsg.textContent = '';
    formAgendamento.reset();

    if (imovelId) {
      selectImovelModal.value = imovelId;
      modalTituloImovel.textContent = imovelTitulo ? `Vamos agendar a sua visita a ${imovelTitulo}.` : 'Vamos conhecer este espaço.';
    } else {
      modalTituloImovel.textContent = 'Vamos conhecer este espaço.';
    }

    overlayAgendamento.classList.add('mostrar');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('agendamento-nome')?.focus(), 300);
  }

  function fecharModalAgendamento() {
    overlayAgendamento?.classList.remove('mostrar');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const gatilho = e.target.closest('[data-abrir-agendamento]');
    if (gatilho) {
      abrirModalAgendamento(gatilho.dataset.imovelId, gatilho.dataset.imovelTitulo);
    }
    if (e.target.closest('[data-fechar-modal]') || e.target === overlayAgendamento) {
      fecharModalAgendamento();
    }
  });

  if (formAgendamento) {
    formAgendamento.addEventListener('submit', async (e) => {
      e.preventDefault();
      const botao = formAgendamento.querySelector('button[type="submit"]');
      const textoOriginal = botao.textContent;
      botao.textContent = 'A enviar...';
      botao.disabled = true;

      const payload = {
        imovel_id: selectImovelModal.value,
        nome: document.getElementById('agendamento-nome').value,
        telefone: document.getElementById('agendamento-telefone').value,
        email: document.getElementById('agendamento-email').value,
        data_preferida: document.getElementById('agendamento-data').value,
        hora_preferida: document.getElementById('agendamento-hora').value,
        mensagem: document.getElementById('agendamento-mensagem').value
      };

      try {
        const resposta = await fetch('php/api/agendar_visita.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const dados = await resposta.json();

        if (dados.sucesso) {
          formMsg.className = 'form-msg sucesso';
          formMsg.textContent = dados.mensagem || 'Pedido enviado com sucesso!';
          formAgendamento.reset();
          setTimeout(fecharModalAgendamento, 2600);
        } else {
          formMsg.className = 'form-msg erro';
          formMsg.textContent = (dados.erros && dados.erros[0]) || dados.erro || 'Não foi possível enviar o pedido.';
        }
      } catch (erro) {
        formMsg.className = 'form-msg sucesso';
        formMsg.textContent = 'Pedido registado! (Ligue o servidor PHP + MySQL para gravar na base de dados.) A nossa equipa entrará em contacto.';
        formAgendamento.reset();
        setTimeout(fecharModalAgendamento, 3200);
      } finally {
        botao.textContent = textoOriginal;
        botao.disabled = false;
      }
    });
  }

  /* ----------------------------------------------------------------------
     MODAL — LOGIN (com seleção de perfil: inquilino/proprietário/admin)
     ---------------------------------------------------------------------- */
  const overlayLogin = document.getElementById('overlay-login');
  const formLogin = document.getElementById('form-login');
  const loginMsg = document.getElementById('login-msg');
  const loginTipoInput = document.getElementById('login-tipo');
  const abasPerfil = document.querySelectorAll('.aba-perfil');

  const ROTULOS_PERFIL = { inquilino: 'Inquilino', proprietario: 'Proprietário', administrador: 'Administrador' };

  function abrirModalLogin() {
    if (!overlayLogin) return;
    loginMsg.className = 'form-msg';
    loginMsg.textContent = '';
    formLogin?.reset();
    if (loginTipoInput) loginTipoInput.value = 'inquilino';
    abasPerfil.forEach((a, i) => {
      a.classList.toggle('ativo', i === 0);
      a.setAttribute('aria-selected', String(i === 0));
    });
    overlayLogin.classList.add('mostrar');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('login-email')?.focus(), 300);
  }

  function fecharModalLogin() {
    overlayLogin?.classList.remove('mostrar');
    document.body.style.overflow = '';
  }

  abasPerfil.forEach((aba) => {
    aba.addEventListener('click', () => {
      abasPerfil.forEach((a) => {
        a.classList.remove('ativo');
        a.setAttribute('aria-selected', 'false');
      });
      aba.classList.add('ativo');
      aba.setAttribute('aria-selected', 'true');
      if (loginTipoInput) loginTipoInput.value = aba.dataset.perfil;
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-abrir-login]')) abrirModalLogin();
    if (e.target.closest('[data-fechar-login]') || e.target === overlayLogin) fecharModalLogin();
  });

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const botao = formLogin.querySelector('button[type="submit"]');
      const textoOriginal = botao.textContent;
      botao.textContent = 'A entrar...';
      botao.disabled = true;

      const payload = {
        email: document.getElementById('login-email').value,
        senha: document.getElementById('login-senha').value,
        tipo: loginTipoInput.value
      };

      try {
        const resposta = await fetch('php/api/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const dados = await resposta.json();

        if (dados.sucesso) {
          loginMsg.className = 'form-msg sucesso';
          loginMsg.textContent = `Bem-vindo(a), ${dados.usuario.nome}! Sessão iniciada como ${ROTULOS_PERFIL[dados.usuario.tipo] || dados.usuario.tipo}.`;

          const destino = { proprietario: 'proprietario.html', administrador: 'admin.html' }[dados.usuario.tipo];
          if (destino) {
            setTimeout(() => { window.location.href = destino; }, 900);
          } else {
            setTimeout(fecharModalLogin, 2200);
          }
        } else {
          loginMsg.className = 'form-msg erro';
          loginMsg.textContent = (dados.erros && dados.erros[0]) || dados.erro || 'Não foi possível iniciar sessão.';
        }
      } catch (erro) {
        // Sem backend PHP ativo — segue o mesmo redireccionamento com base
        // no perfil escolhido, para a experiência de demonstração continuar
        // navegável mesmo sem servidor/MySQL ligado.
        const destino = { proprietario: 'proprietario.html', administrador: 'admin.html' }[loginTipoInput.value];
        if (destino) {
          loginMsg.className = 'form-msg sucesso';
          loginMsg.textContent = 'Sem ligação ao servidor — a abrir o painel em modo de demonstração…';
          setTimeout(() => { window.location.href = destino; }, 900);
        } else {
          loginMsg.className = 'form-msg erro';
          loginMsg.textContent = 'Sem ligação ao servidor. Ligue o PHP + MySQL (ver README) para testar o login, ou contacte-nos via WhatsApp.';
        }
      } finally {
        botao.textContent = textoOriginal;
        botao.disabled = false;
      }
    });
  }

  /* ----------------------------------------------------------------------
     TECLA ESCAPE — fecha modal, popup WhatsApp e menu móvel
     ---------------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    fecharModalAgendamento();
    fecharModalLogin();
    fecharPopupWhatsapp();
    if (navPrincipal?.classList.contains('aberto')) {
      navPrincipal.classList.remove('aberto');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ----------------------------------------------------------------------
     POPUP DO WHATSAPP
     ---------------------------------------------------------------------- */
  const popupWhatsapp = document.getElementById('whatsapp-popup');
  const linkWhatsappFlutuante = document.getElementById('whatsapp-flutuante-link');
  const linkWhatsappPopup = document.getElementById('whatsapp-popup-link');

  const mensagemWpp = encodeURIComponent('Olá! Vi o site da Intaka Village e gostaria de saber mais sobre as moradias disponíveis para arrendar.');
  const linkWpp = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensagemWpp}`;
  if (linkWhatsappFlutuante) linkWhatsappFlutuante.href = linkWpp;
  if (linkWhatsappPopup) linkWhatsappPopup.href = linkWpp;

  function fecharPopupWhatsapp() {
    popupWhatsapp?.classList.remove('mostrar');
  }

  if (popupWhatsapp) {
    const jaFechado = sessionStorage.getItem('intaka_wpp_fechado') === '1';
    if (!jaFechado) {
      setTimeout(() => popupWhatsapp.classList.add('mostrar'), 4500);
    }
    document.getElementById('whatsapp-popup-fechar')?.addEventListener('click', () => {
      fecharPopupWhatsapp();
      sessionStorage.setItem('intaka_wpp_fechado', '1');
    });
  }

  /* ----------------------------------------------------------------------
     RODAPÉ — ano automático
     ---------------------------------------------------------------------- */
  const anoEl = document.getElementById('ano-atual');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------------
     EXPORTAÇÃO — namespace partilhado
     ---------------------------------------------------------------------- */
  window.Intaka = {
    WHATSAPP_NUMERO,
    IMOVEIS_RESERVA,
    formatarMZN,
    iconeSVG,
    tipologiaDoImovel,
    observarRevelacoes,
    iniciarCarrossel,
    abrirModalAgendamento,
    fecharModalAgendamento,
    preencherSelectImoveisModal,
    favoritos: {
      obter: obterFavoritos,
      isFavorito,
      alternar: alternarFavorito
    }
  };

})();

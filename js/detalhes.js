/* =========================================================================
   INTAKA VILLAGE — detalhes.js
   Lógica específica de detalhes.html: carrega o imóvel pelo parâmetro
   ?id= da URL, renderiza galeria, especificações, mapa e liga os
   formulários de "Agendar Visita" e "Enviar Mensagem".
   Depende de js/common.js (deve ser incluído antes deste ficheiro).
   ========================================================================= */

(function () {
  'use strict';

  const {
    formatarMZN, iconeSVG, observarRevelacoes, iniciarCarrossel,
    abrirModalAgendamento, preencherSelectImoveisModal, IMOVEIS_RESERVA
  } = window.Intaka;

  const parametros = new URLSearchParams(window.location.search);
  const imovelId = parseInt(parametros.get('id') || '0', 10);

  const elConteudo = document.getElementById('detalhe-conteudo');
  const elCarregando = document.getElementById('detalhe-carregando');
  const elNaoEncontrado = document.getElementById('detalhe-nao-encontrado');

  /* ----------------------------------------------------------------------
     CARREGAR O IMÓVEL — tenta a API PHP, cai para dados de reserva
     ---------------------------------------------------------------------- */
  async function carregarImovel() {
    if (!imovelId) {
      mostrarNaoEncontrado();
      return;
    }

    let imovel = null;

    try {
      const resposta = await fetch(`php/api/imoveis.php?id=${imovelId}`, { headers: { Accept: 'application/json' } });
      if (!resposta.ok) throw new Error('API indisponível');
      const dados = await resposta.json();
      if (!dados.sucesso || !dados.imovel) throw new Error('Imóvel não encontrado na API');
      imovel = dados.imovel;
    } catch (erro) {
      imovel = IMOVEIS_RESERVA.find((im) => im.id === imovelId) || null;
    }

    if (!imovel) {
      mostrarNaoEncontrado();
      return;
    }

    renderizarImovel(imovel);
    carregarSemelhantes(imovel);
  }

  function mostrarNaoEncontrado() {
    elCarregando?.classList.remove('mostrar');
    elNaoEncontrado?.classList.add('mostrar');
    const breadcrumbTitulo = document.getElementById('breadcrumb-titulo');
    if (breadcrumbTitulo) breadcrumbTitulo.textContent = 'Imóvel não encontrado';
  }

  /* ----------------------------------------------------------------------
     RENDERIZAÇÃO
     ---------------------------------------------------------------------- */
  function renderizarImovel(imovel) {
    document.title = `${imovel.titulo} | Intaka Village`;

    // Breadcrumb
    document.getElementById('breadcrumb-titulo').textContent = imovel.titulo;

    // Cabeçalho
    document.getElementById('detalhe-selo').textContent = imovel.destaque ? 'Em destaque' : 'Arrendamento';
    document.getElementById('detalhe-selo').classList.toggle('selo--destaque', !!imovel.destaque);
    document.getElementById('detalhe-titulo').textContent = imovel.titulo;
    document.getElementById('detalhe-local').innerHTML = `${iconeSVG('pin')} ${imovel.endereco ? imovel.endereco + ' — ' : ''}${imovel.bairro}, ${imovel.cidade}`;

    // Galeria (reutiliza o componente de carrossel partilhado)
    const imagens = (imovel.imagens && imovel.imagens.length)
      ? imovel.imagens
      : [{ caminho: imovel.imagem_capa, legenda: imovel.titulo }];

    const pista = document.getElementById('galeria-pista');
    pista.innerHTML = imagens.map((img) => `
      <div class="carrossel-slide">
        <img src="${img.caminho}" alt="${img.legenda || imovel.titulo}">
        ${img.legenda ? `<span class="carrossel-legenda">${img.legenda}</span>` : ''}
      </div>
    `).join('');
    const galeria = document.getElementById('galeria-imovel');
    galeria.dataset.carrosselIniciado = '0';
    iniciarCarrossel(galeria);

    // Especificações
    document.getElementById('detalhe-specs').innerHTML = `
      <div>${iconeSVG('cama')}<strong>${imovel.quartos}</strong><span>Quartos</span></div>
      <div>${iconeSVG('banho')}<strong>${imovel.casas_banho}</strong><span>Casas de banho</span></div>
      <div>${iconeSVG('area')}<strong>${imovel.area_m2} m²</strong><span>Área total</span></div>
    `;

    // Descrição
    document.getElementById('detalhe-descricao').textContent =
      imovel.descricao || 'Descrição detalhada disponível em breve. Fale connosco para saber mais sobre este imóvel.';

    // Comodidades
    const comodidadesEl = document.getElementById('detalhe-comodidades');
    const listaComodidades = (imovel.comodidades || '').split(',').map((c) => c.trim()).filter(Boolean);
    if (listaComodidades.length) {
      comodidadesEl.innerHTML = listaComodidades.map((c) => `
        <span class="comodidade-chip">${iconeSVG('check')} ${c}</span>
      `).join('');
      comodidadesEl.closest('.detalhe-bloco').style.display = '';
    } else {
      comodidadesEl.closest('.detalhe-bloco').style.display = 'none';
    }

    // Sidebar — preço e tipo
    document.getElementById('sidebar-tipo').textContent = imovel.tipo;
    document.getElementById('sidebar-preco').textContent = formatarMZN(imovel.preco_mensal);

    // Botão agendar visita (sidebar) — pré-seleciona este imóvel no modal partilhado
    const btnAgendar = document.getElementById('sidebar-btn-agendar');
    btnAgendar.dataset.imovelId = imovel.id;
    btnAgendar.dataset.imovelTitulo = imovel.titulo;

    // Formulário de mensagem — guarda o id do imóvel num campo oculto
    document.getElementById('mensagem-imovel-id').value = imovel.id;
    document.getElementById('mensagem-imovel-nome').textContent = imovel.titulo;

    // Preenche também o select do modal de agendamento com pelo menos este imóvel
    preencherSelectImoveisModal(IMOVEIS_RESERVA);
    document.getElementById('agendamento-imovel').value = imovel.id;

    // Mapa (Leaflet + OpenStreetMap — sem necessidade de chave de API)
    iniciarMapa(imovel);

    // Mostrar conteúdo
    elCarregando?.classList.remove('mostrar');
    elConteudo.hidden = false;
    observarRevelacoes(elConteudo);
    requestAnimationFrame(() => {
      elConteudo.querySelectorAll('.reveal').forEach((el) => el.classList.add('em-vista'));
    });
  }

  /* ----------------------------------------------------------------------
     MAPA — Leaflet / OpenStreetMap (gratuito, sem chave de API)
     ---------------------------------------------------------------------- */
  function iniciarMapa(imovel) {
    const container = document.getElementById('mapa-imovel');
    const linkGoogle = document.getElementById('mapa-link-google');
    if (!container) return;

    const lat = parseFloat(imovel.latitude);
    const lng = parseFloat(imovel.longitude);

    if (!lat || !lng) {
      container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--carvao-suave);">Localização exata disponível mediante contacto com a nossa equipa.</p>';
      return;
    }

    if (linkGoogle) linkGoogle.href = `https://www.google.com/maps?q=${lat},${lng}`;

    if (typeof L === 'undefined') {
      // Biblioteca Leaflet não carregou (ex.: sem ligação à internet) — mostra alternativa estática
      container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--carvao-suave);">Mapa indisponível offline. Use o link "Abrir no Google Maps" abaixo.</p>';
      return;
    }

    const mapa = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(mapa);

    const iconeMarcador = L.divIcon({
      className: 'marcador-intaka',
      html: `<span style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;background:#E2673F;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 6px 14px rgba(0,0,0,.35);">
               <span style="transform:rotate(45deg);width:14px;height:14px;background:#fff;border-radius:50%;"></span>
             </span>`,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });

    L.marker([lat, lng], { icon: iconeMarcador }).addTo(mapa)
      .bindPopup(`<strong>${imovel.titulo}</strong><br>${imovel.bairro}, ${imovel.cidade}`);

    // Garante que o mapa recalcula o tamanho depois do fade-in da secção
    setTimeout(() => mapa.invalidateSize(), 400);
  }

  /* ----------------------------------------------------------------------
     IMÓVEIS SEMELHANTES (mesma tipologia ou bairro, excluindo o atual)
     ---------------------------------------------------------------------- */
  function carregarSemelhantes(imovelAtual) {
    const grelha = document.getElementById('semelhantes-grelha');
    const secao = document.getElementById('secao-semelhantes');
    if (!grelha) return;

    const candidatos = IMOVEIS_RESERVA.filter((im) => im.id !== imovelAtual.id);
    const semelhantes = candidatos
      .sort((a, b) => (a.tipo === imovelAtual.tipo ? -1 : 0) - (b.tipo === imovelAtual.tipo ? -1 : 0))
      .slice(0, 3);

    if (!semelhantes.length) {
      secao?.style.setProperty('display', 'none');
      return;
    }

    grelha.innerHTML = semelhantes.map((im) => `
      <article class="cartao-imovel reveal em-vista">
        <a href="detalhes.html?id=${im.id}" class="cartao-imovel-media" aria-label="Ver detalhes de ${im.titulo}">
          <span class="selo ${im.destaque ? 'selo--destaque' : ''}">${im.destaque ? 'Em destaque' : 'Arrendamento'}</span>
          <img src="${im.imagem_capa}" alt="${im.titulo}" loading="lazy">
        </a>
        <div class="cartao-imovel-corpo">
          <div class="cartao-imovel-local">${iconeSVG('pin')} ${im.bairro}, ${im.cidade}</div>
          <h3><a href="detalhes.html?id=${im.id}">${im.titulo}</a></h3>
          <div class="cartao-imovel-specs">
            <span>${iconeSVG('cama')} ${im.quartos} quartos</span>
            <span>${iconeSVG('banho')} ${im.casas_banho} wc</span>
            <span>${iconeSVG('area')} ${im.area_m2} m²</span>
          </div>
          <div class="cartao-imovel-rodape">
            <div class="preco"><strong>${formatarMZN(im.preco_mensal)}</strong><span>por mês</span></div>
            <a href="detalhes.html?id=${im.id}" class="btn-cartao">Ver detalhes ${iconeSVG('seta')}</a>
          </div>
        </div>
      </article>
    `).join('');
  }

  /* ----------------------------------------------------------------------
     BOTÃO "AGENDAR VISITA" DA SIDEBAR (abre o modal partilhado)
     ---------------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#sidebar-btn-agendar');
    if (btn) {
      abrirModalAgendamento(btn.dataset.imovelId, btn.dataset.imovelTitulo);
    }
  });

  /* ----------------------------------------------------------------------
     FORMULÁRIO — ENVIAR MENSAGEM
     ---------------------------------------------------------------------- */
  const formMensagem = document.getElementById('form-mensagem');
  const mensagemMsg = document.getElementById('mensagem-msg');

  if (formMensagem) {
    formMensagem.addEventListener('submit', async (e) => {
      e.preventDefault();
      const botao = formMensagem.querySelector('button[type="submit"]');
      const textoOriginal = botao.textContent;
      botao.textContent = 'A enviar...';
      botao.disabled = true;

      const payload = {
        imovel_id: document.getElementById('mensagem-imovel-id').value,
        nome: document.getElementById('mensagem-nome').value,
        contacto: document.getElementById('mensagem-contacto').value,
        mensagem: document.getElementById('mensagem-texto').value
      };

      try {
        const resposta = await fetch('php/api/enviar_mensagem.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const dados = await resposta.json();

        if (dados.sucesso) {
          mensagemMsg.className = 'form-msg sucesso';
          mensagemMsg.textContent = dados.mensagem || 'Mensagem enviada com sucesso!';
          formMensagem.reset();
        } else {
          mensagemMsg.className = 'form-msg erro';
          mensagemMsg.textContent = (dados.erros && dados.erros[0]) || dados.erro || 'Não foi possível enviar a mensagem.';
        }
      } catch (erro) {
        mensagemMsg.className = 'form-msg sucesso';
        mensagemMsg.textContent = 'Mensagem registada! (Ligue o servidor PHP + MySQL para gravar na base de dados.) A nossa equipa responde em breve.';
        formMensagem.reset();
      } finally {
        botao.textContent = textoOriginal;
        botao.disabled = false;
      }
    });
  }

  /* ----------------------------------------------------------------------
     INICIALIZAÇÃO
     ---------------------------------------------------------------------- */
  observarRevelacoes();
  carregarImovel();

})();

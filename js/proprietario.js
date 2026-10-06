/* =========================================================================
   INTAKA VILLAGE — proprietario.js
   Carrega e gere anúncios, visitas agendadas e mensagens do proprietário.
   Tenta sempre a API PHP primeiro; se não houver servidor disponível,
   usa dados de demonstração em memória (sem persistência) e mostra o
   banner de "modo de demonstração".
   Depende de js/common.js e js/dashboard-common.js.
   ========================================================================= */

(function () {
  'use strict';

  const { formatarMZN, iconeSVG, IMOVEIS_RESERVA } = window.Intaka;
  const { mostrarToast, confirmarAcao, renderBadge, BADGES_IMOVEL, BADGES_VISITA, BADGES_MENSAGEM, mostrarBannerDemo, irParaSecao } = window.Dashboard;

  let modoOffline = false;
  let anuncios = [];
  let visitas = [];
  let mensagens = [];
  let proximoIdLocal = 9000; // ids fictícios para criações em modo offline

  /* ----------------------------------------------------------------------
     DADOS DE RESERVA (modo demonstração, sem backend PHP ativo)
     ---------------------------------------------------------------------- */
  function anunciosReserva() {
    return JSON.parse(JSON.stringify(IMOVEIS_RESERVA)).map((im) => ({ ...im, status: 'disponivel' }));
  }

  function visitasReserva() {
    return [
      { id: 1, imovel_id: 1, imovel_titulo: 'Apartamento T1 Vista Jardim', imovel_imagem: 'images/sala-estar-1.jpg', nome: 'Carlos Muchanga', telefone: '84 111 2233', email: 'carlos@example.com', data_preferida: '2026-09-02', hora_preferida: '10:00', mensagem: '', status: 'pendente' },
      { id: 2, imovel_id: 3, imovel_titulo: 'Moradia T2 Acácia', imovel_imagem: 'images/fachada-casa-1.jpg', nome: 'Ana Cumbe', telefone: '82 555 4433', email: '', data_preferida: '2026-09-04', hora_preferida: '15:30', mensagem: 'Posso levar a família?', status: 'confirmada' },
      { id: 3, imovel_id: 5, imovel_titulo: 'Moradia T3 Coral', imovel_imagem: 'images/quarto-2.jpg', nome: 'Jorge Nhaca', telefone: '87 222 9988', email: 'jorge@example.com', data_preferida: '2026-08-20', hora_preferida: '09:00', mensagem: '', status: 'concluida' }
    ];
  }

  function mensagensReserva() {
    return [
      { id: 1, imovel_id: 2, imovel_titulo: 'Apartamento T2 Horizonte', remetente_nome: 'Beatriz Sitoe', remetente_contacto: '83 444 1122', conteudo: 'Bom dia, o imóvel ainda está disponível para setembro?', status: 'nao_lida', criado_em: '2026-08-20 09:15:00' },
      { id: 2, imovel_id: 4, imovel_titulo: 'Moradia T3 Baobá', remetente_nome: 'Miguel Tembe', remetente_contacto: '84 999 3321', conteudo: 'Gostaria de saber se aceitam animais de estimação.', status: 'lida', criado_em: '2026-08-18 17:40:00' }
    ];
  }

  /* ----------------------------------------------------------------------
     FORMATAÇÃO
     ---------------------------------------------------------------------- */
  function formatarData(dataISO) {
    if (!dataISO) return '—';
    const [ano, mes, dia] = dataISO.split('-');
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(dataObj);
  }

  function truncar(texto, tamanho) {
    if (!texto) return '';
    return texto.length > tamanho ? texto.slice(0, tamanho).trim() + '…' : texto;
  }

  /* ----------------------------------------------------------------------
     CARREGAMENTO DE DADOS
     ---------------------------------------------------------------------- */
  async function carregarAnuncios() {
    try {
      const resp = await fetch('php/api/gestao_imoveis.php');
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
      anuncios = dados.imoveis;
      return true;
    } catch (erro) {
      anuncios = anunciosReserva();
      return false;
    }
  }

  async function carregarVisitas() {
    try {
      const resp = await fetch('php/api/gestao_visitas.php');
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
      visitas = dados.visitas;
      return true;
    } catch (erro) {
      visitas = visitasReserva();
      return false;
    }
  }

  async function carregarMensagens() {
    try {
      const resp = await fetch('php/api/gestao_mensagens.php');
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
      mensagens = dados.mensagens;
      return true;
    } catch (erro) {
      mensagens = mensagensReserva();
      return false;
    }
  }

  async function carregarTudo() {
    const [okA, okV, okM] = await Promise.all([carregarAnuncios(), carregarVisitas(), carregarMensagens()]);
    modoOffline = !okA || !okV || !okM;
    if (modoOffline) mostrarBannerDemo();
    renderizarTudo();
  }

  function renderizarTudo() {
    renderKPIs();
    renderProximasVisitas();
    renderAnuncios();
    renderVisitas();
    renderMensagens();
  }

  /* ----------------------------------------------------------------------
     KPIs + CONTAGENS DA SIDEBAR
     ---------------------------------------------------------------------- */
  function renderKPIs() {
    const disponiveis = anuncios.filter((a) => (a.status || 'disponivel') === 'disponivel').length;
    const visitasPendentes = visitas.filter((v) => v.status === 'pendente').length;
    const mensagensNaoLidas = mensagens.filter((m) => m.status === 'nao_lida').length;

    document.getElementById('kpi-total-anuncios').textContent = anuncios.length;
    document.getElementById('kpi-disponiveis').textContent = disponiveis;
    document.getElementById('kpi-visitas-pendentes').textContent = visitasPendentes;
    document.getElementById('kpi-mensagens-nao-lidas').textContent = mensagensNaoLidas;

    document.getElementById('contagem-anuncios').textContent = anuncios.length;
    document.getElementById('contagem-visitas').textContent = visitas.length;
    document.getElementById('contagem-mensagens').textContent = mensagensNaoLidas;
  }

  /* ----------------------------------------------------------------------
     VISÃO GERAL — próximas visitas
     ---------------------------------------------------------------------- */
  function renderProximasVisitas() {
    const corpo = document.getElementById('tbody-proximas-visitas');
    const vazio = document.getElementById('vazio-proximas-visitas');
    const lista = [...visitas]
      .filter((v) => v.status !== 'cancelada')
      .sort((a, b) => (a.data_preferida + a.hora_preferida).localeCompare(b.data_preferida + b.hora_preferida))
      .slice(0, 5);

    corpo.innerHTML = lista.map((v) => `
      <tr>
        <td><strong style="color:var(--verde-profundo)">${v.imovel_titulo}</strong></td>
        <td>${v.nome}</td>
        <td>${formatarData(v.data_preferida)}</td>
        <td>${v.hora_preferida}</td>
        <td>${renderBadge(BADGES_VISITA, v.status)}</td>
      </tr>
    `).join('');

    vazio.classList.toggle('mostrar', !lista.length);
  }

  /* ----------------------------------------------------------------------
     MEUS ANÚNCIOS
     ---------------------------------------------------------------------- */
  function renderAnuncios() {
    const corpo = document.getElementById('tbody-anuncios');
    const vazio = document.getElementById('vazio-anuncios');

    corpo.innerHTML = anuncios.map((a) => `
      <tr data-linha-anuncio="${a.id}">
        <td>
          <div class="tabela-imovel">
            <img src="${a.imagem_capa}" alt="${a.titulo}">
            <div><strong>${a.titulo}</strong><span>${a.bairro}, ${a.cidade || 'Maputo'}</span></div>
          </div>
        </td>
        <td>${a.tipo}</td>
        <td>${formatarMZN(a.preco_mensal)}</td>
        <td>
          <select class="select-inline" data-status-anuncio="${a.id}">
            <option value="disponivel" ${a.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
            <option value="reservado" ${a.status === 'reservado' ? 'selected' : ''}>Reservado</option>
            <option value="arrendado" ${a.status === 'arrendado' ? 'selected' : ''}>Arrendado / Ocupado</option>
          </select>
        </td>
        <td>
          <div class="tabela-acoes">
            <button type="button" class="btn-icone" data-editar-anuncio="${a.id}" aria-label="Editar anúncio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button type="button" class="btn-icone btn-icone--perigo" data-eliminar-anuncio="${a.id}" aria-label="Eliminar anúncio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    vazio.classList.toggle('mostrar', !anuncios.length);
  }

  function encontrarAnuncio(id) {
    return anuncios.find((a) => Number(a.id) === Number(id));
  }

  /* ----------------------------------------------------------------------
     MODAL — CRIAR / EDITAR ANÚNCIO
     ---------------------------------------------------------------------- */
  const overlayAnuncio = document.getElementById('overlay-anuncio');
  const formAnuncio = document.getElementById('form-anuncio');
  const anuncioMsg = document.getElementById('anuncio-msg');

  function abrirModalAnuncio(anuncio) {
    formAnuncio.reset();
    anuncioMsg.className = 'form-msg';
    anuncioMsg.textContent = '';

    const editando = !!anuncio;
    document.getElementById('modal-eyebrow-anuncio').textContent = editando ? 'Editar anúncio' : 'Novo anúncio';
    document.getElementById('modal-titulo-anuncio').textContent = editando ? 'Editar imóvel' : 'Publicar novo imóvel';
    document.getElementById('btn-guardar-anuncio').textContent = editando ? 'Guardar Alterações' : 'Publicar Anúncio';

    document.getElementById('anuncio-id').value = editando ? anuncio.id : '';
    document.getElementById('anuncio-titulo').value = editando ? anuncio.titulo : '';
    document.getElementById('anuncio-tipo').value = editando ? anuncio.tipo : 'Moradia T2';
    document.getElementById('anuncio-estado').value = editando ? (anuncio.status || 'disponivel') : 'disponivel';
    document.getElementById('anuncio-bairro').value = editando ? anuncio.bairro : 'Intaka';
    document.getElementById('anuncio-cidade').value = editando ? (anuncio.cidade || 'Maputo') : 'Maputo';
    document.getElementById('anuncio-endereco').value = editando ? (anuncio.endereco || '') : '';
    document.getElementById('anuncio-preco').value = editando ? anuncio.preco_mensal : '';
    document.getElementById('anuncio-area').value = editando ? anuncio.area_m2 : '';
    document.getElementById('anuncio-quartos').value = editando ? anuncio.quartos : '';
    document.getElementById('anuncio-wc').value = editando ? anuncio.casas_banho : '';
    document.getElementById('anuncio-imagem').value = editando ? anuncio.imagem_capa : '';
    document.getElementById('anuncio-descricao').value = editando ? (anuncio.descricao || '') : '';
    document.getElementById('anuncio-comodidades').value = editando ? (anuncio.comodidades || '') : '';
    document.getElementById('anuncio-destaque').checked = editando ? !!Number(anuncio.destaque) : false;

    overlayAnuncio.classList.add('mostrar');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('anuncio-titulo')?.focus(), 300);
  }

  function fecharModalAnuncio() {
    overlayAnuncio.classList.remove('mostrar');
    document.body.style.overflow = '';
  }

  document.getElementById('btn-novo-anuncio').addEventListener('click', () => abrirModalAnuncio(null));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar-anuncio]') || e.target === overlayAnuncio) fecharModalAnuncio();

    const btnEditar = e.target.closest('[data-editar-anuncio]');
    if (btnEditar) abrirModalAnuncio(encontrarAnuncio(btnEditar.dataset.editarAnuncio));

    const btnEliminar = e.target.closest('[data-eliminar-anuncio]');
    if (btnEliminar) eliminarAnuncio(btnEliminar.dataset.eliminarAnuncio);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModalAnuncio(); });

  formAnuncio.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idExistente = document.getElementById('anuncio-id').value;
    const payload = {
      titulo: document.getElementById('anuncio-titulo').value.trim(),
      tipo: document.getElementById('anuncio-tipo').value,
      status: document.getElementById('anuncio-estado').value,
      bairro: document.getElementById('anuncio-bairro').value.trim(),
      cidade: document.getElementById('anuncio-cidade').value.trim() || 'Maputo',
      endereco: document.getElementById('anuncio-endereco').value.trim(),
      preco_mensal: parseFloat(document.getElementById('anuncio-preco').value),
      area_m2: parseFloat(document.getElementById('anuncio-area').value),
      quartos: parseInt(document.getElementById('anuncio-quartos').value, 10),
      casas_banho: parseInt(document.getElementById('anuncio-wc').value, 10),
      imagem_capa: document.getElementById('anuncio-imagem').value.trim(),
      descricao: document.getElementById('anuncio-descricao').value.trim(),
      comodidades: document.getElementById('anuncio-comodidades').value.trim(),
      destaque: document.getElementById('anuncio-destaque').checked
    };

    const botao = document.getElementById('btn-guardar-anuncio');
    const textoOriginal = botao.textContent;
    botao.textContent = 'A guardar...';
    botao.disabled = true;

    try {
      if (modoOffline) throw new Error('offline');

      const url = idExistente ? `php/api/gestao_imoveis.php?id=${idExistente}` : 'php/api/gestao_imoveis.php';
      const resp = await fetch(url, {
        method: idExistente ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const dados = await resp.json();

      if (!dados.sucesso) {
        anuncioMsg.className = 'form-msg erro';
        anuncioMsg.textContent = (dados.erros && dados.erros[0]) || dados.erro || 'Não foi possível guardar o anúncio.';
        return;
      }

      await carregarAnuncios();
      renderizarTudo();
      mostrarToast(idExistente ? 'Anúncio atualizado com sucesso.' : 'Anúncio publicado com sucesso.');
      fecharModalAnuncio();

    } catch (erro) {
      // Modo offline / sem backend — atualiza apenas em memória
      if (idExistente) {
        const indice = anuncios.findIndex((a) => Number(a.id) === Number(idExistente));
        if (indice > -1) anuncios[indice] = { ...anuncios[indice], ...payload, id: Number(idExistente) };
      } else {
        anuncios.unshift({ ...payload, id: proximoIdLocal++, criado_em: new Date().toISOString() });
      }
      renderizarTudo();
      mostrarToast('Anúncio guardado localmente (modo de demonstração — sem backend ligado).');
      fecharModalAnuncio();
    } finally {
      botao.textContent = textoOriginal;
      botao.disabled = false;
    }
  });

  /* ----------------------------------------------------------------------
     AÇÕES — ANÚNCIOS (mudar estado / eliminar)
     ---------------------------------------------------------------------- */
  document.addEventListener('change', async (e) => {
    const select = e.target.closest('[data-status-anuncio]');
    if (!select) return;
    const id = select.dataset.statusAnuncio;
    const novoStatus = select.value;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_imoveis.php?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
    } catch (erro) {
      // segue para atualização local mesmo assim
    }

    const anuncio = encontrarAnuncio(id);
    if (anuncio) anuncio.status = novoStatus;
    renderKPIs();
    mostrarToast('Estado do imóvel atualizado.');
  });

  async function eliminarAnuncio(id) {
    if (!confirmarAcao('Tem a certeza que quer eliminar este anúncio? Esta ação não pode ser desfeita.')) return;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_imoveis.php?id=${id}`, { method: 'DELETE' });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
    } catch (erro) {
      // segue para remoção local mesmo assim
    }

    anuncios = anuncios.filter((a) => Number(a.id) !== Number(id));
    renderizarTudo();
    mostrarToast('Anúncio eliminado.');
  }

  /* ----------------------------------------------------------------------
     VISITAS AGENDADAS
     ---------------------------------------------------------------------- */
  function renderVisitas() {
    const corpo = document.getElementById('tbody-visitas');
    const vazio = document.getElementById('vazio-visitas');
    const lista = [...visitas].sort((a, b) => (b.data_preferida + b.hora_preferida).localeCompare(a.data_preferida + a.hora_preferida));

    corpo.innerHTML = lista.map((v) => `
      <tr>
        <td><strong style="color:var(--verde-profundo)">${v.imovel_titulo}</strong></td>
        <td>${v.nome}</td>
        <td>${v.telefone}${v.email ? '<br><span style="color:var(--carvao-suave)">' + v.email + '</span>' : ''}</td>
        <td>${formatarData(v.data_preferida)} · ${v.hora_preferida}</td>
        <td>
          <select class="select-inline" data-status-visita="${v.id}">
            <option value="pendente" ${v.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="confirmada" ${v.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
            <option value="concluida" ${v.status === 'concluida' ? 'selected' : ''}>Concluída</option>
            <option value="cancelada" ${v.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
          </select>
        </td>
        <td>
          <div class="tabela-acoes">
            <button type="button" class="btn-icone btn-icone--perigo" data-eliminar-visita="${v.id}" aria-label="Eliminar visita">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    vazio.classList.toggle('mostrar', !lista.length);
  }

  document.addEventListener('change', async (e) => {
    const select = e.target.closest('[data-status-visita]');
    if (!select) return;
    const id = select.dataset.statusVisita;
    const novoStatus = select.value;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_visitas.php?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
    } catch (erro) { /* atualiza localmente na mesma */ }

    const visita = visitas.find((v) => Number(v.id) === Number(id));
    if (visita) visita.status = novoStatus;
    renderKPIs();
    renderProximasVisitas();
    mostrarToast('Estado da visita atualizado.');
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-eliminar-visita]');
    if (!btn) return;
    const id = btn.dataset.eliminarVisita;
    if (!confirmarAcao('Eliminar este pedido de visita?')) return;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_visitas.php?id=${id}`, { method: 'DELETE' });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
    } catch (erro) { /* remove localmente na mesma */ }

    visitas = visitas.filter((v) => Number(v.id) !== Number(id));
    renderizarTudo();
    mostrarToast('Visita eliminada.');
  });

  /* ----------------------------------------------------------------------
     MENSAGENS
     ---------------------------------------------------------------------- */
  function renderMensagens() {
    const corpo = document.getElementById('tbody-mensagens');
    const vazio = document.getElementById('vazio-mensagens');

    corpo.innerHTML = mensagens.map((m) => `
      <tr>
        <td><strong style="color:var(--verde-profundo)">${m.remetente_nome}</strong></td>
        <td>${m.remetente_contacto}</td>
        <td>${m.imovel_titulo || '—'}</td>
        <td title="${m.conteudo}">${truncar(m.conteudo, 48)}</td>
        <td>${renderBadge(BADGES_MENSAGEM, m.status)}</td>
        <td>
          <div class="tabela-acoes">
            <button type="button" class="btn-icone" data-alternar-mensagem="${m.id}" aria-label="Marcar como lida/não lida">
              ${iconeSVG('check')}
            </button>
            <button type="button" class="btn-icone btn-icone--perigo" data-eliminar-mensagem="${m.id}" aria-label="Eliminar mensagem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    vazio.classList.toggle('mostrar', !mensagens.length);
  }

  document.addEventListener('click', async (e) => {
    const btnAlternar = e.target.closest('[data-alternar-mensagem]');
    if (btnAlternar) {
      const id = btnAlternar.dataset.alternarMensagem;
      const msg = mensagens.find((m) => Number(m.id) === Number(id));
      const novoStatus = msg && msg.status === 'lida' ? 'nao_lida' : 'lida';

      try {
        if (modoOffline) throw new Error('offline');
        const resp = await fetch(`php/api/gestao_mensagens.php?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: novoStatus })
        });
        const dados = await resp.json();
        if (!dados.sucesso) throw new Error();
      } catch (erro) { /* atualiza localmente */ }

      if (msg) msg.status = novoStatus;
      renderKPIs();
      renderMensagens();
      mostrarToast(novoStatus === 'lida' ? 'Mensagem marcada como lida.' : 'Mensagem marcada como não lida.');
    }

    const btnEliminar = e.target.closest('[data-eliminar-mensagem]');
    if (btnEliminar) {
      const id = btnEliminar.dataset.eliminarMensagem;
      if (!confirmarAcao('Eliminar esta mensagem?')) return;

      try {
        if (modoOffline) throw new Error('offline');
        const resp = await fetch(`php/api/gestao_mensagens.php?id=${id}`, { method: 'DELETE' });
        const dados = await resp.json();
        if (!dados.sucesso) throw new Error();
      } catch (erro) { /* remove localmente */ }

      mensagens = mensagens.filter((m) => Number(m.id) !== Number(id));
      renderizarTudo();
      mostrarToast('Mensagem eliminada.');
    }
  });

  /* ----------------------------------------------------------------------
     INICIALIZAÇÃO
     ---------------------------------------------------------------------- */
  carregarTudo();

})();

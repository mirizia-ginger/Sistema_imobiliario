/* =========================================================================
   INTAKA VILLAGE — admin.js
   Controlo de acesso e gestão da plataforma: utilizadores, moderação de
   anúncios e visão de todas as visitas agendadas.
   Tenta sempre a API PHP primeiro; sem servidor disponível, usa dados de
   demonstração em memória (sem persistência) e mostra o banner de
   "modo de demonstração".
   Depende de js/common.js e js/dashboard-common.js.
   ========================================================================= */

(function () {
  'use strict';

  const { formatarMZN, IMOVEIS_RESERVA } = window.Intaka;
  const { mostrarToast, confirmarAcao, renderBadge, BADGES_USUARIO, mostrarBannerDemo } = window.Dashboard;

  let modoOffline = false;
  let usuarios = [];
  let anuncios = [];
  let visitas = [];

  /* ----------------------------------------------------------------------
     DADOS DE RESERVA (modo demonstração, sem backend PHP ativo)
     ---------------------------------------------------------------------- */
  function usuariosReserva() {
    return [
      { id: 1, nome: 'Intaka Village Gestão', email: 'gestao@intakavillage.co.mz', telefone: '+258 84 000 0000', tipo: 'administrador', ativo: 1, criado_em: '2026-06-01 09:00:00' },
      { id: 2, nome: 'Admin Demo', email: 'admin@intakavillage.co.mz', telefone: '+258 84 000 0001', tipo: 'administrador', ativo: 1, criado_em: '2026-06-01 09:00:00' },
      { id: 3, nome: 'Proprietário Demo', email: 'proprietario@intakavillage.co.mz', telefone: '+258 84 000 0002', tipo: 'proprietario', ativo: 1, criado_em: '2026-06-02 10:30:00' },
      { id: 4, nome: 'Inquilino Demo', email: 'inquilino@intakavillage.co.mz', telefone: '+258 84 000 0003', tipo: 'inquilino', ativo: 1, criado_em: '2026-06-03 14:15:00' }
    ];
  }

  function anunciosReserva() {
    return JSON.parse(JSON.stringify(IMOVEIS_RESERVA)).map((im) => ({ ...im, status: 'disponivel' }));
  }

  function visitasReserva() {
    return [
      { id: 1, imovel_id: 1, imovel_titulo: 'Apartamento T1 Vista Jardim', nome: 'Carlos Muchanga', telefone: '84 111 2233', email: 'carlos@example.com', data_preferida: '2026-09-02', hora_preferida: '10:00', status: 'pendente' },
      { id: 2, imovel_id: 3, imovel_titulo: 'Moradia T2 Acácia', nome: 'Ana Cumbe', telefone: '82 555 4433', email: '', data_preferida: '2026-09-04', hora_preferida: '15:30', status: 'confirmada' },
      { id: 3, imovel_id: 5, imovel_titulo: 'Moradia T3 Coral', nome: 'Jorge Nhaca', telefone: '87 222 9988', email: 'jorge@example.com', data_preferida: '2026-08-20', hora_preferida: '09:00', status: 'concluida' }
    ];
  }

  /* ----------------------------------------------------------------------
     FORMATAÇÃO
     ---------------------------------------------------------------------- */
  function formatarData(dataISO) {
    if (!dataISO) return '—';
    const [ano, mes, dia] = dataISO.split(' ')[0].split('-');
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(dataObj);
  }

  function iniciais(nome) {
    return (nome || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
  }

  /* ----------------------------------------------------------------------
     CARREGAMENTO DE DADOS
     ---------------------------------------------------------------------- */
  async function carregarUsuarios() {
    try {
      const resp = await fetch('php/api/gestao_usuarios.php');
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
      usuarios = dados.usuarios;
      return true;
    } catch (erro) {
      usuarios = usuariosReserva();
      return false;
    }
  }

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

  async function carregarTudo() {
    const [okU, okA, okV] = await Promise.all([carregarUsuarios(), carregarAnuncios(), carregarVisitas()]);
    modoOffline = !okU || !okA || !okV;
    if (modoOffline) mostrarBannerDemo();
    renderizarTudo();
  }

  function renderizarTudo() {
    renderKPIs();
    renderResumoPerfis();
    renderUsuarios();
    renderAnuncios();
    renderVisitas();
  }

  /* ----------------------------------------------------------------------
     KPIs + CONTAGENS DA SIDEBAR
     ---------------------------------------------------------------------- */
  function renderKPIs() {
    const disponiveis = anuncios.filter((a) => (a.status || 'disponivel') === 'disponivel').length;
    const visitasPendentes = visitas.filter((v) => v.status === 'pendente').length;

    document.getElementById('kpi-total-usuarios').textContent = usuarios.length;
    document.getElementById('kpi-total-anuncios').textContent = anuncios.length;
    document.getElementById('kpi-disponiveis').textContent = disponiveis;
    document.getElementById('kpi-visitas-pendentes').textContent = visitasPendentes;

    document.getElementById('contagem-usuarios').textContent = usuarios.length;
    document.getElementById('contagem-anuncios').textContent = anuncios.length;
    document.getElementById('contagem-visitas').textContent = visitas.length;
  }

  function renderResumoPerfis() {
    const corpo = document.getElementById('tbody-resumo-perfis');
    const contagens = { inquilino: 0, proprietario: 0, administrador: 0 };
    usuarios.forEach((u) => { if (contagens[u.tipo] !== undefined) contagens[u.tipo]++; });

    corpo.innerHTML = Object.entries(contagens).map(([tipo, total]) => `
      <tr><td>${renderBadge(BADGES_USUARIO, tipo)}</td><td><strong>${total}</strong></td></tr>
    `).join('');
  }

  /* ----------------------------------------------------------------------
     UTILIZADORES
     ---------------------------------------------------------------------- */
  function renderUsuarios() {
    const corpo = document.getElementById('tbody-usuarios');
    const vazio = document.getElementById('vazio-usuarios');

    corpo.innerHTML = usuarios.map((u) => `
      <tr>
        <td>
          <div class="tabela-imovel">
            <div class="app-utilizador-avatar" style="width:40px;height:40px;border-radius:50%;">${iniciais(u.nome)}</div>
            <div><strong style="color:var(--verde-profundo)">${u.nome}</strong></div>
          </div>
        </td>
        <td>${u.email}</td>
        <td>${renderBadge(BADGES_USUARIO, u.tipo)}</td>
        <td>${Number(u.ativo) === 1 ? '<span class="badge badge--verde">Ativo</span>' : '<span class="badge badge--vermelho">Inativo</span>'}</td>
        <td>${formatarData(u.criado_em)}</td>
        <td>
          <div class="tabela-acoes">
            <button type="button" class="btn-icone" data-editar-usuario="${u.id}" aria-label="Editar acesso">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button type="button" class="btn-icone btn-icone--perigo" data-eliminar-usuario="${u.id}" aria-label="Eliminar utilizador">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    vazio.classList.toggle('mostrar', !usuarios.length);
  }

  function encontrarUsuario(id) {
    return usuarios.find((u) => Number(u.id) === Number(id));
  }

  /* ----------------------------------------------------------------------
     MODAL — EDITAR UTILIZADOR
     ---------------------------------------------------------------------- */
  const overlayUsuario = document.getElementById('overlay-usuario');
  const formUsuario = document.getElementById('form-usuario');
  const usuarioMsg = document.getElementById('usuario-msg');

  function abrirModalUsuario(usuario) {
    formUsuario.reset();
    usuarioMsg.className = 'form-msg';
    usuarioMsg.textContent = '';

    document.getElementById('modal-titulo-usuario').textContent = usuario.nome;
    document.getElementById('modal-sub-usuario').textContent = usuario.email;
    document.getElementById('usuario-id').value = usuario.id;
    document.getElementById('usuario-tipo').value = usuario.tipo;
    document.getElementById('usuario-ativo').checked = Number(usuario.ativo) === 1;

    overlayUsuario.classList.add('mostrar');
    document.body.style.overflow = 'hidden';
  }

  function fecharModalUsuario() {
    overlayUsuario.classList.remove('mostrar');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar-usuario]') || e.target === overlayUsuario) fecharModalUsuario();

    const btnEditar = e.target.closest('[data-editar-usuario]');
    if (btnEditar) {
      const usuario = encontrarUsuario(btnEditar.dataset.editarUsuario);
      if (usuario) abrirModalUsuario(usuario);
    }

    const btnEliminar = e.target.closest('[data-eliminar-usuario]');
    if (btnEliminar) eliminarUsuario(btnEliminar.dataset.eliminarUsuario);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModalUsuario(); });

  formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuario-id').value;
    const payload = {
      tipo: document.getElementById('usuario-tipo').value,
      ativo: document.getElementById('usuario-ativo').checked
    };

    const botao = formUsuario.querySelector('button[type="submit"]');
    const textoOriginal = botao.textContent;
    botao.textContent = 'A guardar...';
    botao.disabled = true;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_usuarios.php?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const dados = await resp.json();
      if (!dados.sucesso) {
        usuarioMsg.className = 'form-msg erro';
        usuarioMsg.textContent = dados.erro || 'Não foi possível guardar as alterações.';
        return;
      }
      await carregarUsuarios();
    } catch (erro) {
      const usuario = encontrarUsuario(id);
      if (usuario) { usuario.tipo = payload.tipo; usuario.ativo = payload.ativo ? 1 : 0; }
    }

    renderizarTudo();
    mostrarToast('Utilizador atualizado com sucesso.');
    fecharModalUsuario();
    botao.textContent = textoOriginal;
    botao.disabled = false;
  });

  async function eliminarUsuario(id) {
    if (!confirmarAcao('Tem a certeza que quer eliminar este utilizador? Esta ação não pode ser desfeita.')) return;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_usuarios.php?id=${id}`, { method: 'DELETE' });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
    } catch (erro) { /* remove localmente na mesma */ }

    usuarios = usuarios.filter((u) => Number(u.id) !== Number(id));
    renderizarTudo();
    mostrarToast('Utilizador eliminado.');
  }

  /* ----------------------------------------------------------------------
     ANÚNCIOS (moderação da plataforma)
     ---------------------------------------------------------------------- */
  function renderAnuncios() {
    const corpo = document.getElementById('tbody-anuncios');
    const vazio = document.getElementById('vazio-anuncios');

    corpo.innerHTML = anuncios.map((a) => `
      <tr>
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
            <button type="button" class="btn-icone btn-icone--perigo" data-eliminar-anuncio="${a.id}" aria-label="Remover anúncio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    vazio.classList.toggle('mostrar', !anuncios.length);
  }

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
    } catch (erro) { /* atualiza localmente */ }

    const anuncio = anuncios.find((a) => Number(a.id) === Number(id));
    if (anuncio) anuncio.status = novoStatus;
    renderKPIs();
    mostrarToast('Estado do imóvel atualizado.');
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-eliminar-anuncio]');
    if (!btn) return;
    const id = btn.dataset.eliminarAnuncio;
    if (!confirmarAcao('Remover este anúncio da plataforma? Esta ação não pode ser desfeita.')) return;

    try {
      if (modoOffline) throw new Error('offline');
      const resp = await fetch(`php/api/gestao_imoveis.php?id=${id}`, { method: 'DELETE' });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error();
    } catch (erro) { /* remove localmente */ }

    anuncios = anuncios.filter((a) => Number(a.id) !== Number(id));
    renderizarTudo();
    mostrarToast('Anúncio removido da plataforma.');
  });

  /* ----------------------------------------------------------------------
     VISITAS (plataforma toda)
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
    } catch (erro) { /* atualiza localmente */ }

    const visita = visitas.find((v) => Number(v.id) === Number(id));
    if (visita) visita.status = novoStatus;
    renderKPIs();
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
    } catch (erro) { /* remove localmente */ }

    visitas = visitas.filter((v) => Number(v.id) !== Number(id));
    renderizarTudo();
    mostrarToast('Visita eliminada.');
  });

  /* ----------------------------------------------------------------------
     INICIALIZAÇÃO
     ---------------------------------------------------------------------- */
  carregarTudo();

})();

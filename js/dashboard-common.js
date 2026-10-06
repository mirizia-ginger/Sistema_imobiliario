/* =========================================================================
   INTAKA VILLAGE — dashboard-common.js
   Comportamento partilhado pelos painéis proprietario.html e admin.html:
   navegação por secções, sidebar em ecrãs pequenos e notificações toast.
   Depende de js/common.js (para os ícones SVG) — incluir antes deste.
   ========================================================================= */

(function () {
  'use strict';

  const { iconeSVG } = window.Intaka || { iconeSVG: () => '' };

  /* ----------------------------------------------------------------------
     SIDEBAR (ecrãs pequenos)
     ---------------------------------------------------------------------- */
  const sidebar = document.querySelector('.app-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarFechar = document.getElementById('sidebar-fechar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  function abrirSidebar() {
    sidebar?.classList.add('aberto');
    sidebarOverlay?.classList.add('mostrar');
  }
  function fecharSidebar() {
    sidebar?.classList.remove('aberto');
    sidebarOverlay?.classList.remove('mostrar');
  }
  sidebarToggle?.addEventListener('click', abrirSidebar);
  sidebarFechar?.addEventListener('click', fecharSidebar);
  sidebarOverlay?.addEventListener('click', fecharSidebar);

  /* ----------------------------------------------------------------------
     NAVEGAÇÃO ENTRE SECÇÕES (abas do painel)
     ---------------------------------------------------------------------- */
  const navItems = document.querySelectorAll('.app-nav-item[data-secao]');
  const secoes = document.querySelectorAll('.app-secao');
  const topbarTitulo = document.getElementById('app-topbar-titulo-texto');
  const topbarSub = document.getElementById('app-topbar-titulo-sub');

  function irParaSecao(nome) {
    navItems.forEach((it) => it.classList.toggle('ativo', it.dataset.secao === nome));
    secoes.forEach((sec) => sec.classList.toggle('ativa', sec.id === 'secao-' + nome));

    const item = document.querySelector(`.app-nav-item[data-secao="${nome}"]`);
    if (item) {
      if (topbarTitulo) topbarTitulo.textContent = item.dataset.titulo || item.textContent.trim();
      if (topbarSub) topbarSub.textContent = item.dataset.subtitulo || '';
    }
    fecharSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Atualiza o hash da URL para permitir partilhar/recarregar na mesma secção
    history.replaceState(null, '', '#' + nome);
  }

  navItems.forEach((it) => it.addEventListener('click', () => irParaSecao(it.dataset.secao)));

  // Botões auxiliares (ex.: "Ver todas") que atalham para outra secção
  document.querySelectorAll('[data-ir-secao]').forEach((btn) => {
    btn.addEventListener('click', () => irParaSecao(btn.dataset.irSecao));
  });

  // Abre a secção indicada no hash da URL ao carregar (ou a primeira por defeito)
  const secaoInicial = (window.location.hash || '').replace('#', '');
  if (secaoInicial && document.querySelector(`.app-nav-item[data-secao="${secaoInicial}"]`)) {
    irParaSecao(secaoInicial);
  }

  /* ----------------------------------------------------------------------
     TOAST DE FEEDBACK
     ---------------------------------------------------------------------- */
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function mostrarToast(mensagem, tipo = 'sucesso') {
    if (!toastEl) return;
    const icone = tipo === 'erro'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'
      : iconeSVG('check');

    toastEl.innerHTML = `${icone}<span>${mensagem}</span>`;
    toastEl.className = 'toast mostrar' + (tipo === 'erro' ? ' toast--erro' : '');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('mostrar'), 3400);
  }

  /* ----------------------------------------------------------------------
     CONFIRMAÇÃO DE AÇÕES DESTRUTIVAS
     ---------------------------------------------------------------------- */
  function confirmarAcao(mensagem) {
    return window.confirm(mensagem);
  }

  /* ----------------------------------------------------------------------
     BADGES DE ESTADO — mapeamento de texto/estilo consistente
     ---------------------------------------------------------------------- */
  const BADGES_IMOVEL = {
    disponivel: { texto: 'Disponível', classe: 'badge--verde' },
    reservado:  { texto: 'Reservado',  classe: 'badge--laranja' },
    arrendado:  { texto: 'Arrendado',  classe: 'badge--cinza' }
  };
  const BADGES_VISITA = {
    pendente:   { texto: 'Pendente',   classe: 'badge--laranja' },
    confirmada: { texto: 'Confirmada', classe: 'badge--azul' },
    concluida:  { texto: 'Concluída',  classe: 'badge--verde' },
    cancelada:  { texto: 'Cancelada',  classe: 'badge--vermelho' }
  };
  const BADGES_MENSAGEM = {
    nao_lida: { texto: 'Não lida', classe: 'badge--laranja' },
    lida:     { texto: 'Lida',     classe: 'badge--cinza' }
  };
  const BADGES_USUARIO = {
    inquilino:      { texto: 'Inquilino',      classe: 'badge--azul' },
    proprietario:   { texto: 'Proprietário',   classe: 'badge--verde' },
    administrador:  { texto: 'Administrador',  classe: 'badge--laranja' }
  };

  function renderBadge(mapa, chave) {
    const item = mapa[chave] || { texto: chave, classe: 'badge--cinza' };
    return `<span class="badge ${item.classe}">${item.texto}</span>`;
  }

  /* ----------------------------------------------------------------------
     BANNER DE MODO DEMONSTRAÇÃO — mostrado quando a API PHP não responde
     ---------------------------------------------------------------------- */
  function mostrarBannerDemo() {
    document.querySelectorAll('.banner-demo').forEach((b) => b.classList.add('mostrar'));
  }

  /* ----------------------------------------------------------------------
     EXPORTAÇÃO
     ---------------------------------------------------------------------- */
  window.Dashboard = {
    irParaSecao,
    mostrarToast,
    confirmarAcao,
    renderBadge,
    BADGES_IMOVEL,
    BADGES_VISITA,
    BADGES_MENSAGEM,
    BADGES_USUARIO,
    mostrarBannerDemo
  };

})();

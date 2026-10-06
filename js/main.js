/* =========================================================================
   INTAKA VILLAGE — main.js (página inicial)
   Lógica específica do index.html: listagem/pesquisa de imóveis e FAQ.
   Depende de js/common.js (deve ser incluído antes deste ficheiro).
   ========================================================================= */

(function () {
  'use strict';

  const { formatarMZN, iconeSVG, tipologiaDoImovel, observarRevelacoes, IMOVEIS_RESERVA, preencherSelectImoveisModal, favoritos } = window.Intaka;

  const estado = {
    imoveis: [],
    filtroTipo: 'todos',
    somenteFavoritos: false
  };

  /* ----------------------------------------------------------------------
     RENDERIZAÇÃO DOS CARTÕES DE IMÓVEL
     ---------------------------------------------------------------------- */
  const grelha = document.getElementById('grelha-imoveis');
  const estadoVazio = document.getElementById('estado-vazio');
  const contadorResultados = document.getElementById('contador-resultados');

  function criarCartaoImovel(imovel, indice) {
    const artigo = document.createElement('article');
    artigo.className = 'cartao-imovel reveal';
    artigo.style.transitionDelay = (indice % 3) * 90 + 'ms';

    const linkDetalhe = `detalhes.html?id=${imovel.id}`;
    const jaFavorito = favoritos.isFavorito(imovel.id);

    artigo.innerHTML = `
      <a href="${linkDetalhe}" class="cartao-imovel-media" aria-label="Ver detalhes de ${imovel.titulo}">
        <span class="selo ${imovel.destaque ? 'selo--destaque' : ''}">${imovel.destaque ? 'Em destaque' : 'Arrendamento'}</span>
        <img src="${imovel.imagem_capa}" alt="${imovel.titulo}" loading="lazy">
      </a>
      <button type="button" class="fav-btn ${jaFavorito ? 'ativado' : ''}" aria-label="${jaFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${jaFavorito}" data-fav data-imovel-id="${imovel.id}">${iconeSVG('coracao')}</button>
      <div class="cartao-imovel-corpo">
        <div class="cartao-imovel-local">${iconeSVG('pin')} ${imovel.bairro}, ${imovel.cidade}</div>
        <h3><a href="${linkDetalhe}">${imovel.titulo}</a></h3>
        <div class="cartao-imovel-specs">
          <span>${iconeSVG('cama')} ${imovel.quartos} quartos</span>
          <span>${iconeSVG('banho')} ${imovel.casas_banho} wc</span>
          <span>${iconeSVG('area')} ${imovel.area_m2} m²</span>
        </div>
        <div class="cartao-imovel-rodape">
          <div class="preco">
            <strong>${formatarMZN(imovel.preco_mensal)}</strong>
            <span>por mês</span>
          </div>
          <a href="${linkDetalhe}" class="btn-cartao">
            Ver detalhes ${iconeSVG('seta')}
          </a>
        </div>
      </div>
    `;

    artigo.querySelector('[data-fav]').addEventListener('click', function () {
      const agoraFavorito = favoritos.alternar(imovel.id);
      this.classList.toggle('ativado', agoraFavorito);
      this.setAttribute('aria-pressed', String(agoraFavorito));
      this.setAttribute('aria-label', agoraFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      this.style.transform = 'scale(1.25)';
      setTimeout(() => { this.style.transform = ''; }, 220);

      // Se estivermos a ver apenas favoritos, o cartão desaparece ao ser desmarcado
      if (estado.somenteFavoritos && !agoraFavorito) {
        aplicarFiltros();
      }
    });

    return artigo;
  }

  function renderizarImoveis(lista) {
    if (!grelha) return;
    grelha.innerHTML = '';

    if (!lista.length) {
      estadoVazio.textContent = estado.somenteFavoritos
        ? 'Ainda não guardou nenhum imóvel nos favoritos. Clique no coração de um cartão para o adicionar aqui.'
        : 'Não encontrámos imóveis com esses critérios. Experimente alargar o preço máximo ou remover filtros.';
      estadoVazio.classList.add('mostrar');
    } else {
      estadoVazio.classList.remove('mostrar');
      lista.forEach((imovel, i) => grelha.appendChild(criarCartaoImovel(imovel, i)));
      observarRevelacoes(grelha);
      requestAnimationFrame(() => {
        grelha.querySelectorAll('.cartao-imovel').forEach((c) => c.classList.add('em-vista'));
      });
    }

    if (contadorResultados) {
      contadorResultados.textContent = lista.length + (lista.length === 1 ? ' imóvel encontrado' : ' imóveis encontrados');
    }

    preencherSelectImoveisModal(estado.imoveis);
  }

  function aplicarFiltros() {
    const bairro = (document.getElementById('filtro-localizacao').value || '').trim().toLowerCase();
    const tipo = document.getElementById('filtro-tipo').value || estado.filtroTipo;
    const precoMax = parseFloat(document.getElementById('filtro-preco').value || '0');
    const quartos = parseInt(document.getElementById('filtro-quartos').value || '0', 10);

    const resultado = estado.imoveis.filter((im) => {
      if (bairro && !(`${im.bairro} ${im.cidade}`.toLowerCase().includes(bairro))) return false;
      if (tipo !== 'todos' && tipologiaDoImovel(im) !== tipo) return false;
      if (precoMax && im.preco_mensal > precoMax) return false;
      if (quartos && im.quartos < quartos) return false;
      if (estado.somenteFavoritos && !favoritos.isFavorito(im.id)) return false;
      return true;
    });

    renderizarImoveis(resultado);
  }

  /* ----------------------------------------------------------------------
     CARREGAR IMÓVEIS — tenta a API PHP, cai para dados de reserva
     ---------------------------------------------------------------------- */
  async function carregarImoveis() {
    try {
      const resposta = await fetch('php/api/imoveis.php', { headers: { Accept: 'application/json' } });
      if (!resposta.ok) throw new Error('API indisponível');
      const dados = await resposta.json();
      if (!dados.sucesso || !Array.isArray(dados.imoveis) || !dados.imoveis.length) {
        throw new Error('Sem dados da API');
      }
      estado.imoveis = dados.imoveis;
    } catch (erro) {
      estado.imoveis = IMOVEIS_RESERVA;
    } finally {
      renderizarImoveis(estado.imoveis);
    }
  }

  /* ----------------------------------------------------------------------
     FILTROS RÁPIDOS (chips) + SELECT + BARRA DE PESQUISA
     ---------------------------------------------------------------------- */
  const selectFiltroTipo = document.getElementById('filtro-tipo');

  document.querySelectorAll('.chip[data-tipo]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-tipo]').forEach((c) => c.classList.remove('ativo'));
      chip.classList.add('ativo');
      estado.filtroTipo = chip.dataset.tipo;
      if (selectFiltroTipo) selectFiltroTipo.value = chip.dataset.tipo;
      aplicarFiltros();
      document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (selectFiltroTipo) {
    selectFiltroTipo.addEventListener('change', () => {
      const valor = selectFiltroTipo.value;
      document.querySelectorAll('.chip[data-tipo]').forEach((c) => c.classList.toggle('ativo', c.dataset.tipo === valor));
      estado.filtroTipo = valor;
      aplicarFiltros();
    });
  }

  const chipFavoritos = document.getElementById('chip-favoritos');
  if (chipFavoritos) {
    chipFavoritos.addEventListener('click', () => {
      estado.somenteFavoritos = !estado.somenteFavoritos;
      chipFavoritos.setAttribute('aria-pressed', String(estado.somenteFavoritos));
      aplicarFiltros();
    });
  }

  const formPesquisa = document.getElementById('form-pesquisa');
  if (formPesquisa) {
    formPesquisa.addEventListener('submit', (e) => {
      e.preventDefault();
      aplicarFiltros();
      document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ----------------------------------------------------------------------
     FAQ — acordeão
     ---------------------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const pergunta = item.querySelector('.faq-pergunta');
    const resposta = item.querySelector('.faq-resposta');

    pergunta.addEventListener('click', () => {
      const jaAberto = item.classList.contains('aberto');

      document.querySelectorAll('.faq-item.aberto').forEach((outro) => {
        if (outro !== item) {
          outro.classList.remove('aberto');
          outro.querySelector('.faq-resposta').style.maxHeight = null;
          outro.querySelector('.faq-pergunta').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('aberto', !jaAberto);
      pergunta.setAttribute('aria-expanded', String(!jaAberto));
      resposta.style.maxHeight = !jaAberto ? resposta.scrollHeight + 'px' : null;
    });
  });

  /* ----------------------------------------------------------------------
     INICIALIZAÇÃO
     ---------------------------------------------------------------------- */
  observarRevelacoes();
  carregarImoveis();

})();

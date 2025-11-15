/* gerenciar_quartos.js
   - Carrega quartos via GET api/listar_quartos.php
   - Renderiza cards com carrossel por quarto
   - Implementa autoplay 3s, indicadores, botões prev/next, pausa ao hover
   - Gerencia edição/exclusão/listar vagas
*/

(function () {
  const API_LISTAR = "api/listar_quartos.php";
  const API_EXCLUIR = "api/excluir_quarto.php";

  // Ao carregar a página
  window.addEventListener("load", function () {
    document.getElementById("btnAdd")?.addEventListener("click", () => {
      window.location.href = "novo_quarto.html";
    });
    carregarQuartos();
  });

  function carregarQuartos() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_LISTAR, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          const quartos = JSON.parse(xhr.responseText);
          renderizarLista(quartos);
        } catch (e) {
          console.error("Resposta inválida do servidor:", e);
        }
      } else {
        console.error("Erro ao carregar quartos:", xhr.status);
      }
    };
    xhr.send();
  }

  // Cria o HTML dos cards e injeta no DOM
  function renderizarLista(quartos) {
    const container = document.getElementById("lista-quartos");
    container.innerHTML = "";

    quartos.forEach(q => {
      const card = document.createElement("article");
      card.className = "card-quarto";
      card.setAttribute("data-quarto-id", q.id);

      // CARROSSEL
      const carousel = document.createElement("div");
      carousel.className = "carousel";
      carousel.id = `carousel-${q.id}`;

      const slides = document.createElement("div");
      slides.className = "carousel-slides";

      // se nao existir imagens, placeholder
      const imagens = Array.isArray(q.imagens) && q.imagens.length ? q.imagens : ["https://via.placeholder.com/800x500?text=Sem+Imagem"];

      imagens.forEach((src, idx) => {
        // para efeito de fade, cada slide terá também classe 'carousel-slide'
        const slide = document.createElement("div");
        slide.className = "carousel-slide";
        // vamos usar img tag
        const img = document.createElement("img");
        img.src = src;
        img.alt = `${q.titulo} - imagem ${idx + 1}`;
        slide.appendChild(img);
        slides.appendChild(slide);
      });

      // controles
      const btnPrev = document.createElement("button");
      btnPrev.className = "carousel-control left";
      btnPrev.innerHTML = "‹";
      btnPrev.addEventListener("click", () => moveSlide(carousel, -1));

      const btnNext = document.createElement("button");
      btnNext.className = "carousel-control right";
      btnNext.innerHTML = "›";
      btnNext.addEventListener("click", () => moveSlide(carousel, 1));

      // indicadores
      const indicators = document.createElement("div");
      indicators.className = "carousel-indicators";
      imagens.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `Ir para slide ${i + 1}`);
        dot.addEventListener("click", () => goToSlide(carousel, i));
        indicators.appendChild(dot);
      });

      // assemble carousel
      carousel.appendChild(slides);
      carousel.appendChild(btnPrev);
      carousel.appendChild(btnNext);
      carousel.appendChild(indicators);

      // INFO
      const info = document.createElement("div");
      info.className = "card-info";
      info.innerHTML = `
        <h2>${escapeHtml(q.titulo)}</h2>
        <p><strong>Total de Vagas:</strong> ${escapeHtml(q.total_vagas)}</p>
        <p><strong>Preço Base:</strong> R$ ${Number(q.preco_base).toFixed(2)}</p>
        <p>${escapeHtml(q.descricao || "")}</p>
      `;

      // ACOES
      const acoes = document.createElement("div");
      acoes.className = "card-acoes";
      acoes.innerHTML = `
        <button class="btn-edit" title="Editar" data-id="${q.id}">Editar</button>
        <button class="btn-delete" title="Excluir" data-id="${q.id}">Excluir</button>
        <button class="btn-vagas" title="Listar Vagas" data-id="${q.id}">Listar Vagas</button>
      `;

      // eventos acoes
      acoes.querySelector(".btn-edit").addEventListener("click", () => {
        window.location.href = `editar_quarto.html?id=${q.id}`;
      });
      acoes.querySelector(".btn-delete").addEventListener("click", () => excluirQuarto(q.id, card));
      acoes.querySelector(".btn-vagas").addEventListener("click", () => {
        window.location.href = `listar_vagas.html?quarto_id=${q.id}`;
      });

      // montar card
      card.appendChild(carousel);
      card.appendChild(info);
      card.appendChild(acoes);
      container.appendChild(card);

      // inicializar carrossel (cria estado, autoplay etc)
      initCarousel(carousel);
    });
  }

  /* ---------------- CARROSSEL ---------------- */

  // Estado de carousels: usamos WeakMap de element -> state
  const carouselStates = new WeakMap();

  function initCarousel(carouselEl) {
    const slidesWrap = carouselEl.querySelector(".carousel-slides");
    const slides = Array.from(slidesWrap.children);
    const indicators = Array.from(carouselEl.querySelectorAll(".carousel-indicators button"));
    let index = 0;
    const total = slides.length;

    // Aplicar estrutura para fade: transformar slides em absolute layers
    slides.forEach((s, i) => {
      s.classList.add("fade");
      if (i === 0) s.classList.add("active");
      else s.classList.remove("active");
    });

    // marcar primeiro indicador
    if (indicators[0]) indicators[0].classList.add("active");

    // Funções de navegação
    function showSlide(n) {
      const newIndex = ((n % total) + total) % total;
      slides.forEach((s, i) => {
        s.classList.toggle("active", i === newIndex);
      });
      indicators.forEach((d, i) => d.classList.toggle("active", i === newIndex));
      index = newIndex;
    }

    function next() { showSlide(index + 1); }
    function prev() { showSlide(index - 1); }
    function goto(i) { showSlide(i); }

    // Eventos controles
    carouselEl.querySelector(".carousel-control.left").addEventListener("click", prev);
    carouselEl.querySelector(".carousel-control.right").addEventListener("click", next);
    indicators.forEach((dot, i) => dot.addEventListener("click", () => goto(i)));

    // Autoplay
    let interval = setInterval(next, 3000);

    // Pause on hover/focus
    carouselEl.addEventListener("mouseenter", () => clearInterval(interval));
    carouselEl.addEventListener("mouseleave", () => interval = setInterval(next, 3000));
    carouselEl.addEventListener("focusin", () => clearInterval(interval));
    carouselEl.addEventListener("focusout", () => interval = setInterval(next, 3000));

    // salvar estado
    carouselStates.set(carouselEl, { index, total, interval, showSlide, next, prev, goto });

    // Accessibility: enable keyboard navigation when focused
    carouselEl.tabIndex = 0;
    carouselEl.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowLeft") prev();
      if (ev.key === "ArrowRight") next();
    });
  }

  function moveSlide(carouselEl, direction) {
    const state = carouselStates.get(carouselEl);
    if (!state) return;
    if (direction > 0) state.next();
    else state.prev();
  }

  function goToSlide(carouselEl, idx) {
    const state = carouselStates.get(carouselEl);
    if (!state) return;
    state.goto(idx);
  }

  /* ---------------- AÇÕES ---------------- */

  function excluirQuarto(id, cardEl) {
    if (!confirm("Deseja realmente excluir este quarto?")) return;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_EXCLUIR, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
      if (xhr.status === 200) {
        // remover card da UI
        if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
        // também limpar estado do carousel se existir
        // (Garbage collection do WeakMap cuidará)
        alert("Quarto excluído com sucesso.");
      } else {
        alert("Erro ao excluir. Tente novamente.");
      }
    };

    xhr.send("id=" + encodeURIComponent(id));
  }

  // função para escapar texto injetado
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

})();

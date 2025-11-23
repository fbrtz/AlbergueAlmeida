document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    const userId = parseInt(localStorage.getItem('userId') || '0', 10);
    const userEmail = localStorage.getItem('userEmail');

    if (userId <= 0) {
        console.warn('Usuário não logado. Redirecionando para login...');
    } else {
        console.log('Usuário logado:', { userId, userEmail });
    }

    // Renderizar slides dos quartos via backend
    fetch('../api/listar_quartos.php')
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error('Erro ao carregar quartos');
            renderPromoSlides(data.quartos);
        })
        .catch(err => {
            console.error('Erro:', err);

            const slidesContainer = document.getElementById('promoSlides');
            if (slidesContainer && slidesContainer.children.length > 0) {
                console.warn('Mantendo slides estáticos existentes.');
            } else if (slidesContainer) {
                slidesContainer.innerHTML = '<div class="slide-error">Não foi possível carregar os quartos.</div>';
            }
        });

    function renderPromoSlides(quartos) {
        const slidesContainer = document.getElementById('promoSlides');
        const dotsContainer = document.getElementById('promoDots');
        slidesContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        quartos.forEach((quarto, idx) => {
            const slide = document.createElement('article');
            slide.className = 'slide';

            slide.innerHTML = `
                <div class="slide-media">
                    <img src="${quarto.imagens[0] || 'https://via.placeholder.com/300x200?text=Quarto'}" alt="${quarto.titulo}">
                </div>

                <div class="slide-info">
                    <div class="slide-header">
                        <h3>${quarto.titulo}</h3>
                        <div class="rating">${quarto.avaliacao || '--'}<span class="small"></span></div>
                    </div>

                    <p class="descricao"><strong>Descrição:</strong><br>${quarto.descricao}</p>

                    <div class="price-row">
                        <div class="price-now">Por: <span class="big">R$ ${quarto.preco_base}</span> <span class="per">a diária</span></div>
                    </div>
                </div>
            `;

            slidesContainer.appendChild(slide);

            const dot = document.createElement('button');
            dot.className = 'dot' + (idx === 0 ? ' active' : '');
            dotsContainer.appendChild(dot);
        });

        initSlider();
    }

    function initSlider() {
        const slidesContainer = document.getElementById('promoSlides');
        const slides = Array.from(slidesContainer.querySelectorAll('.slide'));
        const leftBtn = document.querySelector('.arrow.left');
        const rightBtn = document.querySelector('.arrow.right');
        const dots = Array.from(document.querySelectorAll('.dot'));
        let index = 0;

        if (slides.length === 0) return;

        function update() {
            const width = slidesContainer.clientWidth;
            slidesContainer.style.transform = `translateX(${-index * width}px)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
        }

        function resizeSlides() {
            const width = slidesContainer.clientWidth;
            slides.forEach(s => s.style.minWidth = width + 'px');
            update();
        }

        window.addEventListener('resize', resizeSlides);
        resizeSlides();

        leftBtn.addEventListener('click', () => {
            index = (index - 1 + slides.length) % slides.length;
            update();
        });

        rightBtn.addEventListener('click', () => {
            index = (index + 1) % slides.length;
            update();
        });

        // toque (mobile)
        let startX = 0;
        slidesContainer.addEventListener('touchstart', e => startX = e.touches[0].clientX);
        slidesContainer.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 50) {
                index = dx < 0 ? (index + 1) % slides.length : (index - 1 + slides.length) % slides.length;
                update();
            }
        });
    }

    // ====================== BUSCA =========================

    initializeSearch();

    function initializeSearch() {
        const guestPlusBtn = document.getElementById('homePlus');
        const guestMinusBtn = document.getElementById('homeMinus');
        const searchCtaBtn = document.getElementById('searchCta');
        let guestCount = 2;

        guestPlusBtn.addEventListener('click', () => {
            if (guestCount < 8) {
                guestCount++;
                document.getElementById('homeGuestCount').textContent = guestCount;
            }
        });

        guestMinusBtn.addEventListener('click', () => {
            if (guestCount > 1) {
                guestCount--;
                document.getElementById('homeGuestCount').textContent = guestCount;
            }
        });

        searchCtaBtn.addEventListener('click', () => {
            const checkIn = document.getElementById('homeCheckIn').value;
            const checkOut = document.getElementById('homeCheckOut').value;

            if (!checkIn || !checkOut) {
                alert('Por favor, selecione as datas de entrada e saída');
                return;
            }

            if (new Date(checkIn) >= new Date(checkOut)) {
                alert('A data de saída deve ser posterior à data de entrada');
                return;
            }

            localStorage.setItem('searchData', JSON.stringify({
                checkIn,
                checkOut,
                guests: guestCount
            }));

            window.location.href = 'cliente_resultados.html';
        });
    }
});
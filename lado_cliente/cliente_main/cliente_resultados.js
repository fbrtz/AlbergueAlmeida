// rooms will be loaded from server
let roomsData = [];
let allQuartos = [];
let allCaracteristicas = [];
let selectedCaracteristicas = [];

// Safe number parse (accepts comma decimal and handles undefined)
function parseNumberSafe(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const s = String(value).trim().replace(/\./g, '').replace(/,/g, '.');
    const f = parseFloat(s);
    return isNaN(f) ? 0 : f;
}

// Escape HTML to prevent XSS
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// State
let currentMonth = new Date();
let selectedCheckIn = null;
let selectedCheckOut = null;
let guestCount = 2;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadSearchData();
    initializeCalendar();
    initializeGuestSelector();
    initializeBackButton();
    initializeSearchFields();

    // Load characteristics and then render results
    loadCaracteristicas();

    // Modal vagas event listeners
    const vagasClose = document.getElementById('vagasClose');
    const vagasOverlay = document.getElementById('vagasOverlay');

    if (vagasClose) {
        vagasClose.addEventListener('click', closeVagasModal);
    }
    if (vagasOverlay) {
        vagasOverlay.addEventListener('click', closeVagasModal);
    }
});

// Load search data from home page
function loadSearchData() {
    const searchData = localStorage.getItem('searchData');
    if (searchData) {
        const data = JSON.parse(searchData);
        const checkIn = new Date(data.checkIn + 'T00:00:00');
        const checkOut = new Date(data.checkOut + 'T00:00:00');

        selectedCheckIn = checkIn;
        selectedCheckOut = checkOut;
        guestCount = data.guests;

        // Set month view to check-in date
        currentMonth = new Date(checkIn);

        // Update inputs
        document.getElementById('checkInInput').value = data.checkIn;
        document.getElementById('checkOutInput').value = data.checkOut;
        document.getElementById('guestCount').textContent = guestCount;
    }
}

// Load characteristics from backend
function loadCaracteristicas() {
    fetch('../api/listar_caracteristicas.php')
        .then(async res => {
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (res.ok) {
                    if (data.success && Array.isArray(data.caracteristicas)) {
                        allCaracteristicas = data.caracteristicas;
                        renderCaracteristicasFilters();
                    }
                    return data;
                } else {
                    console.error('HTTP error listar_caracteristicas:', res.status, text);
                    return null;
                }
            } catch (err) {
                console.error('Resposta inválida de listar_caracteristicas.php:', err, text);
                return null;
            }
        })
        .then(() => {
            renderResults();
        })
        .catch(err => {
            console.error('Erro ao carregar características:', err);
            renderResults();
        });
}

// Render characteristics as filter checkboxes
function renderCaracteristicasFilters() {
    const container = document.getElementById('filtersContainer');
    if (!container) return;

    container.innerHTML = '';
    if (!allCaracteristicas || allCaracteristicas.length === 0) return;

    allCaracteristicas.forEach(caract => {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';

        const label = document.createElement('label');
        label.className = 'filter-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = caract.id;
        checkbox.addEventListener('change', onFilterChange);

        const span = document.createElement('span');
        span.textContent = caract.nome;

        label.appendChild(checkbox);
        label.appendChild(span);
        filterGroup.appendChild(label);
        container.appendChild(filterGroup);
    });
}

// Handle filter checkbox changes
function onFilterChange(e) {
    const caracteristicaId = parseInt(e.target.value);

    if (e.target.checked) {
        if (!selectedCaracteristicas.includes(caracteristicaId)) {
            selectedCaracteristicas.push(caracteristicaId);
        }
    } else {
        selectedCaracteristicas = selectedCaracteristicas.filter(id => id !== caracteristicaId);
    }

    renderResults();
}

// Calendar functions
function initializeCalendar() {
    renderCalendar();
    const prev = document.getElementById('prevMonth');
    const next = document.getElementById('nextMonth');
    if (prev) prev.addEventListener('click', previousMonth);
    if (next) next.addEventListener('click', nextMonth);
}

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Set header
    const monthNames = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    document.getElementById('monthYear').textContent = `${monthNames[month]}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day empty';
        calendarDays.appendChild(emptyDay);
    }

    // Add days of month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.textContent = day;

        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);

        // Disable past dates
        if (currentDate < today) {
            dayEl.classList.add('disabled');
        }

        if (currentDate.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        }

        // REMOVE click → calendário fica estático
        dayEl.style.cursor = 'default';


        // Highlight selected dates
        if (selectedCheckIn && currentDate.getTime() === selectedCheckIn.getTime()) {
            dayEl.classList.add('active');
        }
        if (selectedCheckOut && currentDate.getTime() === selectedCheckOut.getTime()) {
            dayEl.classList.add('active');
        }

        // Highlight range
        if (selectedCheckIn && selectedCheckOut &&
            currentDate > selectedCheckIn && currentDate < selectedCheckOut) {
            dayEl.classList.add('in-range');
        }

        calendarDays.appendChild(dayEl);
    }
}

function selectDate(date, element) {
    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
        // Reset and start new selection
        selectedCheckIn = date;
        selectedCheckOut = null;
        updateSearchFields();
    } else if (date > selectedCheckIn) {
        // Set checkout date
        selectedCheckOut = date;
        updateSearchFields();
    } else {
        // If clicked date is before checkin, set as new checkin
        selectedCheckIn = date;
        selectedCheckOut = null;
        updateSearchFields();
    }

    renderCalendar();
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

// Search field functions
function initializeSearchFields() {
    const checkInInput = document.getElementById('checkInInput');
    const checkOutInput = document.getElementById('checkOutInput');

    checkInInput.addEventListener('change', function() {
        if (this.value) {
            selectedCheckIn = new Date(this.value + 'T00:00:00');
            currentMonth = new Date(selectedCheckIn);
            renderCalendar();
        }
    });

    checkOutInput.addEventListener('change', function() {
        if (this.value) {
            selectedCheckOut = new Date(this.value + 'T00:00:00');
            renderCalendar();
        }
    });
}

function updateSearchFields() {
    const checkInInput = document.getElementById('checkInInput');
    const checkOutInput = document.getElementById('checkOutInput');

    if (selectedCheckIn) {
        checkInInput.value = formatDateForInput(selectedCheckIn);
    }
    if (selectedCheckOut) {
        checkOutInput.value = formatDateForInput(selectedCheckOut);
    }
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Guest selector functions
function initializeGuestSelector() {
    const plus = document.getElementById('guestPlus');
    const minus = document.getElementById('guestMinus');
    if (plus) {
        plus.addEventListener('click', () => {
            if (guestCount < 8) {
                guestCount++;
                updateGuestDisplay();
                renderResults();
            }
        });
    }
    if (minus) {
        minus.addEventListener('click', () => {
            if (guestCount > 1) {
                guestCount--;
                updateGuestDisplay();
                renderResults();
            }
        });
    }
}

function updateGuestDisplay() {
    document.getElementById('guestCount').textContent = guestCount;
}

// Back button
function initializeBackButton() {
    document.querySelector('.back').addEventListener('click', () => {
        window.history.back();
    });
}

// Results rendering
function renderResults() {
    const resultsList = document.getElementById('resultsList');
    if (resultsList) {
        resultsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Carregando...</p>';
    } else {
        console.error('Elemento resultsList não encontrado no DOM');
        return;
    }

    const searchData = JSON.parse(localStorage.getItem('searchData') || 'null');
    let url = '../api/listar_disponiveis.php';
    let params = [];

    if (searchData && searchData.checkIn && searchData.checkOut) {
        params.push(`checkIn=${encodeURIComponent(searchData.checkIn)}`);
        params.push(`checkOut=${encodeURIComponent(searchData.checkOut)}`);
        params.push(`guests=${encodeURIComponent(searchData.guests)}`);
    }

    if (selectedCaracteristicas.length > 0) {
        selectedCaracteristicas.forEach(id => {
            params.push(`caracteristicas[]=${id}`);
        });
    }




    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    console.log('Buscando em:', url);

    fetch(url)
        .then(async r => {
            const text = await r.text();
            try {
                const data = JSON.parse(text);
                if (!r.ok) {
                    console.error('HTTP error listar_disponiveis:', r.status, text);
                    throw new Error(`HTTP ${r.status}`);
                }
                console.log('Resposta da API:', data);

                // Handle both old array format and new object format
                if (Array.isArray(data)) {
                    allQuartos = data;
                } else if (data.success && Array.isArray(data.quartos)) {
                    allQuartos = data.quartos;
                } else {
                    console.warn('Formato de resposta inesperado:', data);
                    allQuartos = [];
                }
            } catch (err) {
                console.error('Erro ao parsear resposta JSON de listar_disponiveis.php:', err, '\nResposta bruta:', text);
                throw new Error('Resposta inválida do servidor (veja console).');
            }
        })
        .then(() => {

            console.log('Quartos processados:', allQuartos.length);

            // Filter rooms by number of available vagas according to guestCount
            const roomsToShow = allQuartos.filter(room => {
                const vagasArr = room.vagas_disponiveis || room.vagas || [];
                return (Array.isArray(vagasArr) && vagasArr.length >= guestCount);
            });

            if (!roomsToShow || roomsToShow.length === 0) {
                resultsList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">Nenhum quarto com pelo menos ${guestCount} vaga${guestCount > 1 ? 's' : ''} disponível(s).</p>`;
            } else {
                resultsList.innerHTML = '';
                roomsToShow.forEach(room => {
                    try {
                        const card = createRoomCard(room);
                        resultsList.appendChild(card);
                    } catch (e) {
                        console.error('Erro ao renderizar room card:', e, room);
                    }
                });
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            resultsList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #e74c3c; padding: 40px;">Erro ao carregar quartos: ${err.message}</p>`;
        });
}

function createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.setAttribute('data-room-id', room.id);

    const img = (room.imagens && room.imagens.length) ? room.imagens[0] : 'https://via.placeholder.com/300x200';
    const vagasDisponiveis = Array.isArray(room.vagas_disponiveis) ? room.vagas_disponiveis.length : (Array.isArray(room.vagas) ? room.vagas.length : 0);

    // Build characteristics section if present
    let caracteristicasHTML = '';
    if (room.caracteristicas && room.caracteristicas.length > 0) {
        const caracTags = room.caracteristicas
            .map(c => `<span class="char-badge" style="display: inline-block; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; margin-bottom: 5px;">${escapeHtml(c.nome)}</span>`)
            .join('');
        caracteristicasHTML = `<div style="margin: 8px 0;">${caracTags}</div>`;
    }

    card.innerHTML = `
        <div class="room-image">
            <img src="${img}" alt="${room.titulo}" onerror="this.src='https://via.placeholder.com/300x200'">
        </div>
        <div class="room-content">
            <div class="room-header">
                <h3 class="room-title">${room.titulo}</h3>
                <span class="capacity-badge">👥 Até ${room.total_vagas || 4} pessoas</span>
            </div>
            <p class="room-description">${room.descricao || ''}</p>
            ${caracteristicasHTML}
            <div class="room-pricing">
                <span class="price-label">A partir de</span>
                <span class="price-value">R$ ${parseNumberSafe(room.preco_base).toFixed(2)}</span>
                <span class="price-unit">/ noite</span>
            </div>
            ${vagasDisponiveis > 0 ? `
            <div class="room-actions">
                <button class="btn-vagas" data-room-id="${room.id}">
                    Ver Vagas Disponíveis (${vagasDisponiveis})
                </button>
            </div>
            ` : `
            <div class="room-actions">
                <button class="btn-vagas" disabled style="opacity: 0.5; cursor: not-allowed;">
                    Sem Vagas Disponíveis
                </button>
            </div>
            `}
        </div>
    `;

    // Add event listener to button
    const button = card.querySelector('.btn-vagas');
    if (button && vagasDisponiveis > 0) {
        button.addEventListener('click', () => openVagasModal(room.id));
    }

    return card;
}

function openVagasModal(roomId) {
    console.log('Abrindo modal para quarto:', roomId);
    console.log('Quartos disponíveis:', allQuartos);
    
    const room = allQuartos.find(q => String(q.id) === String(roomId));
    if (!room) {
        console.error('Quarto não encontrado:', roomId);
        alert('Erro ao abrir modal de vagas.');
        return;
    }

    console.log('Quarto encontrado:', room);
    console.log('Vagas disponíveis:', room.vagas_disponiveis);
    console.log('Hóspedes:', guestCount);

    document.getElementById('vagasRoomTitle').textContent = room.titulo;

    const vagasContainer = document.getElementById('vagasContainer');
    vagasContainer.innerHTML = '';

    // Support different API shapes: `vagas_disponiveis` (new) or `vagas` (legacy)
    const vagasArr = room.vagas_disponiveis || room.vagas || [];

    if (!vagasArr || vagasArr.length === 0) {
        vagasContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhuma vaga disponível para os critérios selecionados.</p>';
    } else {
        // Add info message about quantity to select
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background: #e3f2fd; border-left: 4px solid #0277bd; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px; color: #01579b; font-size: 14px;';
        infoDiv.innerHTML = `<strong>Selecione ${guestCount} vaga${guestCount > 1 ? 's' : ''}</strong> para ${guestCount} hóspede${guestCount > 1 ? 's' : ''}`;
        vagasContainer.appendChild(infoDiv);

        const vagasWrapper = document.createElement('div');
        vagasWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
        
        vagasArr.forEach((vaga, index) => {
            console.log('Renderizando vaga:', vaga);
            const vagaCard = createVagaCard(vaga, room, index);
            vagasWrapper.appendChild(vagaCard);
        });
        
        vagasContainer.appendChild(vagasWrapper);
        
        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; display: flex; gap: 10px;';
        
        const confirmbtn = document.createElement('button');
        confirmbtn.textContent = 'Confirmar Seleção';
        confirmbtn.className = 'btn-select-vaga';
        confirmbtn.style.cssText = 'flex: 1;';
        confirmbtn.addEventListener('click', () => proceedWithSelectedVagas(room));
        
        const cancelbtn = document.createElement('button');
        cancelbtn.textContent = 'Cancelar';
        cancelbtn.style.cssText = 'flex: 1; background: #999; border: none; padding: 12px; border-radius: 8px; cursor: pointer; color: white; font-weight: 600;';
        cancelbtn.addEventListener('click', closeVagasModal);
        
        actionsDiv.appendChild(confirmbtn);
        actionsDiv.appendChild(cancelbtn);
        vagasContainer.appendChild(actionsDiv);
    }

    const modal = document.getElementById('vagasModal');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
}

function createVagaCard(vaga, room, index) {
    const card = document.createElement('div');
    card.className = 'vaga-card';
    card.setAttribute('data-vaga-id', vaga.id);
    card.setAttribute('data-vaga-index', index);
    card.style.cssText = `
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    let characteristicsHTML = '';
    if (vaga.caracteristicas && vaga.caracteristicas.length > 0) {
        characteristicsHTML = vaga.caracteristicas
            .map(c => `<span class="char-badge" style="display: inline-block; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px;">${c.nome}</span>`)
            .join('');
    }

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'vaga-checkbox';
    checkbox.value = vaga.id;
    checkbox.style.cssText = 'width: 24px; height: 24px; cursor: pointer; flex-shrink: 0;';

    // Create content div
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'flex: 1;';
    contentDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">${vaga.nome}</h4>
            <span style="font-size: 14px; font-weight: 600; color: #0066cc;">+R$ ${parseNumberSafe(vaga.adicional).toFixed(2)}</span>
        </div>
        ${characteristicsHTML ? `<div style="margin-top: 8px;">${characteristicsHTML}</div>` : ''}
    `;

    // Handle checkbox changes
    const updateCardStyle = () => {
        const totalSelected = getTotalSelectedVagas();
        
        if (checkbox.checked) {
            card.style.borderColor = '#0066cc';
            card.style.backgroundColor = '#f0f7ff';
        } else {
            card.style.borderColor = '#e0e0e0';
            card.style.backgroundColor = 'transparent';
        }
        
        // Disable other checkboxes if we've reached the limit and this one is not checked
        const allCheckboxes = document.querySelectorAll('.vaga-checkbox');
        allCheckboxes.forEach(cb => {
            if (!cb.checked && totalSelected >= guestCount) {
                cb.disabled = true;
                cb.style.opacity = '0.5';
                cb.style.cursor = 'not-allowed';
            } else {
                cb.disabled = false;
                cb.style.opacity = '1';
                cb.style.cursor = 'pointer';
            }
        });
    };

    checkbox.addEventListener('change', updateCardStyle);
    
    // Click anywhere on card to toggle checkbox
    card.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            updateCardStyle();
        }
    });

    card.appendChild(checkbox);
    card.appendChild(contentDiv);

    return card;
}

function getTotalSelectedVagas() {
    const modal = document.getElementById('vagasModal');
    const checkboxes = modal.querySelectorAll('.vaga-checkbox:checked');
    return checkboxes.length;
}

function closeVagasModal() {
    const modal = document.getElementById('vagasModal');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    // Deselect all checkboxes when closing
    const checkboxes = modal.querySelectorAll('.vaga-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
}

function proceedWithSelectedVagas(room) {
    const modal = document.getElementById('vagasModal');
    const selectedCheckboxes = modal.querySelectorAll('.vaga-checkbox:checked');
    
    // Validate total quantity
    if (selectedCheckboxes.length === 0) {
        alert('Por favor, selecione pelo menos uma vaga para continuar.');
        return;
    }
    
    if (selectedCheckboxes.length !== guestCount) {
        alert(`Por favor, selecione exatamente ${guestCount} vaga${guestCount > 1 ? 's' : ''}.`);
        return;
    }
    
    const selectedVagas = [];
    selectedCheckboxes.forEach(checkbox => {
        const vagaId = parseInt(checkbox.value);
        const vagasArr = room.vagas_disponiveis || room.vagas || [];
        const vaga = vagasArr.find(v => String(v.id) === String(vagaId));
        if (vaga) {
            selectedVagas.push(vaga);
        }
    });
    
    console.log('Vagas selecionadas:', selectedVagas);
    
    localStorage.setItem('selectedRoom', JSON.stringify(room));
    localStorage.setItem('selectedVagas', JSON.stringify(selectedVagas));
    
    closeVagasModal();
    window.location.href = 'cliente_pagamento.html';
}
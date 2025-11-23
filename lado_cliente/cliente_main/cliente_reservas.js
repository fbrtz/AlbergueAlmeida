document.addEventListener('DOMContentLoaded', function() {
    const reservasList = document.getElementById('reservasList');
    reservasList.innerHTML = '<p style="color:#666; padding:18px;">Carregando suas reservas...</p>';

    // Get hospede id from localStorage (set during login)
    // If not logged in, redirect to login
    const hospedeId = parseInt(localStorage.getItem('userId') || '0', 10);
    if (hospedeId <= 0) {
        reservasList.innerHTML = '<p style="color:#e74c3c;">Você precisa estar <a href="../../login/login.html">logado</a> para ver suas reservas.</p>';
        return;
    }

    fetch(`../api/listar_minhas_reservas.php?hospede_id=${encodeURIComponent(hospedeId)}`)
        .then(async r => {
            const text = await r.text();
            try {
                const data = JSON.parse(text);
                if (!r.ok) {
                    reservasList.innerHTML = '<p style="color:#e74c3c;">Erro ao carregar reservas.</p>';
                    return;
                }
                return data;
            } catch (err) {
                console.error('JSON parse error:', err, 'Response:', text);
                reservasList.innerHTML = '<p style="color:#e74c3c;">Erro ao processar resposta.</p>';
                throw err;
            }
        })
        .then(data => {
            if (!data || !data.success) {
                reservasList.innerHTML = '<p style="color:#e74c3c;">Erro ao carregar reservas.</p>';
                return;
            }

            const reservas = data.reservas || [];
            if (reservas.length === 0) {
                reservasList.innerHTML = '<p style="color:#666; padding:18px;">Você não possui reservas.</p>';
                return;
            }

            reservasList.innerHTML = '';
            reservas.forEach(r => {
                const card = document.createElement('div');
                card.className = 'reserva-card';
                card.id = 'reserva-' + r.id;

                const info = document.createElement('div');
                info.className = 'reserva-info';

                const title = document.createElement('div');
                title.innerHTML = `<strong>${escapeHtml(r.quarto_titulo)}</strong><div class="reserva-meta">Vaga: ${escapeHtml(r.vaga_nome)}</div>`;

                const period = document.createElement('div');
                period.className = 'reserva-meta';
                const d1 = new Date(r.inicio_periodo);
                const d2 = new Date(r.fim_periodo);
                period.textContent = `${d1.toLocaleDateString('pt-BR')} → ${d2.toLocaleDateString('pt-BR')}`;

                info.appendChild(title);
                info.appendChild(period);

                const right = document.createElement('div');
                right.style.textAlign = 'right';
                right.innerHTML = `<div style="font-weight:700;">R$ ${Number(r.valor_total).toFixed(2)}</div><div class="reserva-meta reserva-status">${escapeHtml(r.status)}</div>`;

                const actions = document.createElement('div');
                actions.className = 'reserva-actions';
                const btn = document.createElement('button');
                btn.className = 'btn-view';
                btn.textContent = 'Ver Detalhes';
                btn.addEventListener('click', () => openReservaModal(r));
                actions.appendChild(btn);

                card.appendChild(info);
                card.appendChild(right);
                card.appendChild(actions);

                reservasList.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            reservasList.innerHTML = '<p style="color:#e74c3c;">Erro ao carregar reservas.</p>';
        });

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // Modal behavior
    const modal = document.getElementById('reservaModal');
    const modalOverlay = document.getElementById('reservaOverlay');
    const modalClose = document.getElementById('reservaModalClose');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelReservaBtn');

    function openReservaModal(reserva) {
        document.getElementById('modalTitle').textContent = `Reserva #${reserva.id}`;
        document.getElementById('modalQuarto').textContent = reserva.quarto_titulo || '—';
        document.getElementById('modalVaga').textContent = reserva.vaga_nome || '—';
        const d1 = new Date(reserva.inicio_periodo);
        const d2 = new Date(reserva.fim_periodo);
        document.getElementById('modalPeriodo').textContent = `${d1.toLocaleDateString('pt-BR')} → ${d2.toLocaleDateString('pt-BR')}`;
        document.getElementById('modalValor').textContent = `R$ ${Number(reserva.valor_total).toFixed(2)}`;
        document.getElementById('modalStatus').textContent = reserva.status || '—';

        // attach reserva id to modal cancel button for reference
        modalCancelBtn.dataset.reservaId = reserva.id;
        // disable cancel button if already canceled
        if ((reserva.status || '').toLowerCase() === 'cancelado') {
            modalCancelBtn.disabled = true;
            modalCancelBtn.style.opacity = '0.6';
            modalCancelBtn.textContent = 'Já cancelada';
        } else {
            modalCancelBtn.disabled = false;
            modalCancelBtn.style.opacity = '1';
            modalCancelBtn.textContent = 'Cancelar Reserva';
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    // Cancel reservation action
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', function() {
            const rid = this.dataset.reservaId;
            if (!rid) return;
            if (!confirm('Confirma cancelamento desta reserva?')) return;

            this.disabled = true;
            this.textContent = 'Cancelando...';

            fetch(`../api/cancelar_reserva.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reserva_id: parseInt(rid, 10) })
                })
                .then(r => r.json())
                .then(resp => {
                    if (resp && resp.success) {
                        // update modal status and card status
                        document.getElementById('modalStatus').textContent = 'cancelado';
                        const card = document.getElementById('reserva-' + rid);
                        if (card) {
                            const st = card.querySelector('.reserva-status');
                            if (st) st.textContent = 'cancelado';
                        }
                        modalCancelBtn.textContent = 'Já cancelada';
                        alert('Reserva cancelada com sucesso.');
                    } else {
                        console.error('Erro ao cancelar:', resp);
                        alert('Erro ao cancelar reserva. Tente novamente.');
                        modalCancelBtn.disabled = false;
                        modalCancelBtn.textContent = 'Cancelar Reserva';
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Erro ao cancelar reserva. Tente novamente.');
                    modalCancelBtn.disabled = false;
                    modalCancelBtn.textContent = 'Cancelar Reserva';
                });
        });
    }
});
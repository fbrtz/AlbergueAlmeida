// Load searchData and selectedRoom from localStorage
document.addEventListener('DOMContentLoaded', function() {
    const searchData = JSON.parse(localStorage.getItem('searchData') || 'null');
    const selectedRoom = JSON.parse(localStorage.getItem('selectedRoom') || 'null');
    // support array of vagas (selectedVagas) or legacy single vaga
    const selectedVagas = JSON.parse(localStorage.getItem('selectedVagas') || 'null') || null;
    let singleVaga = JSON.parse(localStorage.getItem('selectedVaga') || 'null');
    // normalize to array for newer flow
    const vagasToUse = Array.isArray(selectedVagas) ? selectedVagas : (singleVaga ? [singleVaga] : []);

    if (!searchData || !selectedRoom) {
        // If missing data, redirect back to home
        console.warn('searchData or selectedRoom missing, redirecting to home');
        // window.location.href = 'cliente_home.html';
    }

    populateSummary(selectedRoom, vagasToUse, searchData);
    populateExpirySelects();

    document.getElementById('confirmPayment').addEventListener('click', function() {
        submitPayment();
    });

    // Cancel purchase button behavior
    const cancelBtn = document.getElementById('cancelPayment');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            const ok = confirm('Deseja realmente cancelar a compra e limpar os dados selecionados?');
            if (!ok) return;
            localStorage.removeItem('selectedRoom');
            localStorage.removeItem('selectedVagas');
            localStorage.removeItem('selectedVaga');
            // Keep searchData so user can easily search again; redirect to results
            window.location.href = 'cliente_resultados.html';
        });
    }
});

// Helper to parse numbers safely (accepts comma as decimal separator)
function parseNumberSafe(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const s = String(value).trim().replace(/\./g, '').replace(/,/g, '.');
    const f = parseFloat(s);
    return isNaN(f) ? 0 : f;
}

function populateSummary(room, vagas, searchData) {
    if (!room || !searchData) return;
    const img = (room.imagens && room.imagens.length) ? room.imagens[0] : (room.img0 || room.image || '');
    document.getElementById('roomImage').src = img;
    document.getElementById('roomTitle').textContent = (room.titulo || room.name || 'Quarto');
    document.getElementById('roomMeta').textContent = (room.capacidade || room.beds || room.meta || '—') + ' hóspede(s)';
    document.getElementById('roomRating').textContent = (room.rating || '—');
    document.getElementById('roomReviews').textContent = (room.reviews || 0);

    // Populate reservation details
    document.getElementById('summaryRoom').textContent = room.titulo || room.name || 'Quarto';
    // show list of vagas
    if (vagas && vagas.length > 0) {
        document.getElementById('summaryVaga').textContent = vagas.map(v => v.nome).join(', ');
    } else {
        document.getElementById('summaryVaga').textContent = 'Não selecionada';
    }

    // Display check-in/out with times (14:00 / 11:00)
    const checkInDate = new Date(searchData.checkIn);
    const checkOutDate = new Date(searchData.checkOut);
    const checkInFormatted = checkInDate.toLocaleDateString('pt-BR') + ' - 14:00';
    const checkOutFormatted = checkOutDate.toLocaleDateString('pt-BR') + ' - 11:00';

    document.getElementById('infoCheckIn').textContent = checkInFormatted;
    document.getElementById('infoCheckOut').textContent = checkOutFormatted;
    document.getElementById('summaryCheckIn').textContent = checkInFormatted;
    document.getElementById('summaryCheckOut').textContent = checkOutFormatted;

    // calculate nights
    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    const basePrice = room.preco_base !== undefined ? parseNumberSafe(room.preco_base) : parseNumberSafe(room.price || 0);
    // compute totals for multiple vagas
    const numVagas = (vagas && vagas.length) ? vagas.length : 0;
    let sumAdicionais = 0;
    if (numVagas > 0) {
        vagas.forEach(v => {
            sumAdicionais += parseNumberSafe(v.adicional);
        });
    }

    const baseTotal = basePrice * nights; // base room price for all nights
    const adicionalTotal = sumAdicionais * nights; // sum of adicionais per night * nights
    const subtotal = baseTotal + adicionalTotal;
    const taxes = 0; // placeholder
    const total = subtotal + taxes;

    // Update price display
    document.getElementById('priceBase').textContent = `Quarto (${nights} noite${nights > 1 ? 's' : ''})`;
    document.getElementById('priceBaseValue').textContent = `R$ ${baseTotal.toFixed(2)}`;

    const elS = document.getElementById('priceSurcharge');
    const elSV = document.getElementById('priceSurchargeValue');
    const surchargeRow = elS ? elS.parentElement : null;

    if (adicionalTotal > 0) {
        elS.style.display = '';
        elSV.style.display = '';
        elS.textContent = `Adicionais (${numVagas} vaga${numVagas > 1 ? 's' : ''})`;
        elSV.textContent = `R$ ${adicionalTotal.toFixed(2)}`;

        // Create or update per-vaga breakdown (adicional * nights)
        let detailsRow = document.getElementById('priceSurchargeDetails');
        if (!detailsRow) {
            detailsRow = document.createElement('div');
            detailsRow.className = 'price-row small';
            detailsRow.id = 'priceSurchargeDetails';
            if (surchargeRow && surchargeRow.parentNode) {
                surchargeRow.parentNode.insertBefore(detailsRow, surchargeRow.nextSibling);
            }
        }

        // Build breakdown lines: one line per selected vaga
        const lines = vagas.map(v => {
            const add = parseNumberSafe(v && v.adicional);
            const addPerStay = add * nights;
            return `<div style="display:flex; justify-content:space-between; font-size:12px; color:#444;">` +
                `<span>${v.nome} (+R$ ${add.toFixed(2)} x ${nights} noite${nights>1?'s':''})</span>` +
                `<span>R$ ${addPerStay.toFixed(2)}</span></div>`;
        }).join('');

        detailsRow.innerHTML = lines;
    } else {
        if (elS) elS.style.display = 'none';
        if (elSV) elSV.style.display = 'none';
        const detailsRow = document.getElementById('priceSurchargeDetails');
        if (detailsRow && detailsRow.parentNode) detailsRow.parentNode.removeChild(detailsRow);
    }

    document.getElementById('priceNights').textContent = `Subtotal`;
    document.getElementById('pricePerNight').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('priceTaxes').textContent = `R$ ${taxes.toFixed(2)}`;
    document.getElementById('priceTotal').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('payNow').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('payLater').textContent = `R$ ${total.toFixed(2)}`;
}

function populateExpirySelects() {
    const expMonth = document.getElementById('expMonth');
    const expYear = document.getElementById('expYear');
    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = String(m).padStart(2, '0');
        opt.textContent = String(m).padStart(2, '0');
        expMonth.appendChild(opt);
    }
    const yearNow = new Date().getFullYear();
    for (let y = yearNow; y <= yearNow + 15; y++) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        expYear.appendChild(opt);
    }
}

function submitPayment() {
    const agree = document.getElementById('agreeCancel').checked;
    if (!agree) {
        alert('Por favor, concorde com a política de cancelamento antes de continuar.');
        return;
    }

    // Simple validation
    const name = document.getElementById('cardName').value.trim();
    const number = document.getElementById('cardNumber').value.replace(/\s+/g, '');
    const cvv = document.getElementById('cvv').value.trim();

    if (!name || number.length < 12 || cvv.length < 3) {
        alert('Por favor, preencha os dados do cartão corretamente.');
        return;
    }

    // IMPORTANTE: Obter user_id do localStorage (definido no login)
    // Se não estiver logado, redirecionar para login
    console.log('DEBUG AGGRESSIVE: ======== START submitPayment ========');
    console.log('DEBUG AGGRESSIVE: localStorage keys:', Object.keys(localStorage));
    console.log('DEBUG AGGRESSIVE: localStorage.userId raw:', localStorage.getItem('userId'));
    console.log('DEBUG AGGRESSIVE: localStorage.userId type:', typeof localStorage.getItem('userId'));

    let userId = parseInt(localStorage.getItem('userId') || '0', 10);
    console.log('DEBUG AGGRESSIVE: after parseInt, userId =', userId, 'type =', typeof userId);
    console.log('DEBUG: userId lido do localStorage:', userId);
    console.log('DEBUG: localStorage.userId =', localStorage.getItem('userId'));

    if (userId <= 0) {
        alert('Você precisa estar logado para fazer uma reserva. localStorage.userId=' + localStorage.getItem('userId'));
        window.location.href = '../../login/login.html';
        return;
    }
    localStorage.setItem('hospedeId', String(userId));
    console.log('DEBUG: Hospede ID definido em localStorage:', userId);
    console.log('DEBUG AGGRESSIVE: ======== CONTINUING submitPayment ========');

    // prepare reservation data and call backend
    const selectedRoom = JSON.parse(localStorage.getItem('selectedRoom') || 'null');
    const selectedVagas = JSON.parse(localStorage.getItem('selectedVagas') || 'null') || null;
    // legacy support
    const singleVaga = JSON.parse(localStorage.getItem('selectedVaga') || 'null');
    const vagas = Array.isArray(selectedVagas) ? selectedVagas : (singleVaga ? [singleVaga] : []);
    const searchData = JSON.parse(localStorage.getItem('searchData') || 'null');

    if (!selectedRoom || !vagas || vagas.length === 0 || !searchData) {
        alert('Dados da reserva não encontrados. Volte e selecione um quarto e vaga(s) novamente.');
        return;
    }

    const checkIn = searchData.checkIn;
    const checkOut = searchData.checkOut;

    const checkInDate = new Date(checkIn + 'T00:00:00');
    const checkOutDate = new Date(checkOut + 'T00:00:00');
    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    const basePrice = selectedRoom.preco_base !== undefined ? parseNumberSafe(selectedRoom.preco_base) : parseNumberSafe(selectedRoom.price || 0);

    // compute totals and then create reservations per vaga
    const numVagas = vagas.length;
    let sumAdicionais = 0;
    vagas.forEach(v => { sumAdicionais += parseNumberSafe(v && v.adicional); });
    const baseTotal = basePrice * nights;
    const adicionalTotal = sumAdicionais * nights;
    const grandTotal = baseTotal + adicionalTotal;

    // disable button and show processing
    const btn = document.getElementById('confirmPayment');
    btn.textContent = 'Processando...';
    btn.disabled = true;

    // We'll split base price equally among vagas and add each vaga adicional
    const baseSharePerVaga = basePrice / Math.max(1, numVagas);

    // Create reservations sequentially and collect results
    const results = [];

    function reserveNext(index) {
        if (index >= vagas.length) {
            // all done
            btn.textContent = 'Concluir Reserva';
            btn.disabled = false;
            const failed = results.filter(r => !r.success);
            if (failed.length === 0) {
                // All succeeded: clear selection and redirect to reservations page
                // Note: hospede_id was already saved at beginning of submitPayment()
                localStorage.removeItem('selectedRoom');
                localStorage.removeItem('selectedVagas');
                localStorage.removeItem('selectedVaga');
                localStorage.removeItem('searchData');
                // Redirect to reservations list
                console.log('Redirecting to cliente_reservas.html');
                window.location.href = 'cliente_reservas.html';
            } else {
                alert('Algumas reservas falharam. Verifique disponibilidade e tente novamente.');
                console.error('Falhas nas reservas:', failed);
            }
            return;
        }

        const vaga = vagas[index];
        const vaga_id = vaga.id;
        const adicional = parseNumberSafe(vaga && vaga.adicional);
        const valor_vaga = (baseSharePerVaga + adicional) * nights;

        const payload = {
            vaga_id: vaga_id,
            checkIn: checkIn,
            checkOut: checkOut,
            hospede_id: userId,
            valor: parseFloat(valor_vaga.toFixed(2))
        };

        console.log('DEBUG AGGRESSIVE VAGA LOOP:', 'userId at this point =', userId, 'type =', typeof userId);
        console.log('DEBUG AGGRESSIVE VAGA LOOP:', 'payload.hospede_id =', payload.hospede_id);
        console.log('DEBUG: Payload sendo enviado para reserva', index + 1, '/', vagas.length, ':', payload);

        fetch('../api/reservar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(r => r.json().then(body => ({ status: r.status, body })))
            .then(({ status, body }) => {
                if (status === 200 && body.success) {
                    results.push({ success: true, reserva_id: body.reserva_id, vaga_id: vaga_id });
                } else {
                    results.push({ success: false, error: body, vaga_id: vaga_id });
                }
                // proceed to next
                reserveNext(index + 1);
            })
            .catch(err => {
                results.push({ success: false, error: err, vaga_id: vaga_id });
                reserveNext(index + 1);
            });
    }

    reserveNext(0);
}
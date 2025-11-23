/**
 * Módulo de autenticação para páginas de cliente
 * Gerencia userId, verificação de login e menu de perfil
 */

// Verificar se o usuário está autenticado
function checkAuthentication() {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10);
    return userId > 0;
}

// Obter ID do usuário logado
function getUserId() {
    return parseInt(localStorage.getItem('userId') || '0', 10);
}

// Obter dados do usuário logado
function getUserData() {
    return {
        userId: parseInt(localStorage.getItem('userId') || '0', 10),
        userEmail: localStorage.getItem('userEmail') || '',
        userRole: localStorage.getItem('userRole') || 'cliente',
        userName: localStorage.getItem('userName') || '',
        userBirth: localStorage.getItem('userBirth') || ''
    };
}

// Fazer logout
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('hospedeId');
    localStorage.removeItem('selectedRoom');
    localStorage.removeItem('selectedVagas');
    localStorage.removeItem('selectedVaga');
    localStorage.removeItem('searchData');
    console.log('Logout realizado. Redirecionando para login...');
    window.location.href = '../../login/login.html';
}

// Fechar menu de perfil
function closeUserMenu() {
    const menu = document.getElementById('userProfileMenu');
    if (menu) {
        menu.style.display = 'none';
    }
}

// Configurar botão de usuário e menu ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    const userButton = document.querySelector('a.user');

    if (!userButton) return;

    // Verificar autenticação
    const isAuthenticated = checkAuthentication();
    const userData = getUserData();

    if (isAuthenticated) {
        // Se logado, criar menu de perfil
        userButton.style.cursor = 'pointer';

        // Criar menu HTML se não existir
        if (!document.getElementById('userProfileMenu')) {
            const menuHTML = `
                <div id="userProfileMenu" style="
                    display: none;
                    position: fixed;
                    top: 50px;
                    right: 20px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    min-width: 250px;
                    padding: 0;
                    overflow: hidden;
                ">
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 16px;
                        border-bottom: 1px solid #e0e0e0;
                    ">
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Perfil do Usuário</div>
                        <div style="font-size: 12px; opacity: 0.9;">👤 ${escapeHtml(userData.userEmail)}</div>
                    </div>
                    
                        <div style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0;">
                            <div style="color: #666; font-size: 12px; margin-bottom: 8px;">Nome</div>
                            <div style="font-weight: 600; font-size: 16px; color: #333;">${escapeHtml(userData.userName) || escapeHtml(userData.userEmail)}</div>
                        </div>

                        <div style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; display:flex; gap:12px;">
                            <div style="flex:1;">
                                <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Data de Nascimento</div>
                                <div style="font-weight: 500; font-size: 13px; color: #333;">${escapeHtml(userData.userBirth)}</div>
                            </div>
                            <div style="flex:1; text-align:right;">
                                <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Função</div>
                                <div style="font-weight: 500; font-size: 13px; color: #333;">${escapeHtml(userData.userRole)}</div>
                            </div>
                        </div>
                    
                    <div style="padding: 12px 16px;">
                        <button id="myReservationsBtn" style="
                            width: 100%;
                            padding: 10px;
                            background: #3498db;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                            margin-bottom:8px;
                        ">Minhas Reservas</button>
                        <button id="logoutBtn" style="
                            width: 100%;
                            padding: 10px;
                            background: #e74c3c;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                        ">Fazer Logout</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', menuHTML);
        }

        // Eventos do menu
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = document.getElementById('userProfileMenu');
            if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Deseja realmente fazer logout?')) {
                    logout();
                }
            });
        }

        // Minhas Reservas button
        const myReservationsBtn = document.getElementById('myReservationsBtn');
        if (myReservationsBtn) {
            myReservationsBtn.addEventListener('click', function() {
                // redirect to reservations page (in same folder)
                window.location.href = 'cliente_reservas.html';
            });
        }

        // Fechar menu ao clicar fora
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('userProfileMenu');
            if (menu && !userButton.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });

    } else {
        // Se não logado, redirecionar para login
        userButton.title = 'Clique para fazer login';
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../../login/login.html';
        });
    }

    console.log('Auth verificado. Usuário ID:', userData.userId);
});

// Função para escapar HTML (segurança)
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
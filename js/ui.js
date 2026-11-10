export function setupUI(network) {
    const btnSolo    = document.getElementById('btn-solo');
    const btnHost    = document.getElementById('btn-host');
    const btnJoin    = document.getElementById('btn-join');
    const btnConnect = document.getElementById('btn-connect');
    const roomInput  = document.getElementById('room-id-input');
    const statusMsg  = document.getElementById('status-message');

    function enterGame() {
        try {
            const p = document.body.requestPointerLock();
            if (p && p.catch) p.catch(() => {});
        } catch (e) {}

        document.getElementById('menu').style.display = 'none';
        if (window.startGame) window.startGame();

        setTimeout(() => {
            const menu = document.getElementById('menu');
            const overlay = document.getElementById('lock-overlay');
            if (menu && overlay &&
                menu.style.display === 'none' &&
                !document.pointerLockElement) {
                overlay.style.display = 'flex';
            }
        }, 700);
    }

    btnSolo.addEventListener('click', enterGame);

    btnHost.addEventListener('click', () => {
        enterGame();
        network.host();
    });

    btnJoin.addEventListener('click', () => {
        btnJoin.style.display = 'none';
        btnHost.style.display = 'none';
        roomInput.style.display = 'block';
        btnConnect.style.display = 'block';
        statusMsg.textContent = 'Entre l\'ID de la salle à rejoindre.';
    });

    btnConnect.addEventListener('click', () => {
        const id = roomInput.value.trim();
        if (!id) {
            statusMsg.textContent = 'Entre un ID valide.';
            return;
        }
        enterGame();
        network.join(id);
    });
}

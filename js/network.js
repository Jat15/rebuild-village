export function setupNetwork() {
    const network = {
        peer: null,
        conn: null,
        isHost: false,
        onDataCallback: null,

        host: function() {
            this.isHost = true;

            if (window.startGame) window.startGame();

            try {
                this.peer = new Peer(null, { debug: 1 });
            } catch (e) {
                console.warn('PeerJS indisponible, mode solo :', e);
                showRoomInfo('mode solo (pas d\'ID)');
                return;
            }

            // Affiche "Connexion..." dans le badge en attendant l'ID
            showRoomInfo('connexion...');

            this.peer.on('open', (id) => {
                console.log('ID de l\'hôte :', id);
                window.roomId = id;
                showRoomInfo(id);
                showToast('✅ Salle créée — Appuyez sur C pour copier l\'ID');
            });

            this.peer.on('connection', (conn) => {
                this.conn = conn;
                this.setupConnection(conn);
                showToast('👥 Un joueur a rejoint !');
            });

            this.peer.on('error', (err) => {
                console.warn('PeerJS (Hôte) :', err.type);
                showRoomInfo('erreur : ' + err.type);
            });
        },

        join: function(hostId) {
            this.isHost = false;
            window.roomId = hostId;
            showRoomInfo(hostId, 'connecté à');

            try {
                this.peer = new Peer({ debug: 1 });
            } catch (e) {
                console.warn('PeerJS indisponible :', e);
                return;
            }

            this.peer.on('open', () => {
                this.conn = this.peer.connect(hostId);
                this.setupConnection(this.conn);
            });

            this.peer.on('error', (err) => {
                console.warn('PeerJS (Client) :', err.type);
                const s = document.getElementById('status-message');
                if (s) s.textContent = 'Erreur : ' + err.type;
                showToast('❌ Impossible de rejoindre : ' + err.type);
            });
        },

        setupConnection: function(conn) {
            conn.on('open', () => {
                if (window.startGame) window.startGame();
            });
            conn.on('data', (data) => {
                if (this.onDataCallback) this.onDataCallback(data);
            });
            conn.on('close', () => {
                console.log('Connexion fermée.');
                showToast('⚠️ Déconnecté du serveur.');
            });
        },

        send: function(data) {
            if (this.conn && this.conn.open) this.conn.send(data);
        },
        broadcast: function(data) {
            if (this.isHost && this.conn && this.conn.open) this.conn.send(data);
        },
        onData: function(cb) { this.onDataCallback = cb; }
    };

    return network;
}

// Affiche/actualise le badge #room-info
function showRoomInfo(idText, labelText) {
    const badge = document.getElementById('room-info');
    const label = document.getElementById('room-info-label');
    const idEl  = document.getElementById('room-info-id');
    const hint  = document.getElementById('room-info-hint');
    if (!badge || !idEl) return;

    if (label && labelText) label.textContent = labelText + ' : ';
    idEl.textContent = idText;
    badge.style.display = 'flex';

    // Le hint [C] n'a de sens que s'il y a vraiment un ID à copier
    if (hint) hint.style.display = (idText && !idText.includes(' ')) ? 'inline-block' : 'none';
}

// Toast partagé (défini aussi dans main.js, on réutilise si dispo)
function showToast(msg) {
    if (window.showToast) { window.showToast(msg); return; }
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

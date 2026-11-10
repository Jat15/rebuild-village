import * as THREE from 'three';

export function createPlayer(camera) {
    camera.rotation.order = 'YXZ';

    const player = {
        camera,
        speed: 5.0,
        keys: { forward: false, backward: false, left: false, right: false },
        carriedBrick: null,
        raycaster: new THREE.Raycaster(),
        yaw: 0,
        pitch: 0
    };

    document.addEventListener('keydown', (e) => onKeyDown(e, player));
    document.addEventListener('keyup', (e) => onKeyUp(e, player));
    document.addEventListener('mousedown', (e) => onMouseDown(e, player));
    document.addEventListener('mousemove', (e) => onMouseMove(e, player));

    const overlay = document.getElementById('lock-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            try {
                const p = document.body.requestPointerLock();
                if (p && p.catch) p.catch(() => {});
            } catch (e) {}
        });
    }

    let wasLocked = false;
    document.addEventListener('pointerlockchange', () => {
        const ov = document.getElementById('lock-overlay');
        const menu = document.getElementById('menu');
        if (!ov) return;
        const locked = !!document.pointerLockElement;
        const inGame = menu && menu.style.display === 'none';

        if (locked) {
            wasLocked = true;
            ov.style.display = 'none';
        } else if (inGame && wasLocked) {
            ov.style.display = 'flex';
        }
    });

    document.addEventListener('pointerlockerror', () => {
        const ov = document.getElementById('lock-overlay');
        const menu = document.getElementById('menu');
        if (ov && menu && menu.style.display === 'none') {
            ov.style.display = 'flex';
        }
    });

    return player;
}

function onKeyDown(e, player) {
    switch (e.code) {
        case 'KeyW': case 'KeyZ': player.keys.forward = true; break;
        case 'KeyS': player.keys.backward = true; break;
        case 'KeyA': case 'KeyQ': player.keys.left = true; break;
        case 'KeyD': player.keys.right = true; break;
        case 'KeyC': copyRoomId(); break;
    }
}
function onKeyUp(e, player) {
    switch (e.code) {
        case 'KeyW': case 'KeyZ': player.keys.forward = false; break;
        case 'KeyS': player.keys.backward = false; break;
        case 'KeyA': case 'KeyQ': player.keys.left = false; break;
        case 'KeyD': player.keys.right = false; break;
    }
}

// Copie l'ID de salle dans le presse-papiers
function copyRoomId() {
    const id = window.roomId;
    if (!id) {
        showToast('ℹ️ Aucun ID de salle (mode solo)');
        return;
    }
    const msgOk = '📋 ID copié : ' + id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id)
            .then(() => showToast(msgOk))
            .catch(() => showToast('ID : ' + id));
    } else {
        // Fallback : affiche juste l'ID dans un toast
        showToast('ID : ' + id);
    }
}

function showToast(msg) {
    if (window.showToast) { window.showToast(msg); return; }
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

function onMouseMove(e, player) {
    if (!document.pointerLockElement) return;
    player.yaw   -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    const limit = Math.PI / 2 - 0.01;
    player.pitch = Math.max(-limit, Math.min(limit, player.pitch));
    player.camera.rotation.set(player.pitch, player.yaw, 0);
}

function onMouseDown(e, player) {
    const menu = document.getElementById('menu');
    if (menu && menu.style.display !== 'none') return;

    if (!document.pointerLockElement) {
        try {
            const p = document.body.requestPointerLock();
            if (p && p.catch) p.catch(() => {});
        } catch (err) {}
        return;
    }
    if (e.button === 0) tryPickupBrick(player);
    else if (e.button === 2) { e.preventDefault(); tryPlaceBrick(player); }
}

export function updatePlayer(player, delta) {
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const right   = new THREE.Vector3( Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    const move = new THREE.Vector3();

    if (player.keys.forward)  move.add(forward);
    if (player.keys.backward) move.sub(forward);
    if (player.keys.right)    move.add(right);
    if (player.keys.left)     move.sub(right);

    if (move.length() > 0) {
        move.normalize();
        player.camera.position.addScaledVector(move, player.speed * delta);
    }
    player.camera.position.y = 1.7;
}

function isVisible(obj) {
    let o = obj;
    while (o) { if (!o.visible) return false; o = o.parent; }
    return true;
}

function tryPickupBrick(player) {
    if (player.carriedBrick) return;

    player.raycaster.setFromCamera({ x: 0, y: 0 }, player.camera);
    player.raycaster.far = 4;
    const hits = player.raycaster.intersectObjects(window.gameScene.children, true);

    for (const hit of hits) {
        if (!isVisible(hit.object)) continue;
        let obj = hit.object;
        while (obj && !obj.userData.isBrick) obj = obj.parent;
        if (!obj || !isVisible(obj)) continue;

        let targetIndex = -1;
        if (obj.userData.targetRef && window.blueprint) {
            targetIndex = window.blueprint.targets.indexOf(obj.userData.targetRef);
            if (targetIndex >= 0) {
                window.blueprint.unfill(obj.userData.targetRef);
                if (obj.userData.targetRef.ghost) obj.userData.targetRef.ghost.visible = true;
                if (window.updateProgress) window.updateProgress();
            }
            delete obj.userData.targetRef;
        }

        player.carriedBrick = obj;
        obj.parent.remove(obj);
        obj.position.set(0.35, -0.35, -0.9);
        obj.rotation.set(0, 0, 0);
        player.camera.add(obj);
        updateHUD(1);

        syncSend({ type: 'brick-picked', id: obj.uuid, targetIndex });
        break;
    }
}

function tryPlaceBrick(player) {
    if (!player.carriedBrick) return;

    const brick = player.carriedBrick;
    player.camera.remove(brick);

    const fwd = new THREE.Vector3();
    player.camera.getWorldDirection(fwd);
    const pos = player.camera.position.clone().add(fwd.multiplyScalar(2.5));
    pos.y = 0.2;

    const target = window.blueprint ? window.blueprint.findNearby(pos, 1.8) : null;
    let targetIndex = -1;

    if (target) {
        targetIndex = target.index;
        window.blueprint.fill(target, brick);
        brick.userData.targetRef = target;
        if (target.ghost) target.ghost.visible = false;
        window.gameScene.add(brick);
        if (window.updateProgress) window.updateProgress();
    } else {
        brick.position.copy(pos);
        brick.rotation.set(0, 0, 0);
        window.gameScene.add(brick);
    }

    player.carriedBrick = null;
    updateHUD(0);

    syncSend({
        type: 'brick-placed',
        id: brick.uuid,
        pos: { x: brick.position.x, y: brick.position.y, z: brick.position.z },
        rotX: brick.rotation.x,
        rotY: brick.rotation.y,
        rotZ: brick.rotation.z,
        targetIndex
    });
}

function syncSend(data) {
    if (window.network && window.network.isHost) window.network.broadcast(data);
    else if (window.network && window.network.conn) window.network.send(data);
}

function updateHUD(count) {
    const info = document.getElementById('brick-info');
    if (info) info.textContent = 'Briques portées : ' + count;
}

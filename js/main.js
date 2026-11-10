import * as THREE from 'three';
import { setupWorld, createBrick } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { setupNetwork } from './network.js';
import { setupUI } from './ui.js';
import { createBlueprint } from './blueprint.js';
import { createPreview } from './preview.js';

let scene, camera, renderer, player, network, blueprint, preview;
let victoryShown = false;

const world = setupWorld();
scene = world.scene;
camera = world.camera;
renderer = world.renderer;
scene.add(camera);
window.gameScene = scene;

blueprint = createBlueprint();
window.blueprint = blueprint;

for (const target of blueprint.targets) {
    const ghost = createGhostBrick();
    ghost.position.copy(target.position);
    ghost.rotation.set(target.rotationX, target.rotationY, target.rotationZ);
    scene.add(ghost);
    target.ghost = ghost;
}

const brickCount = blueprint.targets.length;
for (let i = 0; i < brickCount; i++) {
    const brick = createBrick();
    const angle = (i / brickCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const radius = 3.5 + Math.random() * 1.5;
    brick.position.set(
        Math.cos(angle) * radius,
        0.2,
        Math.sin(angle) * radius
    );
    brick.rotation.y = Math.random() * Math.PI * 2;
    scene.add(brick);
}

player = createPlayer(camera);
network = setupNetwork();
window.network = network;

network.onData((data) => {
    if (data.type === 'brick-picked') {
        const brick = scene.getObjectByProperty('uuid', data.id);
        if (brick) brick.visible = false;
        if (data.targetIndex >= 0 && blueprint.targets[data.targetIndex]) {
            const t = blueprint.targets[data.targetIndex];
            blueprint.unfill(t);
            if (t.ghost) t.ghost.visible = true;
            updateProgressUI();
        }
    } else if (data.type === 'brick-placed') {
        let brick = scene.getObjectByProperty('uuid', data.id);
        if (!brick) {
            brick = createBrick();
            brick.uuid = data.id;
            scene.add(brick);
        }
        brick.visible = true;
        brick.position.set(data.pos.x, data.pos.y, data.pos.z);
        brick.rotation.set(data.rotX || 0, data.rotY || 0, data.rotZ || 0);

        if (data.targetIndex >= 0 && blueprint.targets[data.targetIndex]) {
            const t = blueprint.targets[data.targetIndex];
            blueprint.fill(t, brick);
            brick.userData.targetRef = t;
            if (t.ghost) t.ghost.visible = false;
            updateProgressUI();
        }
    }
});

setupUI(network);

window.startGame = () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('preview-panel').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';

    if (!preview) preview = createPreview(blueprint);
    updateProgressUI();
};

window.updateProgress = () => updateProgressUI();

// Exposé globalement pour network.js et player.js
window.showToast = showToast;

function updateProgressUI() {
    const info = document.getElementById('progress-info');
    if (!info) return;
    const p = blueprint.getProgress();
    info.textContent = 'Progression : ' + p.filled + ' / ' + p.total;

    if (p.filled === p.total && p.total > 0 && !victoryShown) {
        victoryShown = true;
        showToast('🏆 Maison reconstruite !');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

function createGhostBrick() {
    const group = new THREE.Group();
    const L = 1.0, H = 0.4, D = 0.4;

    const geo = new THREE.BoxGeometry(L, H, D);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0.14,
        depthWrite: false
    });
    group.add(new THREE.Mesh(geo, mat));

    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
        color: 0x8ecae6,
        transparent: true,
        opacity: 0.7
    });
    group.add(new THREE.LineSegments(edges, lineMat));

    return group;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('contextmenu', (e) => e.preventDefault());

let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    updatePlayer(player, delta);
    if (preview) preview.update();
    renderer.render(scene, camera);
}
animate();

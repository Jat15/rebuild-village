import * as THREE from 'three';
import { createBrick } from './world.js';

export function createPreview(blueprint) {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return { update: () => {} };

    const w = 240, h = 180;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a24);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 5);
    scene.add(dir);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a3a44, flatShading: true })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Aperçu fantôme (cyan) de la maison terminée
    for (const target of blueprint.targets) {
        const brick = createBrick();
        brick.position.copy(target.position);
        brick.rotation.set(target.rotationX, target.rotationY, target.rotationZ);
        brick.traverse((o) => {
            if (o.isMesh && o.material) {
                o.material = o.material.clone();
                o.material.color.setHex(0x8ecae6);
                o.material.emissive = new THREE.Color(0x1a3a4a);
            }
            if (o.isLineSegments && o.material) {
                o.material = o.material.clone();
                o.material.color.setHex(0x2a5a6a);
            }
        });
        scene.add(brick);
    }

    let angle = 0;
    return {
        update() {
            angle += 0.008;
            const r = 5;
            camera.position.set(Math.cos(angle) * r, 2.8, Math.sin(angle) * r);
            camera.lookAt(0, 0.6, 0);
            renderer.render(scene, camera);
        }
    };
}

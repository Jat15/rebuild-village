import * as THREE from 'three';

// Dimensions d'une brique (proportions maison : 5 : 2 : 2)
export const BRICK_L = 1.0;  // longueur (X)
export const BRICK_H = 0.4;  // hauteur (Y)
export const BRICK_D = 0.4;  // profondeur (Z)

export function setupWorld() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 6);

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const dir = new THREE.DirectionalLight(0xfff2d8, 1.4);
    dir.position.set(8, 15, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    scene.add(dir);

    // Sol : herbe low-poly
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x5a8f4a,
        flatShading: true,
        roughness: 1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Terrain vague autour de la maison (terre battue)
    const plotGeo = new THREE.PlaneGeometry(8, 8);
    const plotMat = new THREE.MeshStandardMaterial({
        color: 0x8f7a5a,
        flatShading: true,
        roughness: 1
    });
    const plot = new THREE.Mesh(plotGeo, plotMat);
    plot.rotation.x = -Math.PI / 2;
    plot.position.y = 0.01;
    plot.receiveShadow = true;
    scene.add(plot);

    return { scene, camera, renderer };
}

// Brique de maison : boîte rectangulaire, couleur terre cuite, sans studs
const BRICK_COLORS = [0xa84434, 0x9a3c2e, 0xb54e3e, 0x8f3527, 0xb94636];

export function createBrick() {
    const group = new THREE.Group();

    const geo = new THREE.BoxGeometry(BRICK_L, BRICK_H, BRICK_D);

    // Couleur légèrement variée par brique (effet réaliste de mur de briques)
    const color = BRICK_COLORS[Math.floor(Math.random() * BRICK_COLORS.length)];

    const mat = new THREE.MeshStandardMaterial({
        color: color,
        flatShading: true,
        roughness: 0.85,
        metalness: 0.05
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Léger liseré sombre pour suggérer le mortier entre les briques
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
        color: 0x5a2018,
        transparent: true,
        opacity: 0.55
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    group.userData.isBrick = true;
    return group;
}

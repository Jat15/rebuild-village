import * as THREE from 'three';

// Maison low-poly réaliste : 2 rangs de murs + toit à deux pans
// Toutes les briques sont les mêmes (BRICK_L x BRICK_H x BRICK_D = 1 x 0.4 x 0.4)
export function createBlueprint() {
    const targets = [];

    const add = (x, y, z, rot = {}) => {
        targets.push({
            position: new THREE.Vector3(x, y, z),
            rotationX: rot.rx || 0,
            rotationY: rot.ry || 0,
            rotationZ: rot.rz || 0,
            filled: false,
            mesh: null,
            ghost: null,
            index: targets.length
        });
    };

    const RY = Math.PI / 2;
    const SLOPE = 0.38; // ~22°, angle du toit

    // --- Murs avant (z = -0.9) : 2 rangs x 2 briques ---
    add(-0.5, 0.2, -0.9); add(0.5, 0.2, -0.9);
    add(-0.5, 0.6, -0.9); add(0.5, 0.6, -0.9);

    // --- Murs arrière (z = +0.9) ---
    add(-0.5, 0.2, 0.9); add(0.5, 0.2, 0.9);
    add(-0.5, 0.6, 0.9); add(0.5, 0.6, 0.9);

    // --- Murs latéraux (x = ±0.9) : tournés de 90° ---
    add(-0.9, 0.2, -0.5, { ry: RY }); add(-0.9, 0.2, 0.5, { ry: RY });
    add(-0.9, 0.6, -0.5, { ry: RY }); add(-0.9, 0.6, 0.5, { ry: RY });
    add( 0.9, 0.2, -0.5, { ry: RY }); add( 0.9, 0.2, 0.5, { ry: RY });
    add( 0.9, 0.6, -0.5, { ry: RY }); add( 0.9, 0.6, 0.5, { ry: RY });

    // --- Toit à deux pans (faîtage implicite au centre) ---
    // Pan gauche : penche vers +X
    add(-0.4, 1.0, -0.5, { rz:  SLOPE });
    add(-0.4, 1.0,  0.5, { rz:  SLOPE });
    // Pan droit : penche vers -X
    add( 0.4, 1.0, -0.5, { rz: -SLOPE });
    add( 0.4, 1.0,  0.5, { rz: -SLOPE });

    return {
        targets,

        getProgress() {
            const filled = targets.filter(t => t.filled).length;
            return { filled, total: targets.length };
        },

        findNearby(pos, threshold = 1.8) {
            let best = null, bestDist = threshold;
            for (const t of targets) {
                if (t.filled) continue;
                const d = pos.distanceTo(t.position);
                if (d < bestDist) { bestDist = d; best = t; }
            }
            return best;
        },

        fill(target, mesh) {
            target.filled = true;
            target.mesh = mesh;
            mesh.position.copy(target.position);
            mesh.rotation.set(target.rotationX, target.rotationY, target.rotationZ);
        },

        unfill(target) {
            target.filled = false;
            target.mesh = null;
        }
    };
}

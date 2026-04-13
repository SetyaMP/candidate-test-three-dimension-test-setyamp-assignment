import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────
//  SCENE
// ─────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// ─────────────────────────────────────────────
//  CAMERA
// ─────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    500
);
camera.position.set(4.5, 3.2, 5.5);
camera.lookAt(1.25, 0.2, 1.25);

// ─────────────────────────────────────────────
//  RENDERER  – append ke body langsung
// ─────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

// Ganti konten container jika ada, atau append ke body
const container = document.getElementById('illustration-3d-container');
if (container) {
    container.style.cssText = 'width:100vw;height:100vh;overflow:hidden;';
    container.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}

// ─────────────────────────────────────────────
//  CONTROLS
// ─────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.target.set(1.25, 0.2, 1.5);
controls.update();

// ─────────────────────────────────────────────
//  LIGHTING
// ─────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const sun = new THREE.DirectionalLight(0xfff8ee, 1.6);
sun.position.set(6, 10, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far  = 50;
sun.shadow.camera.left   = -8;
sun.shadow.camera.right  =  8;
sun.shadow.camera.top    =  8;
sun.shadow.camera.bottom = -8;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xddeeff, 0.35);
fill.position.set(-4, 2, -4);
scene.add(fill);

// ─────────────────────────────────────────────
//  AXIS HELPER
// ─────────────────────────────────────────────
const axesHelper = new THREE.AxesHelper(2.5);
scene.add(axesHelper);

// ─────────────────────────────────────────────
//  WOOD DIMENSIONS  (dari expected-result.jpg)
//
//   Board A : 3 m × 0.5 m × 0.2 m  (along Z)
//   Board B : 2 m × 0.5 m × 0.2 m  (along X, di atas, corner kiri)
// ─────────────────────────────────────────────
const A_L = 3,   A_W = 0.5,  A_H = 0.2;   // Board A
const B_L = 2,   B_W = 0.5,  B_H = 0.2;   // Board B

// ─────────────────────────────────────────────
//  BUAT MATERIAL KAYU (fallback sederhana)
// ─────────────────────────────────────────────
function makeFallbackMaterial() {
    return new THREE.MeshStandardMaterial({
        color:     new THREE.Color(0xa07840),
        roughness: 0.85,
        metalness: 0,
    });
}

// ─────────────────────────────────────────────
//  BUAT BOARD (BoxGeometry)
// ─────────────────────────────────────────────
function makeBoard(w, h, d, mat, cx, cy, cz) {
    const geo  = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// ─────────────────────────────────────────────
//  TEXT SPRITE UNTUK LABEL DIMENSI
// ─────────────────────────────────────────────
function makeLabel(text, x, y, z) {
    const canvas  = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font         = 'bold 32px Arial';
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, depthTest: false })
    );
    spr.scale.set(0.5, 0.125, 1);
    spr.position.set(x, y, z);
    spr.renderOrder = 999;
    scene.add(spr);
}

// ─────────────────────────────────────────────
//  GARIS DIMENSI  (line + dots + label)
// ─────────────────────────────────────────────
function dimLine(ax, ay, az, bx, by, bz, label, lx, ly, lz) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false });

    // Garis utama
    const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ax, ay, az),
        new THREE.Vector3(bx, by, bz),
    ]);
    const ln = new THREE.Line(geo, mat);
    ln.renderOrder = 998;
    scene.add(ln);

    // Dot di kedua ujung
    const dotG = new THREE.SphereGeometry(0.022, 8, 8);
    const dotM = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false });
    [[ax,ay,az],[bx,by,bz]].forEach(([x,y,z]) => {
        const d = new THREE.Mesh(dotG, dotM);
        d.position.set(x, y, z);
        d.renderOrder = 999;
        scene.add(d);
    });

    // Label
    makeLabel(label, lx, ly, lz);
}

// ─────────────────────────────────────────────
//  TAMBAH SEMUA ANOTASI DIMENSI
// ─────────────────────────────────────────────
function addDimensions() {
    // Board A : panjang 3m (sepanjang Z)
    dimLine( A_W+0.18, A_H, 0,
             A_W+0.18, A_H, A_L,
             '3m',
             A_W+0.45, A_H+0.12, A_L/2 );

    // Board A : lebar 0.5m (sepanjang X, ujung depan)
    dimLine( 0,   -0.15, A_L+0.05,
             A_W, -0.15, A_L+0.05,
             '0.5m',
             A_W/2, -0.28, A_L+0.05 );

    // Board A : tinggi 0.2m (sisi kanan-jauh)
    dimLine( A_W+0.15, 0,    A_L,
             A_W+0.15, A_H,  A_L,
             '0.2m',
             A_W+0.42, A_H/2, A_L );

    // Board B : panjang 2m (sepanjang X, atas-depan)
    dimLine( 0,   A_H+B_H+0.12, -0.1,
             B_L, A_H+B_H+0.12, -0.1,
             '2m',
             B_L/2, A_H+B_H+0.26, -0.1 );

    // Board B : lebar 2m → kiri (sepanjang Z, sisi kiri atas)
    dimLine( -0.22, A_H+B_H+0.12, 0,
             -0.22, A_H+B_H+0.12, B_W,
             '2m',
             -0.22, A_H+B_H+0.26, B_W/2 );

    // Board B : tinggi 0.2m (sisi kanan)
    dimLine( B_L+0.15, A_H,       B_W/2,
             B_L+0.15, A_H+B_H,   B_W/2,
             '0.2m',
             B_L+0.42, A_H+B_H/2, B_W/2 );

    // Celah dalam 0.4m
    dimLine( A_W,       A_H+0.06, B_W,
             A_W+0.4,   A_H+0.06, B_W,
             '0.4m',
             A_W+0.2, A_H+0.18, B_W );

    // Step tinggi 0.02m
    dimLine( A_W+0.55, A_H-0.02, B_W+0.05,
             A_W+0.55, A_H,      B_W+0.05,
             '0.02m',
             A_W+0.82, A_H-0.01, B_W+0.05 );

    // 0.5m bawah kiri (Z)
    dimLine( -0.15, -0.12, 0,
             -0.15, -0.12, B_W,
             '0.5m',
             -0.15, -0.26, B_W/2 );

    // 0.54m bawah tengah
    dimLine( 0,    -0.26, B_W+0.04,
             A_W,  -0.26, B_W+0.04,
             '0.54m',
             A_W/2, -0.40, B_W+0.04 );
}

// ─────────────────────────────────────────────
//  LOAD TEXTURE KAYU & BUAT MATERIAL
// ─────────────────────────────────────────────
function loadTexture(path) {
    return new Promise((resolve) => {
        new THREE.TextureLoader().load(
            path,
            (t) => {
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                resolve(t);
            },
            undefined,
            () => resolve(null)   // jika gagal → null
        );
    });
}

// ─────────────────────────────────────────────
//  MAIN : load texture lalu build scene
// ─────────────────────────────────────────────
async function buildScene() {
    // Coba load texture
    const [colorTex, normalTex] = await Promise.all([
        loadTexture('model/wood/wood.fbm/Color_A02.jpg'),
        loadTexture('model/wood/wood.fbm/NormalMap.png'),
    ]);

    // Material Board A  (3m, repeat lebih banyak)
    function makeMat(repX, repY) {
        const m = new THREE.MeshStandardMaterial({
            color:       new THREE.Color(0xb08040),
            roughness:   0.82,
            metalness:   0,
        });
        if (colorTex) {
            m.map = colorTex.clone();
            m.map.repeat.set(repX, repY);
            m.map.needsUpdate = true;
        }
        if (normalTex) {
            m.normalMap = normalTex.clone();
            m.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
            m.normalMap.repeat.set(repX, repY);
            m.normalMap.needsUpdate = true;
            m.normalScale = new THREE.Vector2(1.5, 1.5);
        }
        return m;
    }

    const matA = makeMat(6, 1);   // Board A: 3m panjang → repeat x6
    const matB = makeMat(4, 1);   // Board B: 2m panjang → repeat x4

    // ── Board A : plank horizontal, sepanjang Z ──
    makeBoard(A_W, A_H, A_L,  matA,
              A_W/2,          // cx
              A_H/2,          // cy
              A_L/2);         // cz

    // ── Board B : plank silang, sepanjang X, di atas Board A ──
    makeBoard(B_L, B_H, B_W,  matB,
              B_L/2,          // cx
              A_H + B_H/2,    // cy  (duduk di atas Board A)
              B_W/2);         // cz

    // ── Anotasi dimensi ──
    addDimensions();

    // ── Sembunyikan loading screen ──
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.transition = 'opacity 0.5s';
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 600);
    }
}

// ─────────────────────────────────────────────
//  ANIMATION LOOP
// ─────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// ─────────────────────────────────────────────
//  RESPONSIVE
// ─────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
animate();          // mulai render loop DULU
buildScene();       // build scene async (tidak blocking render)

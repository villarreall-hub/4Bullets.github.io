/**
 * 3D Viewer Logic using Three.js for STL files
 * Integrated with 4Bullets portfolio
 */

let scene, camera, renderer, controls, stlMesh;
let animationId;

function init3DViewer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous renderer if exists
    container.innerHTML = '';

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4);

    // Camera
    camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(200, 200, 200);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // Grid helper (optional, removed for cleaner look)
    // const grid = new THREE.GridHelper(200, 20, 0x000000, 0xcccccc);
    // grid.material.opacity = 0.2;
    // grid.material.transparent = true;
    // scene.add(grid);

    animate();
}

function loadSTL(url, color = 0x666666) {
    const loader = new THREE.STLLoader();

    console.log('Attempting to load STL from:', url);

    // Show loading state
    const container = document.getElementById('viewer3d-container');
    const loaderEl = document.createElement('div');
    loaderEl.className = 'viewer-loader';
    loaderEl.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-danger mb-2" role="status"></div>
            <div class="text-white small" id="stl-progress">Cargando...</div>
        </div>
    `;
    container.appendChild(loaderEl);

    loader.load(
        url,
        function (geometry) {
            console.log('STL loaded successfully:', url);
            // Remove existing mesh
            if (stlMesh) scene.remove(stlMesh);

            // Material - Sleek industrial look
            const material = new THREE.MeshPhongMaterial({
                color: color,
                specular: 0x222222,
                shininess: 100
            });

            stlMesh = new THREE.Mesh(geometry, material);

            // Center the model
            geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            stlMesh.position.sub(center);

            scene.add(stlMesh);

            // Adjust camera to fit model
            const size = new THREE.Vector3();
            geometry.boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 2.2; // Adjusted zoom
            camera.position.set(cameraZ, cameraZ, cameraZ);
            camera.updateProjectionMatrix();

            controls.reset();

            // Remove loader
            if (loaderEl.parentElement) loaderEl.remove();
        },
        function (xhr) {
            if (xhr.lengthComputable) {
                const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                const progressEl = document.getElementById('stl-progress');
                if (progressEl) progressEl.innerText = percentComplete + '%';
            }
        },
        function (error) {
            console.error('An error happened while loading the STL:', error);
            const progressEl = document.getElementById('stl-progress');
            if (progressEl) {
                progressEl.innerText = 'Error al cargar archivo';
                progressEl.classList.add('text-danger');
            }
            // Keep loader visible with error message
        }
    );
}

function animate() {
    animationId = requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('viewer3d-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

// Event Listeners for MODAL
document.addEventListener('DOMContentLoaded', () => {
    const viewerModal = document.getElementById('viewer3dModal');
    const closeBtn = document.getElementById('closeViewer3d');

    if (viewerModal) {
        window.addEventListener('resize', onWindowResize);

        // Function to open viewer
        window.open3DViewer = (stlUrl, title, color = 0x666666) => {
            const titleEl = document.getElementById('viewer3dTitle');
            if (titleEl) titleEl.innerText = title;

            viewerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();

            init3DViewer('viewer3d-container');
            loadSTL(stlUrl, color);
        };

        const closeViewer = () => {
            viewerModal.classList.remove('active');
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
            cancelAnimationFrame(animationId);
            if (renderer) {
                renderer.dispose();
                renderer.forceContextLoss();
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeViewer);
        viewerModal.addEventListener('click', (e) => {
            if (e.target === viewerModal) closeViewer();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && viewerModal.classList.contains('active')) closeViewer();
        });
    }

    // Attach listeners to "Ver 3D" buttons
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-3d-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const url = btn.dataset.stl;
            const title = btn.dataset.title;
            const color = btn.dataset.color || '#666666';
            window.open3DViewer(url, title, color);
        }
    });
});

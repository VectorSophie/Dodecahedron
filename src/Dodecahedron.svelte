<script>
  import * as THREE from 'three';
  import { onMount } from 'svelte';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { writable } from 'svelte/store';

  let canvas;

  const phi = (1 + Math.sqrt(5)) / 2;

  const vertices = [
    new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,-1),
    new THREE.Vector3(1,-1,1), new THREE.Vector3(1,-1,-1),
    new THREE.Vector3(-1,1,1), new THREE.Vector3(-1,1,-1),
    new THREE.Vector3(-1,-1,1), new THREE.Vector3(-1,-1,-1),
    new THREE.Vector3(0, phi, 1/phi), new THREE.Vector3(0, phi, -1/phi),
    new THREE.Vector3(0, -phi, 1/phi), new THREE.Vector3(0, -phi, -1/phi),
    new THREE.Vector3(1/phi, 0, phi), new THREE.Vector3(-1/phi, 0, phi),
    new THREE.Vector3(1/phi, 0, -phi), new THREE.Vector3(-1/phi, 0, -phi),
    new THREE.Vector3(phi, 1/phi, 0), new THREE.Vector3(phi, -1/phi, 0),
    new THREE.Vector3(-phi, -1/phi, 0), new THREE.Vector3(-phi, 1/phi, 0) // fixed V19
  ];

  const edgesIndices = [
    [8,9],[10,11],[12,13],[14,15],[16,17],[18,19],
    [0,8],[0,12],[0,16],[1,9],[1,14],[1,16],
    [2,10],[2,12],[2,17],[3,11],[3,14],[3,17],
    [4,8],[4,13],[4,19],[5,9],[5,15],[5,19],
    [6,10],[6,13],[6,18],[7,11],[7,15],[7,18]
  ];

  const facesVertices = [
    [0,8,4,13,12], [0,16,1,9,8], [0,12,2,17,16],
    [1,16,17,3,14], [1,14,15,5,9], [2,12,13,6,10],
    [2,10,11,3,17], [4,8,9,5,19], [4,19,18,6,13],
    [5,15,7,18,19], [6,18,7,11,10], [3,11,7,15,14]
  ];

  let vertexNames = [
    'I', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9',
    'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19'
  ];

  let edgeNames = [
    'E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9',
    'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18', 'E19',
    'E20', 'E21', 'E22', 'E23', 'E24', 'E25', 'E26', 'E27', 'E28', 'E29'
  ];

  // Face labels (12 pentagonal faces)
  let faceNames = [
    '1.Προκατάληψη(Bias)', '4.Κόσμος(The World)', '5.Τάξη(Order)', '11.Ἁμαρτία(Sin)', '7.Φύσις(Nature)', '6.Λόγος(Reason)',
    '10.Μετάδοσις(Communication)', '3. Κοινωνία(Society)', '2.Εγώ(EGO)', '8.Χρόνος(Time)', '9.Θεός(God)', '12.Γένεσις(Evolution)'
  ];

  // Face details (editable)
  let faceDetails = [
    'Details about Bias...', 'Details about The World...', 'Details about Order...',
    'Details about Sin...', 'Details about Nature...', 'Details about Reason...',
    'Details about Communication...', 'Details about Society...', 'Details about EGO...',
    'Details about Time...', 'Details about God...', 'Details about Evolution...'
  ];

  const vertexLabels = writable([]);
  const edgeLabels = writable([]);
  const faceLabels = writable([]);

  // Selected face for detail view
  let selectedFace = null;
  let isDetailPanelOpen = false;

  // Toggle labels visibility
  let labelsVisible = true;

  function openFaceDetails(index) {
    selectedFace = index;
    isDetailPanelOpen = true;
  }

  function closeDetailPanel() {
    isDetailPanelOpen = false;
    selectedFace = null;
  }

  function saveDetails() {
    // Details are already bound and auto-saved
    closeDetailPanel();
  }

  function toggleLabels() {
    labelsVisible = !labelsVisible;
  }

  // Geometric center F0
  const F0 = new THREE.Vector3(
    vertices.reduce((sum,v)=>sum+v.x,0)/vertices.length,
    vertices.reduce((sum,v)=>sum+v.y,0)/vertices.length,
    vertices.reduce((sum,v)=>sum+v.z,0)/vertices.length
  );

  // Convert 3D to 2D screen coords
  function toScreenPosition(pos, camera, renderer){
    const vector = pos.clone().project(camera);
    const x = (vector.x + 1)/2 * renderer.domElement.clientWidth;
    const y = (-vector.y + 1)/2 * renderer.domElement.clientHeight;
    return {x,y};
  }

  onMount(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Add lighting for better depth perception
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x6699ff, 0.3);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;

    // Create a group to hold all dodecahedron geometry
    const dodecahedronGroup = new THREE.Group();
    scene.add(dodecahedronGroup);

    // Draw faces (semi-transparent with better material)
    const faceMaterial = new THREE.MeshPhongMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      shininess: 30,
      specular: 0x4488ff
    });

    facesVertices.forEach(faceIndices => {
      const shape = new THREE.Shape();
      // Project the pentagon onto a plane for rendering
      const faceVerts = faceIndices.map(idx => vertices[idx]);
      const center = faceVerts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).divideScalar(faceVerts.length);

      // Create geometry from the face vertices
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const indices = [];

      // Add center point
      positions.push(center.x, center.y, center.z);

      // Add face vertices
      faceVerts.forEach(v => {
        positions.push(v.x, v.y, v.z);
      });

      // Create triangles from center to each edge
      for (let i = 0; i < faceIndices.length; i++) {
        const next = (i + 1) % faceIndices.length;
        indices.push(0, i + 1, next + 1);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry, faceMaterial);
      dodecahedronGroup.add(mesh);
    });

    // Draw edges (more subtle)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x5588ff,
      opacity: 0.6,
      transparent: true
    });
    const edgeObjects = [];
    edgesIndices.forEach(([i,j]) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([vertices[i], vertices[j]]);
      const line = new THREE.Line(geometry, edgeMaterial);
      dodecahedronGroup.add(line);
      edgeObjects.push({line, i, j});
    });

    // Draw vertices (smaller and more subtle)
    const vertexMaterial = new THREE.MeshPhongMaterial({
      color: 0x44ff88,
      emissive: 0x226644,
      shininess: 50
    });
    const spheres = vertices.map((v, idx) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.04), vertexMaterial.clone());
      s.position.copy(v);
      s.userData = { index: idx };
      dodecahedronGroup.add(s);
      return s;
    });

    // F0 (center point - made smaller and more elegant)
    const f0Material = new THREE.MeshPhongMaterial({
      color: 0x91b5ff,
      emissive: 0x4a5a7f,
      shininess: 100
    });
    const f0Sphere = new THREE.Mesh(new THREE.SphereGeometry(0.06), f0Material);
    f0Sphere.position.copy(F0);
    dodecahedronGroup.add(f0Sphere);

    // Calculate face normals and apply initial rotation
    // Face 0 (1.Bias) should point up (+Y)
    // Face 5 (6.Reason) should point toward viewer (+Z)

    function calculateFaceNormal(faceIndices) {
      const faceVerts = faceIndices.map(idx => vertices[idx]);
      const center = faceVerts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).divideScalar(faceVerts.length);

      // Calculate normal using first three vertices
      const v1 = faceVerts[1].clone().sub(faceVerts[0]);
      const v2 = faceVerts[2].clone().sub(faceVerts[0]);
      const normal = v1.cross(v2).normalize();

      // Make sure normal points outward (away from origin)
      if (normal.dot(center) < 0) {
        normal.negate();
      }

      return normal;
    }

    const face0Normal = calculateFaceNormal(facesVertices[0]); // 1.Bias
    const face5Normal = calculateFaceNormal(facesVertices[5]); // 6.Reason

    // First rotation: align face 0 normal with +Y axis
    const upAxis = new THREE.Vector3(0, 1, 0);
    const quaternion1 = new THREE.Quaternion().setFromUnitVectors(face0Normal, upAxis);
    dodecahedronGroup.applyQuaternion(quaternion1);

    // After first rotation, recalculate face 5 normal
    const rotatedFace5Normal = face5Normal.clone().applyQuaternion(quaternion1);

    // Project onto XZ plane (we want to rotate around Y axis only)
    const face5ProjectedXZ = new THREE.Vector3(rotatedFace5Normal.x, 0, rotatedFace5Normal.z).normalize();

    // Second rotation: align face 5 with +Z axis (toward viewer)
    const viewerAxis = new THREE.Vector3(0, 0, 1);
    const quaternion2 = new THREE.Quaternion().setFromUnitVectors(face5ProjectedXZ, viewerAxis);
    dodecahedronGroup.applyQuaternion(quaternion2);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    function animate() {
      requestAnimationFrame(animate);

      controls.update();

      // Hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);
      spheres.forEach(s => {
        s.material.color.set(0x44ff88);
        s.material.emissive.set(0x226644);
      });
      if(intersects.length > 0){
        intersects[0].object.material.color.set(0xffff44);
        intersects[0].object.material.emissive.set(0x888822);
      }

      // Update labels (transform by dodecahedronGroup)
      vertexLabels.set(vertices.map(v => {
        const worldPos = v.clone().applyMatrix4(dodecahedronGroup.matrixWorld);
        return toScreenPosition(worldPos, camera, renderer);
      }));
      edgeLabels.set(edgeObjects.map(e => {
        const midpoint = vertices[e.i].clone().add(vertices[e.j]).multiplyScalar(0.5);
        const worldPos = midpoint.applyMatrix4(dodecahedronGroup.matrixWorld);
        return toScreenPosition(worldPos, camera, renderer);
      }));
      faceLabels.set(facesVertices.map(fv => {
        const center = fv.reduce((acc, idx)=> acc.add(vertices[idx]), new THREE.Vector3(0,0,0)).divideScalar(fv.length);
        const worldPos = center.applyMatrix4(dodecahedronGroup.matrixWorld);
        return toScreenPosition(worldPos, camera, renderer);
      }));

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  });
</script>

<div class="dodeca-container">
  <canvas bind:this={canvas}></canvas>

  <!-- Toggle Labels Button -->
  <button class="toggle-labels-btn" on:click={toggleLabels}>
    {labelsVisible ? 'Hide Labels' : 'Show Labels'}
  </button>

  <!-- Vertex labels -->
  {#if labelsVisible}
    {#each vertexNames as name, i}
      <div class="label vertex-label" style="left: {($vertexLabels[i]?.x || 0)}px; top: {($vertexLabels[i]?.y || 0)}px;">
        {name}
      </div>
    {/each}

    <!-- Edge labels -->
    {#each edgeNames as name, i}
      <div class="label edge-label" style="left: {($edgeLabels[i]?.x || 0)}px; top: {($edgeLabels[i]?.y || 0)}px;">
        {name}
      </div>
    {/each}

    <!-- Face labels -->
    {#each faceNames as name, i}
      <div
        class="label face-label"
        style="left: {($faceLabels[i]?.x || 0)}px; top: {($faceLabels[i]?.y || 0)}px;"
        on:click={() => openFaceDetails(i)}
        role="button"
        tabindex="0"
      >
        {name}
      </div>
    {/each}
  {/if}

  <!-- Detail Panel - Chat style on right side -->
  {#if isDetailPanelOpen && selectedFace !== null}
    <div class="detail-panel-overlay" on:click={closeDetailPanel}></div>
    <div class="detail-panel">
      <div class="detail-header">
        <h2>{faceNames[selectedFace]}</h2>
        <button class="close-btn" on:click={closeDetailPanel}>&times;</button>
      </div>
      <div class="detail-content">
        <label for="face-details">Details:</label>
        <textarea
          id="face-details"
          bind:value={faceDetails[selectedFace]}
          rows="10"
          placeholder="Enter details about this face..."
        ></textarea>
      </div>
      <div class="detail-footer">
        <button class="save-btn" on:click={saveDetails}>Save & Close</button>
      </div>
    </div>
  {/if}
</div>

<style>
.dodeca-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.label {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  transition: all 0.2s ease;
}

/* Face labels - large and prominent */
.face-label {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  background: rgba(10, 10, 26, 0.85);
  padding: 5px 10px;
  border-radius: 6px;
  border: 2px solid rgba(51, 102, 255, 0.6);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  cursor: pointer;
}

/* Vertex labels - smaller and subtle */
.vertex-label {
  color: #88ffbb;
  font-size: 10px;
  font-weight: 500;
  background: rgba(34, 102, 68, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(68, 255, 136, 0.4);
  opacity: 0.7;
  pointer-events: auto;
  cursor: default;
}

.vertex-label:hover {
  opacity: 1;
  background: rgba(34, 102, 68, 0.9);
  border-color: rgba(68, 255, 136, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

/* Edge labels - very subtle */
.edge-label {
  color: #99bbff;
  font-size: 9px;
  font-weight: 400;
  background: rgba(85, 136, 255, 0.3);
  padding: 2px 5px;
  border-radius: 3px;
  opacity: 0.5;
  pointer-events: auto;
  cursor: default;
}

.edge-label:hover {
  opacity: 1;
  background: rgba(85, 136, 255, 0.7);
  border: 1px solid rgba(85, 136, 255, 0.9);
  transform: translate(-50%, -50%) scale(1.15);
}

/* Hover effects */
.face-label:hover {
  background: rgba(51, 102, 255, 0.95);
  border-color: rgba(51, 102, 255, 1);
  transform: translate(-50%, -50%) scale(1.05);
}

/* Toggle Labels Button */
.toggle-labels-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  background: rgba(15, 15, 35, 0.9);
  border: 2px solid rgba(51, 102, 255, 0.6);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.toggle-labels-btn:hover {
  background: rgba(51, 102, 255, 0.8);
  border-color: rgba(51, 102, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(51, 102, 255, 0.4);
}

.toggle-labels-btn:active {
  transform: translateY(0);
}

/* Detail Panel - Chat style */
.detail-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 400px;
  max-width: 90vw;
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.98), rgba(20, 20, 45, 0.98));
  border-left: 2px solid rgba(51, 102, 255, 0.8);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(51, 102, 255, 0.3);
}

.detail-header h2 {
  color: #ffffff;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.detail-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-content label {
  color: #99bbff;
  font-weight: 500;
  font-size: 14px;
}

.detail-content textarea {
  width: 100%;
  padding: 12px;
  background: rgba(10, 10, 26, 0.8);
  border: 2px solid rgba(51, 102, 255, 0.4);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.detail-content textarea:focus {
  outline: none;
  border-color: rgba(51, 102, 255, 0.8);
  box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.1);
}

.detail-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(51, 102, 255, 0.3);
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: rgba(51, 102, 255, 0.8);
  border: 2px solid rgba(51, 102, 255, 1);
  color: #ffffff;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: rgba(51, 102, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(51, 102, 255, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

<script>
  import * as THREE from 'three';
  import { onMount } from 'svelte';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { writable, get } from 'svelte/store';

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

  // Center label details (editable)
  let centerDetails = 'Details about subconscious...';

  // External label details (editable)
  let externalDetails = 'Details about all...';

  const vertexLabels = writable([]);
  const edgeLabels = writable([]);
  const faceLabels = writable([]);
  const centerLabel = writable({ x: 0, y: 0 });
  const externalLabel = writable({ x: 0, y: 0 });

  // Selected face for detail view
  let selectedFace = null;
  let isDetailPanelOpen = false;

  // Toggle labels visibility
  let labelsVisible = true;

  // Arrow drawing state
  let arrowMode = false;
  let currentPath = [];  // Labels being added to current arrow
  const arrows = writable([]);  // Completed arrows with multiple labels each
  const arrowPaths = writable([]);

  // Context menu state
  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuArrowId = null;

  function openFaceDetails(index) {
    selectedFace = index;
    isDetailPanelOpen = true;
  }

  function openCenterDetails() {
    selectedFace = 'center';
    isDetailPanelOpen = true;
  }

  function openExternalDetails() {
    selectedFace = 'external';
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

  // LocalStorage persistence
  const ARROWS_STORAGE_KEY = 'dodecahedron-arrows';

  function saveArrowsToLocalStorage() {
    try {
      const arrowData = get(arrows);
      localStorage.setItem(ARROWS_STORAGE_KEY, JSON.stringify(arrowData));
    } catch (error) {
      console.error('Failed to save arrows to localStorage:', error);
    }
  }

  function loadArrowsFromLocalStorage() {
    try {
      const stored = localStorage.getItem(ARROWS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Migrate old format (source/target) to new format (path array)
        const migrated = parsed.map(arrow => {
          if (arrow.path) {
            // Already in new format
            return arrow;
          } else if (arrow.source && arrow.target) {
            // Old format - convert to new format
            return {
              id: arrow.id,
              path: [arrow.source, arrow.target],
              createdAt: arrow.createdAt
            };
          } else {
            // Invalid format - skip
            return null;
          }
        }).filter(a => a !== null);

        arrows.set(migrated);
      }
    } catch (error) {
      console.error('Failed to load arrows from localStorage:', error);
      arrows.set([]);
    }
  }

  // Arrow mode functions
  function toggleArrowMode() {
    arrowMode = !arrowMode;
    if (!arrowMode) {
      currentPath = [];
    }
  }

  function handleLabelClick(labelType, labelIndex) {
    if (!arrowMode) return false;

    const labelRef = {
      type: labelType,
      index: labelIndex
    };

    // Add label to current path
    currentPath = [...currentPath, labelRef];

    return true;
  }

  function finishArrow() {
    if (currentPath.length < 2) {
      alert('An arrow needs at least 2 labels');
      return;
    }

    const newArrow = {
      id: `arrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      path: currentPath,
      createdAt: Date.now()
    };

    arrows.update(arr => [...arr, newArrow]);
    saveArrowsToLocalStorage();
    currentPath = [];
  }

  function cancelCurrentArrow() {
    currentPath = [];
  }

  // Context menu functions
  function handleArrowRightClick(event, arrowId) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextMenuArrowId = arrowId;
    contextMenuVisible = true;
  }

  function deleteArrow() {
    if (contextMenuArrowId) {
      arrows.update(arr => arr.filter(a => a.id !== contextMenuArrowId));
      saveArrowsToLocalStorage();
    }
    closeContextMenu();
  }

  function closeContextMenu() {
    contextMenuVisible = false;
    contextMenuArrowId = null;
  }

  // Arrow position calculator
  function getLabelPosition(labelRef) {
    const { type, index } = labelRef;

    switch (type) {
      case 'vertex':
        return get(vertexLabels)[index] || { x: 0, y: 0 };
      case 'edge':
        return get(edgeLabels)[index] || { x: 0, y: 0 };
      case 'face':
        return get(faceLabels)[index] || { x: 0, y: 0 };
      case 'center':
        return get(centerLabel) || { x: 0, y: 0 };
      case 'external':
        return get(externalLabel) || { x: 0, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }

  function updateArrowPaths() {
    const currentArrows = get(arrows);

    const paths = currentArrows
      .filter(arrow => arrow && arrow.path && Array.isArray(arrow.path))
      .map(arrow => {
        // Get positions for all labels in the path
        const positions = arrow.path.map(labelRef => getLabelPosition(labelRef));

        return {
          id: arrow.id,
          positions  // Array of {x, y} for each label in the path
        };
      });

    // Also include current path being built (if any)
    if (currentPath.length > 0) {
      const currentPositions = currentPath.map(labelRef => getLabelPosition(labelRef));
      paths.push({
        id: 'current',
        positions: currentPositions,
        isTemporary: true
      });
    }

    arrowPaths.set(paths);
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
    // Load saved arrows from localStorage
    loadArrowsFromLocalStorage();

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

      // Update center label (F0)
      const centerWorldPos = F0.clone().applyMatrix4(dodecahedronGroup.matrixWorld);
      centerLabel.set(toScreenPosition(centerWorldPos, camera, renderer));

      // Update external label (positioned directly above F0)
      const externalPos = new THREE.Vector3(0, 1, 2);
      const externalWorldPos = externalPos.applyMatrix4(dodecahedronGroup.matrixWorld);
      externalLabel.set(toScreenPosition(externalWorldPos, camera, renderer));

      // Update arrow paths based on current label positions
      updateArrowPaths();

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

  <!-- SVG Arrow Overlay -->
  <svg class="arrow-overlay">
    <defs>
      <!-- Arrowhead marker -->
      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#ff6699" />
      </marker>
    </defs>

    <!-- Render arrows -->
    {#each $arrowPaths as arrow (arrow.id)}
      {#if arrow.positions && arrow.positions.length >= 2}
        {@const pathData = arrow.positions.map((pos, i) =>
          i === 0 ? `M ${pos.x} ${pos.y}` : `L ${pos.x} ${pos.y}`
        ).join(' ')}
        <path
          d={pathData}
          stroke="#ff6699"
          stroke-width={arrow.isTemporary ? 3 : 2}
          stroke-dasharray={arrow.isTemporary ? '5,5' : 'none'}
          fill="none"
          marker-end="url(#arrowhead)"
          class="arrow-path"
          class:temporary={arrow.isTemporary}
          data-arrow-id={arrow.id}
          on:contextmenu={(e) => !arrow.isTemporary && handleArrowRightClick(e, arrow.id)}
        />
        <!-- Draw circles at each waypoint -->
        {#each arrow.positions as pos, i}
          <circle
            cx={pos.x}
            cy={pos.y}
            r="3"
            fill="#ff6699"
            class="arrow-waypoint"
          />
        {/each}
      {/if}
    {/each}
  </svg>

  <!-- Toggle Labels Button -->
  <button class="toggle-labels-btn" on:click={toggleLabels}>
    {labelsVisible ? 'Hide Labels' : 'Show Labels'}
  </button>

  <!-- Arrow Mode Button -->
  <button class="arrow-mode-btn" class:active={arrowMode} on:click={toggleArrowMode}>
    {arrowMode ? 'Exit Arrow Mode' : 'Arrow Mode'}
  </button>

  <!-- Arrow Path Building Controls (show when building a path) -->
  {#if arrowMode && currentPath.length > 0}
    <div class="arrow-controls">
      <div class="arrow-path-info">Path: {currentPath.length} label{currentPath.length !== 1 ? 's' : ''}</div>
      <button class="finish-arrow-btn" on:click={finishArrow}>Finish Arrow</button>
      <button class="cancel-arrow-btn" on:click={cancelCurrentArrow}>Cancel</button>
    </div>
  {/if}

  <!-- Vertex labels -->
  {#if labelsVisible}
    {#each vertexNames as name, i}
      <div
        class="label vertex-label"
        class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'vertex' && label.index === i)}
        style="left: {($vertexLabels[i]?.x || 0)}px; top: {($vertexLabels[i]?.y || 0)}px;"
        on:click={() => handleLabelClick('vertex', i)}
        role="button"
        tabindex="0"
      >
        {name}
      </div>
    {/each}

    <!-- Edge labels -->
    {#each edgeNames as name, i}
      <div
        class="label edge-label"
        class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'edge' && label.index === i)}
        style="left: {($edgeLabels[i]?.x || 0)}px; top: {($edgeLabels[i]?.y || 0)}px;"
        on:click={() => handleLabelClick('edge', i)}
        role="button"
        tabindex="0"
      >
        {name}
      </div>
    {/each}

    <!-- Face labels -->
    {#each faceNames as name, i}
      <div
        class="label face-label"
        class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'face' && label.index === i)}
        style="left: {($faceLabels[i]?.x || 0)}px; top: {($faceLabels[i]?.y || 0)}px;"
        on:click={() => {
          if (!handleLabelClick('face', i)) {
            openFaceDetails(i);
          }
        }}
        role="button"
        tabindex="0"
      >
        {name}
      </div>
    {/each}

    <!-- Center label (F0) -->
    <div
      class="label face-label center-label"
      class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'center')}
      style="left: {($centerLabel?.x || 0)}px; top: {($centerLabel?.y || 0)}px;"
      on:click={() => {
        if (!handleLabelClick('center', null)) {
          openCenterDetails();
        }
      }}
      role="button"
      tabindex="0"
    >
      0.υποσυνείδητον(Subconscious)
    </div>

    <!-- External label -->
    <div
      class="label external-label"
      class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'external')}
      style="left: {($externalLabel?.x || 0)}px; top: {($externalLabel?.y || 0)}px;"
      on:click={() => {
        if (!handleLabelClick('external', null)) {
          openExternalDetails();
        }
      }}
      role="button"
      tabindex="0"
    >
      ∞.τὸ πᾶν(All)
    </div>
  {/if}

  <!-- Detail Panel - Chat style on right side -->
  {#if isDetailPanelOpen && selectedFace !== null}
    <div class="detail-panel-overlay" on:click={closeDetailPanel}></div>
    <div class="detail-panel">
      <div class="detail-header">
        <h2>{selectedFace === 'center' ? '0. subconscious' : selectedFace === 'external' ? '∞. All' : faceNames[selectedFace]}</h2>
        <button class="close-btn" on:click={closeDetailPanel}>&times;</button>
      </div>
      <div class="detail-content">
        <label for="face-details">Details:</label>
        {#if selectedFace === 'center'}
          <textarea
            id="face-details"
            bind:value={centerDetails}
            rows="10"
            placeholder="Enter details..."
          ></textarea>
        {:else if selectedFace === 'external'}
          <textarea
            id="face-details"
            bind:value={externalDetails}
            rows="10"
            placeholder="Enter details..."
          ></textarea>
        {:else}
          <textarea
            id="face-details"
            bind:value={faceDetails[selectedFace]}
            rows="10"
            placeholder="Enter details..."
          ></textarea>
        {/if}
      </div>
      <div class="detail-footer">
        <button class="save-btn" on:click={saveDetails}>Save & Close</button>
      </div>
    </div>
  {/if}

  <!-- Context Menu -->
  {#if contextMenuVisible}
    <div
      class="context-menu"
      style="left: {contextMenuX}px; top: {contextMenuY}px;"
    >
      <div class="context-menu-item" on:click={deleteArrow}>Delete Arrow</div>
    </div>
  {/if}

  <!-- Context menu backdrop -->
  {#if contextMenuVisible}
    <div class="context-menu-backdrop" on:click={closeContextMenu}></div>
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
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Face labels - large and prominent */
.face-label {
  color: #ffffff;
  font-size: 10px;
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
  font-size: 8px;
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
  font-size: 7px;
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

/* Center label - like face label and clickable */
.center-label {
  pointer-events: auto;
  cursor: pointer;
}

/* External label - larger and more prominent */
.external-label {
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  background: rgba(10, 10, 26, 0.9);
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid rgba(145, 181, 255, 0.8);
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 20px rgba(145, 181, 255, 0.4);
  pointer-events: auto;
  cursor: pointer;
  text-shadow: 0 0 12px rgba(145, 181, 255, 0.6);
  transition: all 0.2s ease;
}

.external-label:hover {
  background: rgba(145, 181, 255, 0.95);
  border-color: rgba(145, 181, 255, 1);
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow: 0 8px 24px rgba(145, 181, 255, 0.6);
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

/* Arrow-related styles */
.arrow-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.arrow-path {
  cursor: context-menu;
  pointer-events: stroke;
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
  filter: drop-shadow(0 2px 4px rgba(255, 102, 153, 0.4));
}

.arrow-path:hover {
  stroke-width: 3;
  stroke: #ff88bb;
  filter: drop-shadow(0 3px 8px rgba(255, 102, 153, 0.8));
}

.arrow-mode-btn {
  position: fixed;
  top: 20px;
  left: 180px;
  z-index: 100;
  background: rgba(15, 15, 35, 0.9);
  border: 2px solid rgba(255, 102, 153, 0.6);
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

.arrow-mode-btn:hover {
  background: rgba(255, 102, 153, 0.6);
  border-color: rgba(255, 102, 153, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 102, 153, 0.4);
}

.arrow-mode-btn.active {
  background: rgba(255, 102, 153, 0.9);
  border-color: rgba(255, 102, 153, 1);
  box-shadow: 0 0 20px rgba(255, 102, 153, 0.6);
}

.arrow-source-selected {
  border: 3px solid #ff6699 !important;
  box-shadow: 0 0 20px rgba(255, 102, 153, 0.8);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
}

.context-menu {
  position: fixed;
  background: rgba(15, 15, 35, 0.95);
  border: 2px solid rgba(255, 102, 153, 0.8);
  border-radius: 6px;
  padding: 4px 0;
  z-index: 2000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
}

.context-menu-item {
  padding: 8px 16px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.context-menu-item:hover {
  background: rgba(255, 102, 153, 0.3);
}

.context-menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1999;
}

.arrow-waypoint {
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.arrow-controls {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 100;
  background: rgba(15, 15, 35, 0.95);
  border: 2px solid rgba(255, 102, 153, 0.8);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

.arrow-path-info {
  color: #ff6699;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.finish-arrow-btn, .cancel-arrow-btn {
  background: rgba(255, 102, 153, 0.8);
  border: 2px solid rgba(255, 102, 153, 1);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.finish-arrow-btn:hover {
  background: rgba(255, 102, 153, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 102, 153, 0.4);
}

.cancel-arrow-btn {
  background: rgba(255, 82, 82, 0.8);
  border-color: rgba(255, 82, 82, 1);
}

.cancel-arrow-btn:hover {
  background: rgba(255, 82, 82, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 82, 82, 0.4);
}
</style>

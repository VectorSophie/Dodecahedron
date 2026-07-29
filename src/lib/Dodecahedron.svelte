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
    'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
    'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20'
  ];

  let edgeNames = [
    'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 
    'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18', 'E19', 'E20', 
    'E21', 'E22', 'E23', 'E24', 'E25', 'E26', 'E27', 'E28', 'E29', 'E30'
  ];

  // Face labels (12 pentagonal faces)
  let faceNames = [
    '1.Προκατάληψη(Bias)', '4.Κόσμος(The World)', '5.Τάξη(Order)', '11.Ἁμαρτία(Sin)', '7.Φύσις(Nature)', '6.Λόγος(Reason)',
    '10.Μετάδοσις(Communication)', '3. Κοινωνία(Society)', '2.Εγώ(EGO)', '8.Χρόνος(Time)', '9.Θεός(God)', '12.Γένεσις(Evolution)'
  ];

  // Plain-English variants (index-aligned with faceNames) for the language toggle
  let faceNamesEnglish = [
    '1. Bias', '4. World', '5. Order', '11. Sin', '7. Nature', '6. Reason',
    '10. Communication', '3. Society', '2. Ego', '8. Time', '9. God', '12. Evolution'
  ];

  // Toggle between the Greek+English plane names and plain English titles
  let englishLabels = false;

  // Face details (editable) — from Hyperrealistic Relativism v1.1
  let faceDetails = [
    "Bias is the operation by which a finite observer selects what becomes available for attention — the glass through which reality is seen, not dirt upon it. It is inevitable, compresses reality into usable categories, and hardens into identity when defended long enough. \"The most dangerous observer is not the biased observer. It is the observer who believes they are neutral.\"",
    "World is what resists interpretation through consequence — the field where reality pushes back regardless of belief. Bias, Ego, and Society all compress reality into something usable; the World is what exceeds every compression. \"The World does not negotiate with understanding before exerting consequence.\"",
    "Order is uncertainty made survivable through structure — the attempt to make tomorrow resemble today. It gives freedom its shape and, in the same motion, its limit. It requires exclusion, and left unrevised it fossilizes into violence that outlives the fear that first justified it.",
    "Sin is a rupture in relation and responsibility that persists through concealment, repetition, or failed acknowledgment. \"Hell opens when the self cannot confess itself back into relation\" — and, crucially, the gates open only from the inside.",
    "Nature is the recurrence of material and ecological conditions without moral intention — an almost-karmic world where consequence returns unevenly, filtered through power, bodies, and circumstance. Return is real; justice is not guaranteed by it.",
    "Reason creates distance from immediate pressure so that judgment becomes possible — necessary, and never free of the conditions that produced it. It can offer mercy by delaying a verdict, or become an alibi dressing inherited desire in the language of objectivity.",
    "Communication is the translation of private experience into publicly negotiable signs. Meaning is never transmitted whole, only triggered. \"Communication does not move the beetle from one box to another. It teaches the boxes how to behave as though they share one.\"",
    "Society is the synchronization of compressed realities among multiple selves — a distributed Ego holding many unstable people together as \"we.\" It is felt as a mesh of relationships and functions, underneath, as an indifferent filter, outsourcing regulation no one can sustain alone.",
    "Ego is the operation that binds selected experience into a continuing self — not the truth of who you are, but the story that makes the self bearable. \"'I am who I am' is not a fact. It is a maintenance ritual.\"",
    "Time is the operation by which events become ordered, remembered, anticipated, and made irreversible. Physics finds no universal \"now\"; the felt experience of passage may be the deepest illusion consciousness produces — though the physics itself licenses less certainty than the feeling implies.",
    "God is the name given to totality, transcendence, or the failure of the boundary between part and whole — not an entity to locate, but what remains when observer and observed stop insisting on separation. \"God is not something that exists. It is what remains when you can no longer maintain the illusion of separation.\"",
    "Evolution is the transmission of transformed structures into future conditions. \"It does not ask what deserved to survive. It only asks what did.\" Survival proves compatibility with pressure, never goodness — and this book, versioned rather than finished, submits itself to the same test."
  ];

  // Center label details (editable) — the Void of Id
  let centerDetails = "The Void of Id is the unnamed force beneath the constructed self: hunger, fear, impulse, desire — the pressure that arrives before justification. Every plane above translates it into acceptable language; none of them escape it. \"The Id is the dark page beneath the ink.\"";

  // External label details (editable) — the finitive SuperEGO
  let externalDetails = "The SuperEGO is the periphery surrounding all twelve planes — inherited authority, internalized judgment, the gaze of others pressed permanently into your shape. It is not one voice but the accumulated weight of everyone else's structure pressing on yours. \"The SuperEGO must be neither worshipped nor erased. It must be made finite.\"";

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

  // Context menu state
  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuArrowId = null;

  // Sequence mode: select two adjacent planes (incl. Id/SuperEGO) and export a PNG
  let sequenceMode = false;
  let seqSelected = []; // up to 2 nodes, in click order: [{type:'face', index}] | [{type:'center'}] | [{type:'external'}]
  let captureFn = null;
  let orientFn = null;
  let rebuildSnakesFn = null;

  // The book's pressure-passing cycle, plus SuperEGO stitched in at the seam
  // (Evolution -> SuperEGO -> Bias), per the manuscript's own sequence table.
  const ringOrder = [
    { type: 'face', index: 0 },   // 1. Bias
    { type: 'face', index: 8 },   // 2. Ego
    { type: 'face', index: 7 },   // 3. Society
    { type: 'face', index: 1 },   // 4. World
    { type: 'face', index: 2 },   // 5. Order
    { type: 'face', index: 5 },   // 6. Reason
    { type: 'center' },           //    Id (Void)
    { type: 'face', index: 4 },   // 7. Nature
    { type: 'face', index: 9 },   // 8. Time
    { type: 'face', index: 10 },  // 9. God
    { type: 'face', index: 6 },   // 10. Communication
    { type: 'face', index: 3 },   // 11. Sin
    { type: 'face', index: 11 },  // 12. Evolution
    { type: 'external' }          //    SuperEGO
  ];
  const ringSlugs = ['bias', 'ego', 'society', 'world', 'order', 'reason', 'id', 'nature', 'time', 'god', 'communication', 'sin', 'evolution', 'superego'];

  function ringIndexOf(node) {
    return ringOrder.findIndex(n => n.type === node.type && n.index === node.index);
  }

  function isAdjacentNode(a, b) {
    const ia = ringIndexOf(a);
    const ib = ringIndexOf(b);
    if (ia === -1 || ib === -1) return false;
    const n = ringOrder.length;
    const diff = (ib - ia + n) % n;
    return diff === 1 || diff === n - 1;
  }

  function sameNode(a, b) {
    return a.type === b.type && a.index === b.index;
  }

  function getNodeLabel(node) {
    if (node.type === 'face') return englishLabels ? faceNamesEnglish[node.index] : faceNames[node.index];
    if (node.type === 'center') return englishLabels ? '0. Subconscious' : '0.υποσυνείδητον(Subconscious)';
    return englishLabels ? '∞. All' : '∞.τὸ πᾶν(All)';
  }

  function slugFor(node) {
    return ringSlugs[ringIndexOf(node)];
  }

  function toggleSequenceMode() {
    sequenceMode = !sequenceMode;
    seqSelected = [];
    if (sequenceMode) {
      arrowMode = false;
      currentPath = [];
    }
  }

  function handleSequenceLabelClick(type, index) {
    const node = { type, index };
    if (seqSelected.length === 0) {
      seqSelected = [node];
    } else if (seqSelected.length === 1) {
      if (sameNode(seqSelected[0], node)) {
        seqSelected = [];
      } else if (isAdjacentNode(seqSelected[0], node)) {
        seqSelected = [seqSelected[0], node];
        if (orientFn) orientFn(seqSelected[0], seqSelected[1]);
      } else {
        seqSelected = [node];
      }
    } else {
      seqSelected = [node];
    }
  }

  // Pure canvas-2D drawing helpers for the exported PNG (no DOM/Three.js deps)
  function drawCaptureArrow(ctx, a, b) {
    const headLen = 14;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCaptureLabel(ctx, pos, text) {
    ctx.save();
    ctx.font = '600 15px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const paddingX = 12, paddingY = 8;
    const w = ctx.measureText(text).width + paddingX * 2;
    const h = 15 + paddingY * 2;
    const x = pos.x - w / 2;
    const y = pos.y - h / 2;
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10,10,26,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,204,68,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pos.x, pos.y + 1);
    ctx.restore();
  }

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
    } else {
      sequenceMode = false;
      seqSelected = [];
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

  // Rebuild the in-progress ghost snake whenever the path being built changes.
  // Finished arrows are handled separately, via a direct subscription to the
  // `arrows` store inside onMount.
  $: {
    currentPath;
    if (rebuildSnakesFn) rebuildSnakesFn();
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

  // Local-space (pre-matrixWorld) position for any label reference, used to
  // build the 3D snake geometry so it inherits the dodecahedron's own
  // rotation for free instead of needing a per-frame 2D projection.
  function getLocalPosForRef(ref) {
    switch (ref.type) {
      case 'vertex':
        return vertices[ref.index].clone();
      case 'edge': {
        const [i, j] = edgesIndices[ref.index];
        return vertices[i].clone().add(vertices[j]).multiplyScalar(0.5);
      }
      case 'face': {
        const fv = facesVertices[ref.index];
        return fv.reduce((acc, idx) => acc.add(vertices[idx].clone()), new THREE.Vector3()).divideScalar(fv.length);
      }
      case 'center':
        return F0.clone();
      case 'external':
        return new THREE.Vector3(0, 1, 2);
      default:
        return new THREE.Vector3();
    }
  }

  // A straight cylindrical strut between two points, oriented to match the
  // segment — used for the frame's edges (cover art has chunky beveled bars,
  // not thin wire lines).
  function buildStrutMesh(a, b, radius, material) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const geom = new THREE.CylinderGeometry(radius, radius, length, 6, 1);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return mesh;
  }

  // Cover-art palette: alternating navy/gold snake bodies, silver wireframe.
  const SNAKE_COLORS = [0x2c4a72, 0xd8a23a];
  const GHOST_SNAKE_COLOR = 0xff6699;
  const STRUT_COLOR = 0xd7d9dc;

  // A low-poly tube "snake" body following the path's waypoints, with a
  // simple wedge head at the leading end. Real 3D geometry (not a 2D SVG
  // overlay), so it moves correctly with any spin/orbit of the shape.
  function buildSnakeMesh(points, color, { opacity = 1, arrowId = null } = {}) {
    if (points.length < 2) return null;

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
    const tubularSegments = Math.max(12, points.length * 14);
    const radius = 0.045;
    const tubeGeom = new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false);
    const material = new THREE.MeshPhongMaterial({
      color,
      flatShading: true,
      shininess: 15,
      specular: 0x333333,
      transparent: opacity < 1,
      opacity
    });

    const group = new THREE.Group();

    const bodyMesh = new THREE.Mesh(tubeGeom, material);
    bodyMesh.userData = { arrowId };
    group.add(bodyMesh);

    const endPoint = points[points.length - 1];
    const tangent = curve.getTangentAt(1).normalize();
    const headLength = radius * 6;
    const headGeom = new THREE.ConeGeometry(radius * 2.2, headLength, 6);
    headGeom.rotateX(-Math.PI / 2); // apex along local -Z, to match lookAt's convention
    const headMesh = new THREE.Mesh(headGeom, material);
    headMesh.userData = { arrowId };
    headMesh.position.copy(endPoint).addScaledVector(tangent, headLength * 0.3);
    headMesh.lookAt(endPoint.clone().addScaledVector(tangent, 10));
    group.add(headMesh);

    return group;
  }

  // A single small marker for a one-point path, before there's enough to
  // draw a snake body yet.
  function buildGhostMarker(point) {
    const geom = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshPhongMaterial({ color: GHOST_SNAKE_COLOR, flatShading: true, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.copy(point);
    return mesh;
  }

  onMount(() => {
    // Load saved arrows from localStorage
    loadArrowsFromLocalStorage();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
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

    // Draw faces (nearly invisible by default — cover art shows an open
    // wireframe, not filled panels; they only become visible under
    // sequence-mode highlighting)
    const faceMaterial = new THREE.MeshPhongMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      shininess: 30,
      specular: 0x4488ff,
      flatShading: true
    });

    const faceMeshes = [];
    facesVertices.forEach((faceIndices, faceIdx) => {
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

      // Cloned material per face so sequence-mode can highlight one face at a time
      const mesh = new THREE.Mesh(geometry, faceMaterial.clone());
      mesh.userData = { index: faceIdx };
      dodecahedronGroup.add(mesh);
      faceMeshes.push(mesh);
    });

    // Draw edges as chunky beveled struts (cover art's wireframe, not thin lines)
    const strutMaterial = new THREE.MeshPhongMaterial({
      color: STRUT_COLOR,
      flatShading: true,
      shininess: 60,
      specular: 0xffffff
    });
    const edgeObjects = [];
    edgesIndices.forEach(([i,j]) => {
      const strut = buildStrutMesh(vertices[i], vertices[j], 0.028, strutMaterial);
      dodecahedronGroup.add(strut);
      edgeObjects.push({line: strut, i, j});
    });

    // Draw vertices as small faceted joints matching the strut color
    const vertexMaterial = new THREE.MeshPhongMaterial({
      color: STRUT_COLOR,
      emissive: 0x2a2a2e,
      flatShading: true,
      shininess: 60
    });
    const spheres = vertices.map((v, idx) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), vertexMaterial.clone());
      s.position.copy(v);
      s.userData = { index: idx };
      dodecahedronGroup.add(s);
      return s;
    });

    // F0 (center point - made smaller and more elegant)
    const f0Material = new THREE.MeshPhongMaterial({
      color: 0x91b5ff,
      emissive: 0x4a5a7f,
      flatShading: true,
      shininess: 100
    });
    const f0Sphere = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), f0Material);
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
        s.material.color.set(STRUT_COLOR);
        s.material.emissive.set(0x2a2a2e);
      });
      if(intersects.length > 0){
        intersects[0].object.material.color.set(0xffff44);
        intersects[0].object.material.emissive.set(0x888822);
      }

      // Sequence-mode highlighting (faces + Id sphere)
      const anySeq = sequenceMode && seqSelected.length > 0;
      faceMeshes.forEach((mesh, idx) => {
        const isSelected = seqSelected.some(n => n.type === 'face' && n.index === idx);
        mesh.material.color.set(isSelected ? 0xffcc44 : 0x3366ff);
        mesh.material.opacity = isSelected ? 0.85 : (anySeq ? 0.12 : 0.06);
      });
      const idSelected = seqSelected.some(n => n.type === 'center');
      f0Sphere.material.color.set(idSelected ? 0xffcc44 : 0x91b5ff);
      f0Sphere.material.emissive.set(idSelected ? 0x886611 : 0x4a5a7f);

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

      renderer.render(scene, camera);
    }

    // Snake-mode annotations (Arrow Mode), styled after the book cover: a
    // low-poly tube "snake" body with a wedge head, alternating navy/gold
    // per finished arrow. Rendered as real 3D geometry attached to
    // dodecahedronGroup, so it moves correctly with any spin/orbit instead
    // of living on a flat 2D overlay.
    const snakesGroup = new THREE.Group();
    dodecahedronGroup.add(snakesGroup);
    let allSnakeMeshes = [];

    function clearSnakes() {
      snakesGroup.children.slice().forEach(child => {
        snakesGroup.remove(child);
        child.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      });
      allSnakeMeshes = [];
    }

    function rebuildSnakes() {
      clearSnakes();

      const finishedArrows = get(arrows).filter(a => a && Array.isArray(a.path) && a.path.length >= 2);
      finishedArrows.forEach((arrow, idx) => {
        const points = arrow.path.map(getLocalPosForRef);
        const color = SNAKE_COLORS[idx % SNAKE_COLORS.length];
        const snake = buildSnakeMesh(points, color, { arrowId: arrow.id });
        if (snake) {
          snakesGroup.add(snake);
          allSnakeMeshes.push(...snake.children);
        }
      });

      if (currentPath.length >= 2) {
        const points = currentPath.map(getLocalPosForRef);
        const ghost = buildSnakeMesh(points, GHOST_SNAKE_COLOR, { opacity: 0.55 });
        if (ghost) snakesGroup.add(ghost);
      } else if (currentPath.length === 1) {
        snakesGroup.add(buildGhostMarker(getLocalPosForRef(currentPath[0])));
      }
    }

    rebuildSnakesFn = rebuildSnakes;
    arrows.subscribe(() => rebuildSnakes()); // fires immediately with the current value too

    // Right-click a snake to delete its arrow (ghost/in-progress snakes have
    // no arrowId and are ignored here).
    canvas.addEventListener('contextmenu', (event) => {
      const ndc = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(allSnakeMeshes, false);
      if (hits.length > 0 && hits[0].object.userData.arrowId) {
        event.preventDefault();
        handleArrowRightClick(event, hits[0].object.userData.arrowId);
      }
    });

    animate();

    // Screenshot a camera view that faces the two currently selected sequence planes,
    // with a gold arrow and labels burned into the exported PNG.
    function computeNodeWorldPos(node) {
      if (node.type === 'face') {
        const fv = facesVertices[node.index];
        const center = fv.reduce((acc, idx) => acc.add(vertices[idx].clone()), new THREE.Vector3()).divideScalar(fv.length);
        return center.applyMatrix4(dodecahedronGroup.matrixWorld);
      }
      if (node.type === 'center') {
        return F0.clone().applyMatrix4(dodecahedronGroup.matrixWorld);
      }
      return new THREE.Vector3(0, 1, 2).applyMatrix4(dodecahedronGroup.matrixWorld);
    }

    function computeNodeScreenPos(node) {
      return toScreenPosition(computeNodeWorldPos(node), camera, renderer);
    }

    // Leave the camera exactly where it starts (looking straight down -Z,
    // no tilt, no roll) and instead spin the shape itself around the world Y
    // axis, like a turntable, until the two selected planes face front. Bias
    // (face 0) and Evolution (face 11) are the model's exact top/bottom poles
    // after the initial mount-time rotation, so a Y-axis spin never disturbs
    // them — they stay level, like the flat caps of a spinning cylinder,
    // while everything else sweeps around the side. Only the camera's
    // distance changes, to zoom in on the result.
    orientFn = function orientCameraToPair(nodeA, nodeB) {
      const distance = 3.4; // zoomed in from the initial view distance of 5

      function bearing(node) {
        const pos = computeNodeWorldPos(node);
        return Math.atan2(pos.x, pos.z); // angle around the Y axis, 0 = facing the camera
      }

      let targetAngle;
      if (nodeA.type === 'center') {
        // Id sits at the exact center of the shape; it's always dead-center
        // on screen no matter how far the turntable spins, so just aim for
        // the other plane.
        targetAngle = bearing(nodeB);
      } else if (nodeB.type === 'center') {
        targetAngle = bearing(nodeA);
      } else {
        const angA = bearing(nodeA);
        const angB = bearing(nodeB);
        // Circular mean of the two bearings (handles wraparound correctly).
        const sumX = Math.sin(angA) + Math.sin(angB);
        const sumZ = Math.cos(angA) + Math.cos(angB);
        if (sumX * sumX + sumZ * sumZ > 0.0001) {
          targetAngle = Math.atan2(sumX, sumZ);
        } else {
          // The two bearings are ~180 degrees apart on the turntable; no spin
          // fronts both at once, so just face whichever is currently closer.
          targetAngle = Math.abs(angA) < Math.abs(angB) ? angA : angB;
        }
      }

      // Spin the shape (not the camera) so the averaged bearing lands at front.
      dodecahedronGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -targetAngle);

      // Zoom in along the camera's original, unchanged viewing axis.
      camera.position.set(0, 0, distance);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    captureFn = function capturePNG() {
      if (seqSelected.length !== 2) return;

      // Re-derive the best-fit angle at capture time too, so the export is
      // correct even if the user orbited away after selecting the pair.
      orientFn(seqSelected[0], seqSelected[1]);

      // Let the reset settle for a couple of frames before reading pixels.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          renderer.render(scene, camera);

          const glCanvas = renderer.domElement;
          const outW = glCanvas.clientWidth;
          const outH = glCanvas.clientHeight;
          const out = document.createElement('canvas');
          out.width = outW;
          out.height = outH;
          const ctx = out.getContext('2d');
          ctx.drawImage(glCanvas, 0, 0, outW, outH);

          const posA = computeNodeScreenPos(seqSelected[0]);
          const posB = computeNodeScreenPos(seqSelected[1]);

          drawCaptureArrow(ctx, posA, posB);
          drawCaptureLabel(ctx, posA, getNodeLabel(seqSelected[0]));
          drawCaptureLabel(ctx, posB, getNodeLabel(seqSelected[1]));

          out.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plane-${slugFor(seqSelected[0])}-to-${slugFor(seqSelected[1])}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }, 'image/png');
        });
      });
    };

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  });
</script>

<div class="dodeca-container" class:sequence-pair-active={sequenceMode && seqSelected.length === 2}>
  <canvas bind:this={canvas}></canvas>

  <!-- SVG Overlay: sequence-mode preview arrow only. User-drawn arrows are
       real 3D "snake" meshes now (see snakesGroup in the script), so they
       render inside the WebGL canvas itself, not here. -->
  <svg class="arrow-overlay">
    <defs>
      <marker id="sequence-arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#ffcc44" />
      </marker>
    </defs>

    <!-- Sequence-mode preview arrow between the two selected planes -->
    {#if sequenceMode && seqSelected.length === 2}
      {@const posA = seqSelected[0].type === 'face' ? $faceLabels[seqSelected[0].index] : seqSelected[0].type === 'center' ? $centerLabel : $externalLabel}
      {@const posB = seqSelected[1].type === 'face' ? $faceLabels[seqSelected[1].index] : seqSelected[1].type === 'center' ? $centerLabel : $externalLabel}
      <path
        d={`M ${posA?.x || 0} ${posA?.y || 0} L ${posB?.x || 0} ${posB?.y || 0}`}
        stroke="#ffcc44"
        stroke-width="3"
        fill="none"
        marker-end="url(#sequence-arrowhead)"
        class="sequence-arrow-path"
      />
    {/if}
  </svg>

  <!-- Toggle Labels Button -->
  <button class="toggle-labels-btn" on:click={toggleLabels}>
    {labelsVisible ? 'Hide Labels' : 'Show Labels'}
  </button>

  <!-- Language Toggle Button -->
  <button class="toggle-labels-btn language-toggle-btn" on:click={() => englishLabels = !englishLabels}>
    {englishLabels ? 'Greek Labels' : 'English Labels'}
  </button>

  <!-- Arrow Mode Button -->
  <button class="arrow-mode-btn" class:active={arrowMode} on:click={toggleArrowMode}>
    {arrowMode ? 'Exit Arrow Mode' : 'Arrow Mode'}
  </button>

  <!-- Sequence Mode Button -->
  <button class="sequence-mode-btn" class:active={sequenceMode} on:click={toggleSequenceMode}>
    {sequenceMode ? 'Exit Sequence Mode' : 'Sequence Mode'}
  </button>

  <!-- Arrow Path Building Controls (show when building a path) -->
  {#if arrowMode && currentPath.length > 0}
    <div class="arrow-controls">
      <div class="arrow-path-info">Path: {currentPath.length} label{currentPath.length !== 1 ? 's' : ''}</div>
      <button class="finish-arrow-btn" on:click={finishArrow}>Finish Arrow</button>
      <button class="cancel-arrow-btn" on:click={cancelCurrentArrow}>Cancel</button>
    </div>
  {/if}

  <!-- Sequence Mode Controls -->
  {#if sequenceMode}
    <div class="arrow-controls sequence-controls">
      <div class="arrow-path-info">
        {#if seqSelected.length === 0}
          Click a plane to start a sequence pair.
        {:else if seqSelected.length === 1}
          {getNodeLabel(seqSelected[0])} — click an adjacent plane.
        {:else}
          {getNodeLabel(seqSelected[0])} → {getNodeLabel(seqSelected[1])}
        {/if}
      </div>
      {#if seqSelected.length === 2}
        <button class="finish-arrow-btn" on:click={() => captureFn && captureFn()}>Capture PNG</button>
      {/if}
      <button class="cancel-arrow-btn" on:click={() => { seqSelected = []; }}>Clear</button>
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
        class:sequence-selected={sequenceMode && seqSelected.some(n => n.type === 'face' && n.index === i)}
        style="left: {($faceLabels[i]?.x || 0)}px; top: {($faceLabels[i]?.y || 0)}px;"
        on:click={() => {
          if (sequenceMode) { handleSequenceLabelClick('face', i); return; }
          if (!handleLabelClick('face', i)) {
            openFaceDetails(i);
          }
        }}
        role="button"
        tabindex="0"
      >
        {englishLabels ? faceNamesEnglish[i] : name}
      </div>
    {/each}

    <!-- Center label (F0) -->
    <div
      class="label face-label center-label"
      class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'center')}
      class:sequence-selected={sequenceMode && seqSelected.some(n => n.type === 'center')}
      style="left: {($centerLabel?.x || 0)}px; top: {($centerLabel?.y || 0)}px;"
      on:click={() => {
        if (sequenceMode) { handleSequenceLabelClick('center', null); return; }
        if (!handleLabelClick('center', null)) {
          openCenterDetails();
        }
      }}
      role="button"
      tabindex="0"
    >
      {englishLabels ? '0. Subconscious' : '0.υποσυνείδητον(Subconscious)'}
    </div>

    <!-- External label -->
    <div
      class="label external-label"
      class:arrow-source-selected={arrowMode && currentPath.some(label => label.type === 'external')}
      class:sequence-selected={sequenceMode && seqSelected.some(n => n.type === 'external')}
      style="left: {($externalLabel?.x || 0)}px; top: {($externalLabel?.y || 0)}px;"
      on:click={() => {
        if (sequenceMode) { handleSequenceLabelClick('external', null); return; }
        if (!handleLabelClick('external', null)) {
          openExternalDetails();
        }
      }}
      role="button"
      tabindex="0"
    >
      {englishLabels ? '∞. All' : '∞.τὸ πᾶν(All)'}
    </div>
  {/if}

  <!-- Detail Panel - Chat style on right side -->
  {#if isDetailPanelOpen && selectedFace !== null}
    <div class="detail-panel-overlay" on:click={closeDetailPanel}></div>
    <div class="detail-panel">
      <div class="detail-header">
        <h2>{selectedFace === 'center' ? (englishLabels ? '0. Subconscious' : '0.υποσυνείδητον(Subconscious)') : selectedFace === 'external' ? (englishLabels ? '∞. All' : '∞.τὸ πᾶν(All)') : (englishLabels ? faceNamesEnglish[selectedFace] : faceNames[selectedFace])}</h2>
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

.language-toggle-btn {
  left: 180px;
}

.arrow-mode-btn {
  position: fixed;
  top: 20px;
  left: 350px;
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

/* Sequence-mode styles */
.sequence-mode-btn {
  position: fixed;
  top: 20px;
  left: 540px;
  z-index: 100;
  background: rgba(15, 15, 35, 0.9);
  border: 2px solid rgba(255, 204, 68, 0.6);
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

.sequence-mode-btn:hover {
  background: rgba(255, 204, 68, 0.6);
  border-color: rgba(255, 204, 68, 1);
  transform: translateY(-2px);
}

.sequence-mode-btn.active {
  background: rgba(255, 204, 68, 0.9);
  border-color: rgba(255, 204, 68, 1);
  box-shadow: 0 0 20px rgba(255, 204, 68, 0.6);
}

.sequence-controls {
  border-color: rgba(255, 204, 68, 0.8) !important;
}

.sequence-controls .arrow-path-info {
  color: #ffcc44;
}

.sequence-controls .finish-arrow-btn {
  background: rgba(255, 204, 68, 0.8);
  border-color: rgba(255, 204, 68, 1);
  color: #1a1400;
}

.sequence-controls .finish-arrow-btn:hover {
  background: rgba(255, 204, 68, 1);
}

.sequence-selected {
  border: 3px solid #ffcc44 !important;
  box-shadow: 0 0 20px rgba(255, 204, 68, 0.8);
}

.sequence-arrow-path {
  filter: drop-shadow(0 2px 4px rgba(255, 204, 68, 0.5));
}

/* When a pair is locked in, fade everything else for a clean book illustration */
.dodeca-container.sequence-pair-active .label:not(.sequence-selected) {
  opacity: 0.06;
  pointer-events: none;
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

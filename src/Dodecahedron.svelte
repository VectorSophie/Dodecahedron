<script>
  import * as THREE from 'three';
  import { onMount } from 'svelte';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { writable } from 'svelte/store';

  let canvas;

  const phi = (1 + Math.sqrt(5)) / 2;

  // Corrected 20 vertices of a regular dodecahedron
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

  // 30 edges (vertex indices)
  const edgesIndices = [
    [0,8],[0,12],[0,16],[1,8],[1,14],[1,17],
    [2,10],[2,12],[2,18],[3,10],[3,14],[3,19],
    [4,8],[4,13],[4,16],[5,9],[5,15],[5,17],
    [6,11],[6,13],[6,18],[7,11],[7,15],[7,19],
    [8,9],[10,11],[12,13],[14,15],[16,17],[18,19]
  ];

  // 12 faces (vertex indices)
  const facesVertices = [
    [0,12,2,10,6], [0,16,1,17,4], [1,14,3,11,5],
    [2,18,3,14,12], [4,17,5,15,13], [6,10,7,11,19],
    [8,0,6,19,4], [9,1,4,13,5], [12,2,18,6,10],
    [14,3,10,2,12], [15,5,11,3,14], [16,0,8,9,1]
  ];

  // Name arrays
  const vertexNames = Array.from({length:20}, (_,i)=>`V${i}`);
  const edgeNames = Array.from({length:30}, (_,i)=>`E${i}`);
  const faceNames = Array.from({length:12}, (_,i)=>`F${i+1}`);

  const vertexLabels = writable([]);
  const edgeLabels = writable([]);
  const faceLabels = writable([]);

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
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(3,3,5);

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;

    // Draw edges
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const edgeObjects = [];
    edgesIndices.forEach(([i,j]) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([vertices[i], vertices[j]]);
      const line = new THREE.Line(geometry, edgeMaterial);
      scene.add(line);
      edgeObjects.push({line, i, j});
    });

    // Draw vertices
    const vertexMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const spheres = vertices.map((v, idx) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.05), vertexMaterial.clone());
      s.position.copy(v);
      s.userData = { index: idx };
      scene.add(s);
      return s;
    });

    // F0
    const f0Material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const f0Sphere = new THREE.Mesh(new THREE.SphereGeometry(0.08), f0Material);
    f0Sphere.position.copy(F0);
    scene.add(f0Sphere);

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
      spheres.forEach(s => s.material.color.set(0x00ff00));
      if(intersects.length > 0){
        intersects[0].object.material.color.set(0xffff00);
      }

      // Update labels
      vertexLabels.set(vertices.map(v => toScreenPosition(v, camera, renderer)));
      edgeLabels.set(edgeObjects.map(e => toScreenPosition(vertices[e.i].clone().add(vertices[e.j]).multiplyScalar(0.5), camera, renderer)));
      faceLabels.set(facesVertices.map(fv => {
        const center = fv.reduce((acc, idx)=> acc.add(vertices[idx]), new THREE.Vector3(0,0,0)).divideScalar(fv.length);
        return toScreenPosition(center, camera, renderer);
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

  <!-- Vertex labels -->
  {#each vertexNames as name, i}
    <div class="label" style="left: {($vertexLabels[i]?.x || 0)}px; top: {($vertexLabels[i]?.y || 0)}px;">
      {name}
    </div>
  {/each}

  <!-- Edge labels -->
  {#each edgeNames as name, i}
    <div class="label" style="left: {($edgeLabels[i]?.x || 0)}px; top: {($edgeLabels[i]?.y || 0)}px;">
      {name}
    </div>
  {/each}

  <!-- Face labels -->
  {#each faceNames as name, i}
    <div class="label" style="left: {($faceLabels[i]?.x || 0)}px; top: {($faceLabels[i]?.y || 0)}px;">
      {name}
    </div>
  {/each}
</div>

<style>
.dodeca-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.label {
  position: absolute;
  color: white;
  font-size: 12px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}
</style>

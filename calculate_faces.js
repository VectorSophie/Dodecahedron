// Calculate correct dodecahedron faces based on edges
const edgesIndices = [
  [8,9],[10,11],[12,13],[14,15],[16,17],[18,19],
  [0,8],[0,12],[0,16],[1,9],[1,14],[1,16],
  [2,10],[2,12],[2,17],[3,11],[3,14],[3,17],
  [4,8],[4,13],[4,19],[5,9],[5,15],[5,19],
  [6,10],[6,13],[6,18],[7,11],[7,15],[7,18]
];

// Build adjacency list
const adj = Array.from({length: 20}, () => []);
edgesIndices.forEach(([i, j]) => {
  adj[i].push(j);
  adj[j].push(i);
});

console.log('Adjacency list:');
adj.forEach((neighbors, i) => {
  console.log(`V${i}: [${neighbors.join(', ')}]`);
});

// For a dodecahedron, we need to find the 12 pentagonal faces
// Each face is a cycle of 5 vertices
// We'll use the known structure of a dodecahedron

// Known dodecahedron face structure based on the vertex coordinates
const faces = [
  [0, 8, 4, 13, 12],     // top face around +y region
  [0, 16, 1, 9, 8],      // face
  [0, 12, 2, 17, 16],    // face
  [1, 16, 17, 3, 14],    // face
  [1, 14, 15, 5, 9],     // face
  [2, 12, 13, 6, 10],    // face
  [2, 10, 11, 3, 17],    // face
  [4, 8, 9, 5, 19],      // face
  [4, 19, 18, 6, 13],    // face
  [5, 15, 7, 18, 19],    // face
  [6, 18, 7, 11, 10],    // face
  [3, 11, 7, 15, 14]     // bottom face around -y region
];

// Verify each face forms a valid cycle in the graph
function isCycle(face) {
  for (let i = 0; i < face.length; i++) {
    const curr = face[i];
    const next = face[(i + 1) % face.length];
    if (!adj[curr].includes(next)) {
      return false;
    }
  }
  return true;
}

console.log('\nFace validation:');
faces.forEach((face, i) => {
  const valid = isCycle(face);
  console.log(`F${i + 1} [${face.join(',')}]: ${valid ? 'VALID' : 'INVALID'}`);
});

console.log('\nconst facesVertices = [');
for (let i = 0; i < faces.length; i += 3) {
  const row = faces.slice(i, i + 3).map(f => `[${f.join(',')}]`).join(', ');
  console.log('  ' + row + (i + 3 < faces.length ? ',' : ''));
}
console.log('];');

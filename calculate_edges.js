// Calculate correct dodecahedron edges based on vertex distances
const phi = (1 + Math.sqrt(5)) / 2;

const vertices = [
  [1,1,1], [1,1,-1], [1,-1,1], [1,-1,-1],
  [-1,1,1], [-1,1,-1], [-1,-1,1], [-1,-1,-1],
  [0, phi, 1/phi], [0, phi, -1/phi],
  [0, -phi, 1/phi], [0, -phi, -1/phi],
  [1/phi, 0, phi], [-1/phi, 0, phi],
  [1/phi, 0, -phi], [-1/phi, 0, -phi],
  [phi, 1/phi, 0], [phi, -1/phi, 0],
  [-phi, -1/phi, 0], [-phi, 1/phi, 0]
];

function distance(v1, v2) {
  const dx = v1[0] - v2[0];
  const dy = v1[1] - v2[1];
  const dz = v1[2] - v2[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// Calculate all distances
const distances = [];
for (let i = 0; i < vertices.length; i++) {
  for (let j = i + 1; j < vertices.length; j++) {
    const dist = distance(vertices[i], vertices[j]);
    distances.push({ i, j, dist });
  }
}

// Sort by distance
distances.sort((a, b) => a.dist - b.dist);

// The first 30 shortest distances should be the edges (each vertex has degree 3)
const edges = distances.slice(0, 30);
const edgeLength = edges[0].dist;

console.log('Edge length:', edgeLength);
console.log('Number of edges at this length:', edges.filter(e => Math.abs(e.dist - edgeLength) < 0.001).length);

// Filter to only include edges at the correct length (with small tolerance)
const correctEdges = distances.filter(d => Math.abs(d.dist - edgeLength) < 0.001);

console.log('\nCorrect edges (30 total):');
console.log('const edgesIndices = [');
for (let i = 0; i < correctEdges.length; i += 6) {
  const row = correctEdges.slice(i, i + 6).map(e => `[${e.i},${e.j}]`).join(',');
  console.log('  ' + row + (i + 6 < correctEdges.length ? ',' : ''));
}
console.log('];');

// Verify each vertex has degree 3
const degree = new Array(20).fill(0);
correctEdges.forEach(({i, j}) => {
  degree[i]++;
  degree[j]++;
});

console.log('\nVertex degrees:');
degree.forEach((d, i) => {
  console.log(`V${i}: ${d} edges`);
});

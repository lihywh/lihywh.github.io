// Draw the remaining 3D trajectory in a HUD layer. It stays visible even
// when the destination is behind the paper, and never intercepts gestures.
const samples = 64;
const ink = '#143934';
const mint = '#a8ffdd';

function measure(points) {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    distances.push(distances[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return distances;
}

function sampleAt(points, distances, offset) {
  const i = distances.findIndex(distance => distance >= offset);
  const from = points[i - 1], to = points[i];
  const dx = to.x - from.x, dy = to.y - from.y;
  const length = distances[i] - distances[i - 1];
  const t = (offset - distances[i - 1]) / length;
  return {x: from.x + dx * t, y: from.y + dy * t, dx: dx / length, dy: dy / length};
}

function chevron(ctx, point, size) {
  const {x, y, dx, dy} = point;
  ctx.moveTo(x - dx * size - dy * size * .6, y - dy * size + dx * size * .6);
  ctx.lineTo(x, y);
  ctx.lineTo(x - dx * size + dy * size * .6, y - dy * size - dx * size * .6);
}

function trace(ctx, width, color) {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function drawFoldGuide(canvas, width, height, progress, projectCorner, endProgress=1) {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (progress >= endProgress) return;

  const points = Array.from({length: samples + 1}, (_, i) =>
    projectCorner(progress + (endProgress - progress) * i / samples));
  const distances = measure(points);
  const total = distances[samples];
  // Leave space for the drag handle at the head of the remaining path.
  if (total < 18) return;
  const start = Math.min(17, total * .36);
  const finish = total - 7;
  const origin = sampleAt(points, distances, start);
  const end = sampleAt(points, distances, finish);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  for (let i = 1; i < samples; i++) {
    if (distances[i] > start && distances[i] < finish) ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(end.x, end.y);
  ctx.setLineDash([4, 5]);
  trace(ctx, 3.5, '#143934c7');
  trace(ctx, 1.4, '#a8ffdde6');
  ctx.setLineDash([]);

  ctx.beginPath();
  for (let offset = start + 16; offset < finish - 18; offset += 30) {
    chevron(ctx, sampleAt(points, distances, offset), 5);
  }
  chevron(ctx, end, total > 36 ? 9 : 6);
  const goal = points[samples];
  ctx.moveTo(goal.x + 4, goal.y);
  ctx.arc(goal.x, goal.y, 4, 0, Math.PI * 2);
  trace(ctx, 4.8, ink);
  trace(ctx, 2.1, mint);
}

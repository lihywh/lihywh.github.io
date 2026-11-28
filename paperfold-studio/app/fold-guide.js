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

// alpha fades the whole HUD in before the tuck starts; the arrow itself is
// always drawn from the current corner, so it shortens as the tip advances.
export function drawFoldGuide(canvas, width, height, progress, projectCorner, endProgress=1, alpha=1) {
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
  if (total < 10 || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // The pocket mouth is marked with a bold double ring so the stop point
  // reads at a glance; the dashed shaft stops short of it.
  const goal = points[samples];
  const ring = Math.min(7, Math.max(3.5, total * .2));
  const start = Math.min(17, total * .36);
  const finish = total - ring - 5;
  if (finish > start + 3) {
    const origin = sampleAt(points, distances, start);
    const end = sampleAt(points, distances, finish);
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
    const head = finish - start > 30 ? 9 : 6;
    for (let offset = start + 16; offset < finish - head - 14; offset += 30) {
      chevron(ctx, sampleAt(points, distances, offset), 5);
    }
    chevron(ctx, end, head);
    trace(ctx, 4.8, ink);
    trace(ctx, 2.1, mint);
  }

  ctx.beginPath();
  ctx.moveTo(goal.x + ring, goal.y);
  ctx.arc(goal.x, goal.y, ring, 0, Math.PI * 2);
  ctx.moveTo(goal.x + ring * .45, goal.y);
  ctx.arc(goal.x, goal.y, ring * .45, 0, Math.PI * 2);
  trace(ctx, 5, ink);
  ctx.beginPath();
  ctx.moveTo(goal.x + ring, goal.y);
  ctx.arc(goal.x, goal.y, ring, 0, Math.PI * 2);
  ctx.moveTo(goal.x + ring * .45, goal.y);
  ctx.arc(goal.x, goal.y, ring * .45, 0, Math.PI * 2);
  trace(ctx, 2.2, mint);
}

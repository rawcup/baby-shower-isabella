// Dibuja la ruleta y la hace girar hasta un índice DADO (lo decide el servidor).
window.Roulette = (function () {
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#F7D9DD", "#FFF6EA", "#EBC9CF", "#F6E7C8"];
  let gifts = [], rotation = 0;

  function draw() {
    const S = canvas.width, c = S / 2, n = gifts.length, seg = (Math.PI * 2) / n;
    ctx.clearRect(0, 0, S, S);
    gifts.forEach((g, i) => {
      const a0 = -Math.PI / 2 + i * seg;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, c - 14, a0, a0 + seg); ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = "#C9A66B"; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + seg / 2);
      ctx.fillStyle = "#6B4650"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.font = "600 21px Nunito, sans-serif";
      const t = g.etiqueta || g.nombre;
      ctx.fillText(t.length > 22 ? t.slice(0, 21) + "…" : t, c - 36, 0);
      ctx.restore();
    });
    ctx.beginPath(); ctx.arc(c, c, 46, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = "#C9A66B"; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = "#B76E79"; ctx.font = "44px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♥", c, c + 2);
    ctx.beginPath(); ctx.arc(c, c, c - 14, 0, Math.PI * 2);
    ctx.strokeStyle = "#C9A66B"; ctx.lineWidth = 10; ctx.stroke();
  }

  function init(list) { gifts = list; draw(); }

  // Gira durante ~6 s y se detiene en el segmento `index`.
  function spinTo(index) {
    const seg = 360 / gifts.length;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const offset = (((360 - (index + 0.5) * seg + jitter) % 360) + 360) % 360;
    const start = rotation, end = Math.floor(start / 360) * 360 + 360 * 6 + offset;
    const dur = 6000, t0 = performance.now();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    return new Promise(resolve => {
      (function frame(now) {
        const t = Math.min((now - t0) / (reduce ? 1 : dur), 1);
        rotation = start + (end - start) * (1 - Math.pow(1 - t, 4));
        canvas.style.transform = `rotate(${rotation}deg)`;
        t < 1 ? requestAnimationFrame(frame) : resolve();
      })(t0);
    });
  }
  return { init, spinTo };
})();

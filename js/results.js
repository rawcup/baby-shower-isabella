// Confeti, imagen descargable y compartir por WhatsApp.
window.Results = (function () {
  function confetti() {
    const cv = document.getElementById("confetti"), x = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ["#E8A5B0", "#C9A66B", "#F7D9DD", "#fff", "#F2C94C"];
    const p = Array.from({ length: 140 }, () => ({
      x: cv.width / 2, y: cv.height * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4,
      s: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6
    }));
    let f = 0;
    (function loop() {
      x.clearRect(0, 0, cv.width, cv.height);
      p.forEach(q => { q.vy += 0.35; q.x += q.vx; q.y += q.vy; q.r += 0.15;
        x.save(); x.translate(q.x, q.y); x.rotate(q.r); x.fillStyle = q.c; x.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); x.restore(); });
      if (++f < 220) requestAnimationFrame(loop); else x.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  async function makeImage(nombre, regalo) {
    await document.fonts.ready;
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    const x = cv.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 1350);
    g.addColorStop(0, "#FFF6EA"); g.addColorStop(1, "#F7D9DD");
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
    x.strokeStyle = "#C9A66B"; x.lineWidth = 6; x.strokeRect(50, 50, 980, 1250);
    x.textAlign = "center"; x.fillStyle = "#6B4650";
    x.font = "italic 500 64px 'Cormorant Garamond', serif"; x.fillText("Baby Shower de", 540, 260);
    x.fillStyle = "#B76E79"; x.font = "italic 600 190px 'Cormorant Garamond', serif"; x.fillText(CONFIG.bebe, 540, 440);
    x.fillStyle = "#6B4650"; x.font = "600 44px Nunito, sans-serif"; x.fillText(nombre, 540, 640);
    x.font = "400 38px Nunito, sans-serif"; x.fillText("llevará para Isabella", 540, 710);
    x.fillStyle = "#C9A66B"; x.font = "italic 600 120px 'Cormorant Garamond', serif";
    const words = regalo.split(" "); const lines = words.length > 2 ? [words.slice(0, 2).join(" "), words.slice(2).join(" ")] : [regalo];
    lines.forEach((l, i) => x.fillText(l, 540, 900 + i * 125));
    x.fillStyle = "#B76E79"; x.font = "56px serif"; x.fillText("♥  ✦  ♥", 540, 1180);
    return cv.toDataURL("image/png");
  }

  async function download(nombre, regalo) {
    const a = document.createElement("a"); a.download = "regalo-isabella.png";
    a.href = await makeImage(nombre, regalo); a.click();
  }
  async function whatsapp(nombre, regalo, numero) {
    await download(nombre, regalo);   // WhatsApp no permite adjuntar imágenes por enlace: se descarga para adjuntarla
    const t = `Hola, soy ${nombre}. En la ruleta del Baby Shower de ${CONFIG.bebe} me tocó: ${regalo} 🎁 Te adjunto la captura.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(t)}`, "_blank", "noopener");
  }
  return { confetti, download, whatsapp };
})();

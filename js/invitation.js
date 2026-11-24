(function () {
  const $ = id => document.getElementById(id);
  const C = CONFIG, TBC = "Por confirmar";
  let guest = { nombre: "", token: null }, gifts = [], busy = false;

  // Datos del evento desde config.js
  [["fecha", "ev-fecha"], ["hora", "ev-hora"], ["lugar", "ev-lugar"], ["direccion", "ev-dir"]].forEach(([k, id]) => {
    $(id).textContent = C.evento[k] || TBC; if (!C.evento[k]) $(id).classList.add("tbc");
  });
  if (C.evento.notas) { $("ev-notas").textContent = C.evento.notas; $("ev-notas").hidden = false; }
  C.whatsapp.forEach(w => { const o = document.createElement("option"); o.value = w.numero; o.textContent = `${w.nombre} (${w.numero.replace(/^57/, "")})`; $("wa-to").appendChild(o); });
  $("padres").textContent = `${C.papa} y ${C.mama}`;

  // Estrellas de fondo
  for (let i = 0; i < 28; i++) {
    const s = document.createElement("i"); s.className = "star";
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${2 + Math.random() * 4}s;--s:${6 + Math.random() * 10}px`;
    $("stars").appendChild(s);
  }

  function showResult(nombre, regalo, yaGiro) {
    $("res-nombre").textContent = nombre;
    $("res-regalo").textContent = regalo;
    $("res-msg").textContent = yaGiro
      ? "Tu participación ya fue registrada. Este es el regalo que te correspondió."
      : "¡Gracias por acompañarnos! Isabella ya está feliz con tu regalo.";
    $("spin-zone").hidden = true; $("result").hidden = false;
    $("result").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function spin() {
    if (busy) return; busy = true; $("spin-btn").disabled = true; $("err").textContent = "";
    try {
      const r = await Api.spin(guest.token);                       // el SERVIDOR decide
      let idx = gifts.findIndex(g => g.id === r.regalo.id);
      if (idx < 0) { gifts.push(r.regalo); Roulette.init(gifts); idx = gifts.length - 1; }
      await Roulette.spinTo(idx);                                  // el navegador solo anima
      Results.confetti(); showResult(guest.nombre, r.regalo.nombre, false);
    } catch (e) {
      $("err").textContent = "No pudimos completar el giro. Revisa tu enlace e inténtalo de nuevo."; $("spin-btn").disabled = false;
    }
    busy = false;
  }

  async function openRoulette() {
    $("roulette").hidden = false; $("roulette").scrollIntoView({ behavior: "smooth" });
    try {
      const token = new URLSearchParams(location.search).get("token") || (C.modoDemo ? "DEMO" : null);
      if (!token) { $("spin-zone").hidden = true; $("err").textContent = "Necesitas tu enlace personal para participar."; return; }
      guest.token = token;
      const v = await Api.validateToken(token);
      if (!v.valido) { $("spin-zone").hidden = true; $("err").textContent = "Este enlace no es válido."; return; }
      if (!v.yaGiro && v.asistencia !== true) { $("roulette").hidden = true; showGate(v, token); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      guest.nombre = v.nombre; $("hola").textContent = `Hola, ${v.nombre}`;
      gifts = await Api.getGifts(); Roulette.init(gifts);
      if (v.yaGiro) showResult(v.nombre, v.regalo, true);
    } catch (e) { $("err").textContent = "No pudimos cargar la ruleta. Inténtalo más tarde."; }
  }

  // Confirmación de asistencia obligatoria antes de la ruleta
  function setDeclined(no) { $("conf-ask").hidden = no; $("conf-no").hidden = !no; }
  function showGate(v, token) {
    guest.token = token; guest.nombre = v.nombre;
    $("open-btn").hidden = true; $("confirm").hidden = false;
    $("conf-nombre").textContent = `Hola, ${v.nombre}`;
    setDeclined(v.asistencia === false);
  }
  async function respond(asiste) {
    $("conf-err").textContent = "";
    try {
      await Api.confirmAttendance(guest.token, asiste);
      if (asiste) { $("confirm").hidden = true; $("open-btn").hidden = false; openRoulette(); }
      else setDeclined(true);
    } catch (e) { $("conf-err").textContent = "No pudimos guardar tu respuesta. Inténtalo de nuevo."; }
  }
  (async () => {
    const token = new URLSearchParams(location.search).get("token") || (C.modoDemo ? "DEMO" : null);
    if (!token) return;
    try { const v = await Api.validateToken(token); if (v.valido && !v.yaGiro && v.asistencia !== true) showGate(v, token); } catch (e) {}
  })();
  $("yes-btn").addEventListener("click", () => respond(true));
  $("no-btn").addEventListener("click", () => respond(false));
  $("chg-btn").addEventListener("click", () => respond(true));
  $("open-btn").addEventListener("click", openRoulette);
  $("spin-btn").addEventListener("click", spin);
  $("dl-btn").addEventListener("click", () => Results.download(guest.nombre, $("res-regalo").textContent));
  $("wa-btn").addEventListener("click", () => Results.whatsapp(guest.nombre, $("res-regalo").textContent, $("wa-to").value));
  if (C.modoDemo) $("demo").hidden = false;
})();

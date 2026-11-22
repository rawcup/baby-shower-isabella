// Capa de acceso a datos. El navegador NUNCA elige el regalo: lo hace PostgreSQL (girar_ruleta).
(function () {
  const DEMO = ["Pañales RN – paquete de 50 unidades|Pañales RN x50", "Pañales etapa 1 – paquete de 50 unidades|Pañales etapa 1 x50",
    "Pañales etapa 2 – paquete de 50 unidades|Pañales etapa 2 x50", "Pañales etapa 3 – paquete de 50 unidades|Pañales etapa 3 x50",
    "Pañitos húmedos", "Crema antipañalitis|Crema antipañal", "Shampoo para bebé|Shampoo bebé", "Jabón líquido para bebé|Jabón líquido",
    "Crema hidratante infantil|Crema hidratante", "Algodón para bebé|Algodón", "Bodies", "Pijamas", "Conjunto de ropa", "Medias y gorritos",
    "Cobija", "Toallas para bebé|Toallas bebé", "Muselinas", "Cambiador portátil", "Biberones", "Baberos"]
    .map((s, i) => { const [nombre, etiqueta] = s.split("|"); return { id: i + 1, nombre, etiqueta: etiqueta || nombre }; });

  const demo = {
    async getGifts() { return DEMO.map(g => ({ ...g })); },
    async validateToken() { return { valido: true, nombre: "Invitado de prueba", yaGiro: false, regalo: null }; },
    async spin() { await new Promise(r => setTimeout(r, 300)); return { regalo: { ...DEMO[Math.floor(Math.random() * DEMO.length)] } }; } // SOLO DEMO
  };

  async function rpc(fn, args) {
    const { url, anonKey } = CONFIG.supabase;
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify(args || {})
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  const real = {
    getGifts: () => rpc("listar_regalos"),
    async validateToken(token) {
      const v = await rpc("validar_token", { p_token: token });
      return { valido: v.valido, nombre: v.nombre, yaGiro: !!v.ya_giro, regalo: v.regalo ? v.regalo.nombre : null };
    },
    async spin(token) { const r = await rpc("girar_ruleta", { p_token: token }); return { regalo: r.regalo }; }
  };
  window.Api = CONFIG.modoDemo ? demo : real;
})();

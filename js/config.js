// ============================================================
// CONFIGURACIÓN EDITABLE — complete aquí los datos pendientes
// ============================================================
window.CONFIG = {
  bebe: "Isabella",
  papa: "Daniel Ospina Losada",
  mama: "Camila Lasso Penagos",

  // Deje en null lo que aún no se defina: la página mostrará "Por confirmar".
  evento: {
    fecha: null,      // ej: "Sábado 14 de febrero de 2027"
    hora: null,       // ej: "3:00 p. m."
    lugar: null,      // ej: "Salón Los Almendros"
    direccion: null,  // ej: "Calle 10 # 5-20, Neiva"
    notas: null       // ej: "Código de vestimenta: tonos pastel"
  },

  // Números que reciben el resultado (formato internacional, sin +). Editable.
  whatsapp: [
    { nombre: "Contacto 1", numero: "573213076112" },
    { nombre: "Contacto 2", numero: "573209206885" },
    { nombre: "Contacto 3", numero: "573213662975" }
  ],

  // Fase 2: se completan al crear el proyecto en Supabase.
  // Solo la clave anon/publishable. NUNCA la service_role.
  supabase: { url: "https://latifgcexxowyftgxndu.supabase.co", anonKey: "sb_publishable_z2lt44g6BFQGNY9ZiYVGzg_Zfzrgqhl" },

  // true = ruleta de PRUEBA local (sin servidor). Debe ser false en producción.
  modoDemo: false
};

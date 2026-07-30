require("dotenv").config();
const axios = require("axios");

const API_BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "jesusprada27@gmail.com";

console.log("📧 Prueba Manual de Envío de Email");
console.log("=".repeat(60));
console.log(`\n📌 Email destino: ${TEST_EMAIL}\n`);

async function testEmailDelivery() {
  try {
    console.log("🚀 Enviando solicitud de código de recuperación...\n");

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/forgot-password`,
      {
        email: TEST_EMAIL,
      },
    );

    console.log("✅ Respuesta del servidor:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n📊 Status Code: ${response.status}\n`);

    console.log("=".repeat(60));
    console.log("📱 INSTRUCCIONES:");
    console.log("=".repeat(60));
    console.log("1. Revisa la bandeja de entrada de jesusprada27@gmail.com");
    console.log(
      '2. Busca un email con asunto: "Código de recuperación - T-SAFV"',
    );
    console.log("3. Verifica que el email tenga un código de 6 dígitos");
    console.log("4. Si no llega en 1-2 minutos, revisa la carpeta de SPAM");
    console.log("5. Si aún no llega, verifica las credenciales SMTP en .env");
    console.log("=".repeat(60));
    console.log("\n⏳ Esperando que revises el email...\n");
  } catch (error) {
    if (error.response) {
      console.log("❌ Error del servidor:");
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Detalle:`, error.response.data);

      if (error.response.status === 404) {
        console.log("\n⚠️  El email no está registrado en el sistema");
      } else if (error.response.status === 429) {
        console.log(
          "\n⚠️  Cooldown activo. Espera 1 minuto antes de reintentar",
        );
      }
    } else if (error.code === "ECONNREFUSED") {
      console.log("❌ Error de conexión");
      console.log("   El servidor no está corriendo en puerto 3000");
      console.log("   Ejecuta: npm start");
    } else {
      console.log("❌ Error:", error.message);
    }
  }
}

testEmailDelivery();

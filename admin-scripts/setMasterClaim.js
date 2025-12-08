// admin-scripts/setMasterClaim.js
const admin = require("firebase-admin");
const path = require("path");

// Cargar credenciales del archivo renombrado
const serviceAccount = require(path.join(__dirname, "service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://edusalud-platfor-default-rtdb.firebaseio.com"
});

// UID del usuario que debe ser admin MASTER
const uid = "ZkpIZXcNgORDcdqRUPwQWdClDjf2";

async function setAdminClaim() {
  try {
    console.log("🔧 Asignando isMaster=true al usuario:", uid);

    await admin.auth().setCustomUserClaims(uid, {
      isMaster: true
    });

    console.log("✅ Listo: isMaster=true asignado.");
    console.log("🔁 Cierra sesión en la plataforma y vuelve a iniciar sesión para ver el cambio.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error asignando el custom claim:", err);
    process.exit(1);
  }
}

setAdminClaim();

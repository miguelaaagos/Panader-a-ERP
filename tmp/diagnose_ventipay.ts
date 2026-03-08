import { VentiPay } from "../lib/ventipay.ts";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve("c:/Users/Migue/OneDrive/Escritorio/POS Panadería Software/.env");
dotenv.config({ path: envPath });

async function diagnose() {
    const secretKey = process.env.VENTIPAY_SECRET_KEY;
    console.log("--- Prueba de Creación de Suscripción ---");

    if (!secretKey) return;

    const client = new VentiPay({ secretKey });
    try {
        // Usamos datos reales del screenshot si es posible, o genéricos para test
        const testData = {
            customer: "cus_test_90hH4zpKo5zMSkU3DazKNFaw", // ID de cliente de prueba (ejemplo)
            plan: "pl_90hH4zpKo5zMSkU3DazKNFaw",
            currency: "clp",
            interval: "month"
        };

        console.log("Intentando crear suscripción con:", JSON.stringify(testData, null, 2));
        const response = await client.createSubscription(testData);
        console.log("Suscripción creada exitosamente:", JSON.stringify(response, null, 2));

    } catch (error: any) {
        console.error("ERROR_DETALLADO_INICIO");
        console.error(error.message);
        console.error("ERROR_DETALLADO_FIN");
    }
}

diagnose();

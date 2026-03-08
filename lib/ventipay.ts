/**
 * VentiPay Client Library
 * Sigue el Stack Contract: fetch nativo, sin dependencias externas pesadas.
 */

const VENTIPAY_API_URL = "https://api.ventipay.com/v1";

interface VentiPayOptions {
    secretKey?: string;
}

export class VentiPay {
    private secretKey: string;

    constructor(options?: VentiPayOptions) {
        this.secretKey = options?.secretKey || process.env.VENTIPAY_SECRET_KEY || "";
        if (!this.secretKey) {
            console.warn("VENTIPAY_SECRET_KEY no configurada. Las llamadas a la API fallarán.");
        }
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${VENTIPAY_API_URL}${path}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Bearer ${this.secretKey}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[VentiPay Request Error] ${response.status}:`, JSON.stringify(data, null, 2));
            throw new Error(data.error?.message || data.message || `VentiPay Error: ${response.status}`);
        }

        return data as T;
    }

    /**
     * Clientes
     */
    async createCustomer(data: { email: string; name: string; rut?: string }) {
        return this.request<any>("/customers", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async getCustomer(id: string) {
        return this.request<any>(`/customers/${id}`);
    }

    /**
     * Suscripciones
     */
    async createSubscription(data: {
        customer: string;
        plan: string;
        currency: string;
        interval: string;
        metadata?: Record<string, any>;
    }) {
        const payload = {
            customer: data.customer,
            plan: data.plan,
            currency: data.currency,
            interval: data.interval,
            metadata: data.metadata,
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/suscripcion?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/suscripcion?canceled=true`,
        };

        return this.request<any>("/subscriptions", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    async getSubscription(id: string) {
        return this.request<any>(`/subscriptions/${id}`);
    }

    async cancelSubscription(id: string) {
        return this.request<any>(`/subscriptions/${id}/cancel`, {
            method: "POST",
        });
    }

    /**
     * Planes
     */
    async listPlans() {
        return this.request<any>("/plans");
    }

    async getPlan(id: string) {
        return this.request<any>(`/plans/${id}`);
    }
}

// Singleton para uso común
export const ventipay = new VentiPay();

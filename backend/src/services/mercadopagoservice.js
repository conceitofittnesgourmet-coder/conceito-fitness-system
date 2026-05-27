class MercadoPagoService {

    async criarPagamento(pedido) {

        return {
            success: true,

            paymentId: `PAY-${Date.now()}`,

            status: "pending",

            qrCode: "PIX_QRCODE_EXEMPLO",

            copiaecola: "PIX_COPIA_E_COLA_EXEMPLO"
        };
    }

    async verificarPagamento(paymentId) {

        return {
            success: true,
            status: "approved"
        };
    }

    async cancelarPagamento(paymentId) {

        return {
            success: true,
            status: "cancelled"
        };
    }
}

module.exports = new MercadoPagoService();
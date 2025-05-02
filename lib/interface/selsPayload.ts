export interface CreateSellPayload {
    invoiceNo: string;
    salesmenId: number | null;
    discountType: string;
    discount: number;
    phone: string | null;
    totalPrice: number;
    totalPaymentAmount: number;
    changeAmount: number;
    vat: number;
    products: {
        variationProductId: number;
        quantity: number;
        unitPrice: number;
        discount: number;
        subTotal: number;
    }[];
    payments: {
        paymentAmount: number;
        accountId: number;
    }[];
    sku: string[];
}
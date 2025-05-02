"use client";

import React, { useState, useEffect } from "react";
import CustomButton from "../ReusableComopnents/Button";
import { generateInvoiceNumber } from "@/lib/theFunctions";
import { getDataFromServer } from "@/lib/baseURL";
import { motion, AnimatePresence } from "framer-motion";
import { CreateSellPayload } from "@/lib/interface/selsPayload";
import { token } from "@/lib/hardCodingData";



interface Product {
    id: number;
    productName: string;
    size: string;
    color: string | null;
    category: string;
    sku: string;
    code?: string;
    stock: number;
    price: number;
    sellPrice: number;
    quantity: number;
    subtotal: number;
    displayPrice: string;
    displayOldPrice?: string;
}

interface GroupedSku {
    code: string;
    id: number;
    sellPrice: number;
    price: number;
    quantity: number;
    subtotal: number;
    stock: number;
}

interface GroupedProduct {
    name: string;
    size: string;
    color: string | null;
    category: string;
    skus: GroupedSku[];
    totalQuantity: number;
    totalPrice: number;
}

interface PaymentMethod {
    id: number;
    method: string;
    amount: number;
}

interface HoldInvoice {
    id: string;
    invoiceNumber: string;
    products: Product[];
    paymentMethods: PaymentMethod[];
    discount: number | null;
    vat: number | null;
    MembershipId: number | null;
    salesPerson: string | null;
    phoneNumber: string | null;
    timestamp: number;
}

const SalesInvoice = ({ salesPersonsData }: { salesPersonsData: SalesPersonsResponse }) => {
    const [serialNumber, setSerialNumber] = useState(1);
    const [skuInput, setSkuInput] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [skuToDelete, setSkuToDelete] = useState<string | null>(null);
    const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: Date.now(), method: "Islami bank", amount: 0 }
    ]);
    const [showHoldListModal, setShowHoldListModal] = useState(false);
    const [holdInvoices, setHoldInvoices] = useState<HoldInvoice[]>([]);

    // Form variables
    const [discount, setDiscount] = useState<number | null>(null);
    const [vat, setVat] = useState<number | null>(null);
    const [MembershipId, setMembershipId] = useState<number | null>(null);
    const [salesPerson, setSalesPerson] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const invoiceNumber = generateInvoiceNumber(serialNumber);
    const availablePaymentMethods = ["Islami bank", "Cash", "Bkash", "Nagad", "Card"];

    // Load hold invoices from localStorage on component mount
    useEffect(() => {
        const savedHoldInvoices = localStorage.getItem('holdInvoices');
        if (savedHoldInvoices) {
            setHoldInvoices(JSON.parse(savedHoldInvoices));
        }

        const lastSerialNumber = localStorage.getItem('lastSerialNumber');
        if (lastSerialNumber) {
            setSerialNumber(parseInt(lastSerialNumber));
        }
    }, []);

    // Group products by name and size
    const groupedProducts = products.reduce((acc: any[], product) => {
        const existingGroup = acc.find(
            group => group.name === product.productName && group.size === product.size
        );

        if (existingGroup) {
            existingGroup.skus.push({
                code: product.sku.split('-')[1],
                id: product.id,
                sellPrice: product.sellPrice,
                price: product.price,
                quantity: product.quantity,
                subtotal: product.subtotal,
                stock: product.stock
            });
            existingGroup.totalQuantity += product.quantity;
            existingGroup.totalPrice += product.subtotal;
        } else {
            acc.push({
                name: product.productName,
                size: product.size,
                color: product.color,
                category: product.category,
                skus: [{
                    code: product.sku.split('-')[1],
                    id: product.id,
                    sellPrice: product.sellPrice,
                    price: product.price,
                    quantity: product.quantity,
                    subtotal: product.subtotal,
                    stock: product.stock
                }],
                totalQuantity: product.quantity,
                totalPrice: product.subtotal
            });
        }
        return acc;
    }, []);

    const handleSkuSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skuInput.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await getDataFromServer(
                `/purchase/get-purchase-single?search=${encodeURIComponent(skuInput)}`
            );

            if (response.success && response.data?.length > 0) {
                const productData = response.data[0];
                const newProduct: Product = {
                    ...productData,
                    quantity: 1,
                    subtotal: productData.sellPrice,
                    displayPrice: `Tk. ${productData.sellPrice.toFixed(2)}`,
                    displayOldPrice: productData.price < productData.sellPrice
                        ? `Tk. ${productData.price.toFixed(2)}`
                        : undefined
                };

                setProducts(prev => [...prev, newProduct]);
                setSkuInput("");
            } else {
                setError("Product not found");
            }
        } catch (err) {
            console.error("Error fetching product:", err);
            setError("Failed to fetch product data");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (sku: string, productId: number) => {
        setSkuToDelete(sku);
        setProductIdToDelete(sku);
        setShowDeleteModal(true);
    };

    const executeDelete = () => {
        if (productIdToDelete) {
            setProducts(prev => prev.filter(product => product.sku.split('-')[1] !== productIdToDelete));
        }
        console.group(products)
        setShowDeleteModal(false);
        setSkuToDelete(null);
        setProductIdToDelete(null);
    };

    const totalItems = groupedProducts.length;
    const totalQuantity = groupedProducts.reduce((sum, group) => sum + group.totalQuantity, 0);
    const subtotal = groupedProducts.reduce((sum, group) => sum + group.totalPrice, 0);
    const discountAmount = discount || 0;
    const vatPercentage = vat || 0;
    const vatAmount = (subtotal - discountAmount) * (vatPercentage / 100);
    const totalPayable = subtotal - discountAmount + vatAmount;
    const totalReceived = paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
    const remainingAmount = totalPayable - totalReceived;

    const addPaymentMethod = () => {
        if (remainingAmount > 0) {
            setPaymentMethods(prev => [
                ...prev,
                { id: Date.now(), method: availablePaymentMethods[0], amount: 0 }
            ]);
        }
    };

    const updatePaymentMethod = (id: number, field: string, value: string | number) => {
        setPaymentMethods(prev =>
            prev.map(method =>
                method.id === id
                    ? { ...method, [field]: field === 'amount' ? Number(value) : value }
                    : method
            )
        );
    };

    const removePaymentMethod = (id: number) => {
        if (paymentMethods.length > 1) {
            setPaymentMethods(prev => prev.filter(method => method.id !== id));
        }
    };

    const handleHoldInvoice = () => {
        if (products.length === 0) return;

        const newHoldInvoice: HoldInvoice = {
            id: Date.now().toString(),
            invoiceNumber,
            products,
            paymentMethods,
            discount,
            vat,
            MembershipId,
            salesPerson,
            phoneNumber,
            timestamp: Date.now()
        };

        const updatedHoldInvoices = [...holdInvoices, newHoldInvoice];
        setHoldInvoices(updatedHoldInvoices);
        localStorage.setItem('holdInvoices', JSON.stringify(updatedHoldInvoices));

        // Increment serial number for next invoice
        const newSerialNumber = serialNumber + 1;
        setSerialNumber(newSerialNumber);
        localStorage.setItem('lastSerialNumber', newSerialNumber.toString());

        // Clear current invoice
        clearInvoice();
    };

    const clearInvoice = () => {
        setProducts([]);
        setPaymentMethods([{ id: Date.now(), method: "Islami bank", amount: 0 }]);
        setDiscount(null);
        setVat(null);
        setMembershipId(null);
        setSalesPerson(null);
        setPhoneNumber(null);
    };

    const loadHoldInvoice = (invoice: HoldInvoice) => {
        setProducts(invoice.products);
        setPaymentMethods(invoice.paymentMethods);
        setDiscount(invoice.discount);
        setVat(invoice.vat);
        setMembershipId(invoice.MembershipId);
        setSalesPerson(invoice.salesPerson);
        setPhoneNumber(invoice.phoneNumber);
        setShowHoldListModal(false);
    };

    const deleteHoldInvoice = (id: string) => {
        const updatedHoldInvoices = holdInvoices.filter(invoice => invoice.id !== id);
        setHoldInvoices(updatedHoldInvoices);
        localStorage.setItem('holdInvoices', JSON.stringify(updatedHoldInvoices));
    };

    const handleAddPOS = async () => {
        if (remainingAmount > 0 || products.length === 0) return;

        try {
            setIsLoading(true);

            const selectedSalesPerson = salesPersonsData?.data?.find(p => p.firstName === salesPerson);
            const salesmenId = selectedSalesPerson?.id || 0;

            const payload: CreateSellPayload = {
                invoiceNo: invoiceNumber,
                salesmenId: salesmenId,
                discountType: "Fixed",
                discount: discount || 0,
                phone: phoneNumber || "",
                totalPrice: subtotal,
                totalPaymentAmount: totalReceived,
                changeAmount: Math.max(0, totalReceived - totalPayable),
                vat: vat || 0,
                products: products.map(product => ({
                    variationProductId: product.id,
                    quantity: product.quantity,
                    unitPrice: product.sellPrice,
                    discount: 0,
                    subTotal: product.subtotal
                })),
                payments: paymentMethods.map(method => ({
                    paymentAmount: method.amount,
                    accountId: getAccountIdFromMethod(method.method)
                })),
                sku: products.map(product => product.sku)
            };

            const response = await fetch('https://front-end-task-lake.vercel.app/api/v1/sell/create-sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to create sale');
            }

            const data = await response.json();

            // Show success modal
            setShowSuccessModal(true);

            // Clear invoice and increment serial number
            clearInvoice();
            const newSerialNumber = serialNumber + 1;
            setSerialNumber(newSerialNumber);
            localStorage.setItem('lastSerialNumber', newSerialNumber.toString());

            // Auto-close the modal after 2 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
            }, 2000);

        } catch (error) {
            console.error('Error creating sale:', error);
            setError('Failed to create sale. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Add this helper function to map payment methods to account IDs
    const getAccountIdFromMethod = (method: string): number => {
        // You'll need to adjust this mapping based on your actual account IDs
        const methodToAccountId: Record<string, number> = {
            "Islami bank": 7,
            "Cash": 2,
            "Bkash": 3,
            "Nagad": 4,
            "Card": 5
        };
        return methodToAccountId[method] || 2; // Default to Cash if not found
    };

    return (
        <div className="flex justify-between gap-4 w-full">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white p-6 rounded-lg shadow-lg"
                        >
                            <h3 className="font-semibold text-lg mb-4">Confirm Deletion</h3>
                            <p>Are you sure you want to remove SKU: {skuToDelete}?</p>
                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    className="px-4 py-2 border rounded"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-600 text-white rounded"
                                    onClick={executeDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hold List Modal */}
            <AnimatePresence>
                {showHoldListModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white p-6 rounded-lg shadow-lg w-1/2 max-h-[80vh] overflow-y-auto"
                        >
                            <h3 className="font-semibold text-lg mb-4">Hold Invoices</h3>
                            {holdInvoices.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No invoices on hold</div>
                            ) : (
                                <div className="space-y-4">
                                    {holdInvoices.map(invoice => (
                                        <motion.div
                                            key={invoice.id}
                                            className="border p-4 rounded"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-semibold">Invoice: {invoice.invoiceNumber}</div>
                                                    <div className="text-sm">
                                                        {invoice.products.length} items |
                                                        Total: {invoice.products.reduce((sum, p) => sum + p.subtotal, 0).toFixed(2)}৳
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(invoice.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                                        onClick={() => loadHoldInvoice(invoice)}
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                                        onClick={() => deleteHoldInvoice(invoice.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end mt-6">
                                <button
                                    className="px-4 py-2 border rounded"
                                    onClick={() => setShowHoldListModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white p-6 rounded-lg shadow-lg w-1/3"
                        >
                            <h3 className="font-semibold text-lg mb-4 text-green-600 flex justify-center">Success!</h3>
                            <p className="flex justify-center">Sale created successfully!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Left Panel - Products Section */}
            <div className="p-4 text-sm flex-1 min-w-0 w-3/4">
                {/* Product & Customer Navigation */}
                <div className="border p-4 rounded-md shadow mb-4 bg-white">
                    <h2 className="font-semibold text-lg border-b mb-4">Products & Customer Navigation</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Invoice Number"
                            className="w-full px-3 py-2 rounded border focus:outline-none"
                            value={invoiceNumber}
                            readOnly
                        />

                        <form onSubmit={handleSkuSearch} className="col-span-1">
                            <input
                                type="text"
                                placeholder="Type Sku Code/ Barcode then press enter"
                                className="w-full px-3 py-2 rounded focus:outline-none border"
                                value={skuInput}
                                onChange={(e) => setSkuInput(e.target.value)}
                            />
                        </form>

                        <input onChange={(e) => setPhoneNumber(e.target.value ? (e.target.value) : null)} type="number" value={phoneNumber || ''} placeholder="Phone" className="w-full border focus:outline-none px-3 py-2 rounded" />

                        <input onChange={(e) => setMembershipId(e.target.value ? Number(e.target.value) : null)} value={MembershipId || ''} type="text" placeholder="Membership id" className="w-full border focus:outline-none px-3 py-2 rounded" />

                        <select
                            onChange={(e) => {
                                const selectedId = parseInt(e.target.value);
                                if (selectedId) {
                                    const person = salesPersonsData?.data?.find(p => p.id === selectedId);
                                    setSalesPerson(person ? person.firstName : null);
                                } else {
                                    setSalesPerson(null);
                                }
                            }}
                            className="w-full border focus:outline-none px-3 py-2 rounded"
                        >
                            <option value="">Select Sales Person *</option>
                            {salesPersonsData?.data?.map((person) => (
                                <option key={person.id} value={person.id}>
                                    {person.firstName}
                                </option>
                            ))}
                        </select>

                        <select className="w-full border focus:outline-none px-3 py-2 rounded">
                            <option>Select Discount Type</option>
                            <option>Fixed</option>
                        </select>

                        <input onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : null)} type="number" value={discount || ''} placeholder="Enter the discount amount" className="w-full border focus:outline-none px-3 py-2 rounded" />

                        <input
                            onChange={(e) => setVat(e.target.value ? Number(e.target.value) : null)}
                            type="number"
                            value={vat || ''}
                            placeholder="Enter VAT %"
                            className="w-full border focus:outline-none px-3 py-2 rounded"
                            min="0"
                            max="100"
                        />
                    </div>
                </div>

                {/* Products Information */}
                <div className="border p-4 rounded-md shadow space-y-4 bg-white">
                    <h2 className="font-semibold text-lg border-b pb-1">Products Information</h2>

                    {isLoading && <div className="loader_global_template_2 mx-auto"></div>}
                    {error && <div className="text-red-500 text-center py-2">{error}</div>}

                    {groupedProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No products added yet. Search for a product by SKU code.
                        </div>
                    ) : (
                        groupedProducts.map((group, idx) => (
                            <div key={idx} className="border p-3 rounded space-y-1 relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">Name: {group.name}</div>
                                        <div className="text-xs">
                                            Size: {group.size} |
                                            Color: {group.color || "Not specified"} |
                                            Category: {group.category}
                                        </div>
                                        <div className="text-xs font-semibold">
                                            Available Stock: {Math.min(...group.skus.map((sku: GroupedSku) => sku.stock))} Units
                                        </div>
                                        <div className="text-xs flex gap-2">
                                            SKU:
                                            {group.skus.map((sku: GroupedSku, skuIdx: number) => (
                                                <span
                                                    key={skuIdx}
                                                    className="cursor-pointer rounded bg-red-200 px-1 text-black hover:text-white hover:bg-red-500"
                                                    onClick={() => confirmDelete(sku.code, sku.id)}
                                                >
                                                    {sku.code}{skuIdx < group.skus.length - 1 ? ' ' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Delete all products in this group
                                            setProducts(prev => prev.filter(
                                                product => !(product.productName === group.name && product.size === group.size)
                                            ))
                                        }}
                                        className="text-red-500 hover:text-red-700 text-3xl"
                                        title="Delete entire row"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex gap-1 items-center bg-gray-100 px-2 py-1 rounded">
                                        <span>Tk. {group.skus[0].sellPrice.toFixed(2)}</span>
                                    </div>
                                    <span className="ml-auto font-semibold">
                                        Subtotal: {group.totalPrice.toFixed(2)}৳
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Summary Section */}
            <div className="flex flex-col gap-4 p-6 flex-shrink-0 w-1/4">
                {/* Customer Info */}
                <div className="border p-3 rounded space-y-2 bg-white">
                    <div className="flex justify-between"><span className="font-semibold">Name</span><span>{salesPerson || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Phone</span><span>{phoneNumber || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Membership ID</span><span>{MembershipId || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Discount</span><span>{discount || 'N/A'}</span></div>
                </div>

                <div className="space-y-3 text-right text-sm">
                    <div>Maximum Retail Price (MRP): <span className="font-bold">{totalPayable.toFixed(2)}৳</span></div>
                    <div>(-) Discount: <span className="font-bold">{discountAmount.toFixed(2)}৳</span></div>
                    <div>(+) Vat/Tax ({vat || 0}%): <span className="font-bold">{vatAmount.toFixed(2)}৳</span></div>
                    <div>Number Of Items: <span className="font-bold">{totalItems}</span></div>
                    <div>Total Items Quantity: <span className="font-bold">{totalQuantity}</span></div>
                    <div className="text-lg font-semibold border-t pt-2">Total Payable Amount: {totalPayable.toFixed(2)}৳</div>

                    {/* Payment Methods */}
                    <div className="space-y-2">
                        {paymentMethods.map((method, index) => (
                            <div key={method.id} className="flex w-full gap-2 items-center">
                                {index > 0 && (
                                    <button
                                        className="border rounded p-1 text-xl w-full bg-red-100"
                                        onClick={() => removePaymentMethod(method.id)}
                                    >
                                        ×
                                    </button>
                                )}
                                {index === 0 && (
                                    <div className="w-1/3"></div>
                                )}
                                <select
                                    className="border px-3 py-2 rounded w-full"
                                    value={method.method}
                                    onChange={(e) => updatePaymentMethod(method.id, 'method', e.target.value)}
                                >
                                    {availablePaymentMethods.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <div className="col-span-2 w-full">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        className="w-full border px-3 py-2 rounded"
                                        value={method.amount || ''}
                                        onChange={(e) => updatePaymentMethod(method.id, 'amount', e.target.value)}
                                        max={index === paymentMethods.length - 1 ? remainingAmount + method.amount : undefined}
                                    />
                                </div>
                            </div>
                        ))}

                        {remainingAmount > 0 && (
                            <CustomButton onClick={addPaymentMethod} className="border rounded text-xl w-1/3 mt-2 text-white bg-green-600">+</CustomButton>
                        )}
                    </div>

                    <div className="mt-2 text-left space-y-1">
                        <div><strong>Addition Information</strong></div>
                        <div>Payable Amount: <span className="font-bold">{totalPayable.toFixed(2)}৳</span></div>
                        <div>Total Received Amount: <span className="font-bold">{totalReceived.toFixed(2)}৳</span></div>
                        <div>Change: <span className="font-bold">
                            {totalReceived > totalPayable ? (totalReceived - totalPayable).toFixed(2) : '0.00'}৳
                        </span></div>
                        <div className={remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                            {products.length > 0
                                ? (remainingAmount > 0
                                    ? `Remaining Amount: ${remainingAmount.toFixed(2)}৳`
                                    : 'Fully Paid')
                                : ''}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <CustomButton
                            className="bg-red-800 text-white py-2 rounded col-span-1"
                            onClick={clearInvoice}
                        >
                            Cancel & Clear
                        </CustomButton>

                        <CustomButton
                            className={`py-2 rounded col-span-2 ${remainingAmount > 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-800 text-white'}`}
                            disabled={remainingAmount > 0}
                            onClick={handleAddPOS}
                        >
                            Add POS
                        </CustomButton>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <CustomButton
                            className="bg-gray-800 text-white py-0.5 rounded"
                            onClick={handleHoldInvoice}
                        >
                            Hold
                        </CustomButton>
                        <CustomButton
                            className="bg-red-900 text-white py-0.5 rounded"
                            onClick={() => setShowHoldListModal(true)}
                        >
                            Hold List
                        </CustomButton>
                        <CustomButton className="bg-green-700 text-white py-0.5 rounded">SMS</CustomButton>
                        <CustomButton className="bg-gray-500 text-white py-0.5 rounded">Quotation</CustomButton>
                        <CustomButton className="bg-yellow-700 text-white py-0.5 rounded">Reattempt</CustomButton>
                        <CustomButton className="bg-blue-700 text-white py-0.5 rounded">Reprint</CustomButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesInvoice;
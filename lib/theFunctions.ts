// localStorageUtils.ts

export const getFromLocalStorage = <T>(key: string): T | null => {
    const storedData = localStorage.getItem(key);
    if (storedData) {
        return JSON.parse(storedData) as T;
    }
    return null;
};


export const generateInvoiceNumber = (serialNumber: number): string => {
    const now = new Date();
    
    // Get day, month, and year
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = now.getFullYear();
    
    // Format serial number with leading zeros
    const serial = String(serialNumber).padStart(4, '0');
    
    return `${day}${month}${year}${serial}`;
  };
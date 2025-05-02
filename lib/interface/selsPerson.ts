// interfaces/salesPerson.interface.ts
interface EmployeeDesignation {
    id: number;
    name: string;
    // Add other properties if available in the Object
  }
  
  interface SalesPerson {
    id: number;
    firstName: string;
    lastName: string | null;
    name: string;
    branchId: number;
    email: string | null;
    phone: string;
    nid: string;
    passport: string;
    idNumber: string;
    role: string;
    designationId: number;
    dateOfBirth: string | null;
    gender: string | null;
    maritalStatus: string | null;
    bloodGroup: string | null;
    graduation: string;
    fatherName: string | null;
    fatherPhone: string | null;
    motherName: string | null;
    motherPhone: string | null;
    referenceName: string | null;
    referencePhone: string | null;
    currentAddress: string | null;
    permanentAddress: string | null;
    joiningDate: string;
    comingByBus: boolean;
    createdAt: string;
    active: boolean;
    avatar: string;
    employeeDesignation: EmployeeDesignation;
  }
  
  interface SalesPersonsResponse {
    success: boolean;
    statusCode: number;
    meta: {
      page: number;
      size: number;
      total: number;
      totalPage: number;
    };
    message: string;
    data: SalesPerson[];
  }
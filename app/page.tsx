import SalesInvoice from "@/components/custom-component/SalesInvoice";
import { getDataFromServer } from "@/lib/baseURL";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
    return generateMeta({
        title: "Product Upload - Tech Element IT",
        description:
            "A login form with email and password. There's an option to login with Google and a link to sign up if you don't have an account.",
        canonical: "/login"
    });
}

export default async function Home() {
    const [data] = await Promise.all([getDataFromServer("/purchase/get-purchase-single?search=01007-00025")]);
    // Getching sels persons. 
    const [salesPersons] = await Promise.all([getDataFromServer("/employee/get-employee-all")]);
    return (
        <div>
           <SalesInvoice salesPersonsData={salesPersons} />
        </div>
    );
}
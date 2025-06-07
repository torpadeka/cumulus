import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/register-form";
import { verifyToken } from "@/lib/auth";

export default async function RegisterPage() {
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;

    if (token && verifyToken(token)) {
        redirect("/");
    }

    return <RegisterForm />;
}

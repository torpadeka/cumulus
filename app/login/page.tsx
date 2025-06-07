import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import LoginForm from "@/components/auth/login-form";

export default async function LoginPage() {
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;

    if (token && verifyToken(token)) {
        redirect("/");
    }

    return <LoginForm />;
}

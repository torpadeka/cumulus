import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("cumulus");
        const users = db.collection("users");

        const user = await users.findOne({ email });

        if (!user || !verifyPassword(password, user.password)) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const token = generateToken(user._id.toString());

        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                deviceId: user.deviceId,
            },
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

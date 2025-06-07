import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { username, email, password } = await request.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("cumulus");
        const users = db.collection("users");

        // Check if user already exists
        const existingUser = await users.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Create new user
        const hashedPassword = hashPassword(password);
        const result = await users.insertOne({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        });

        const token = generateToken(result.insertedId.toString());

        const response = NextResponse.json({
            success: true,
            user: { id: result.insertedId, username, email },
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const { deviceId } = await request.json();

        if (!deviceId || typeof deviceId !== "string") {
            return NextResponse.json(
                { error: "Valid device ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("cumulus");
        const users = db.collection("users");

        // Check if user already has a device linked
        const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
        if (user?.deviceId) {
            return NextResponse.json(
                { error: "Device already linked to this account" },
                { status: 400 }
            );
        }

        // Check if device is already linked to another user
        const existingDevice = await users.findOne({ deviceId });
        if (existingDevice) {
            return NextResponse.json(
                { error: "Device is already linked to another account" },
                { status: 400 }
            );
        }

        // Link device to user
        await users.updateOne(
            { _id: new ObjectId(decoded.userId) },
            { $set: { deviceId } }
        );

        return NextResponse.json({ success: true, deviceId });
    } catch (error) {
        console.error("Device linking error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

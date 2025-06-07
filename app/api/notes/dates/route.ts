import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
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

        const client = await clientPromise;
        const db = client.db("cumulus");
        const notes = db.collection("notes");

        // Get distinct dates for the user
        const dates = await notes.distinct("dateKey", {
            userId: new ObjectId(decoded.userId),
        });

        // Sort dates in descending order (newest first)
        const sortedDates = dates.sort((a, b) => b.localeCompare(a));

        return NextResponse.json({
            dates: sortedDates,
        });
    } catch (error) {
        console.error("Error fetching dates:", error);
        return NextResponse.json(
            { error: "Failed to fetch dates" },
            { status: 500 }
        );
    }
}

import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, deviceId } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required and must be a string" },
                { status: 400 }
            );
        }

        if (!deviceId) {
            return NextResponse.json(
                { error: "Device ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("cumulus");
        const users = db.collection("users");
        const notes = db.collection("notes");

        // Find user by deviceId
        const user = await users.findOne({ deviceId });
        if (!user) {
            return NextResponse.json(
                { error: "Device not linked to any user" },
                { status: 404 }
            );
        }

        const newNote = {
            userId: user._id,
            text: text.trim(),
            timestamp: new Date(),
            deviceId: deviceId,
        };

        const result = await notes.insertOne(newNote);

        return NextResponse.json({
            success: true,
            note: { ...newNote, id: result.insertedId },
            message: "Note received successfully",
        });
    } catch (error) {
        console.error("Error processing note:", error);
        return NextResponse.json(
            { error: "Failed to process note" },
            { status: 500 }
        );
    }
}

// Replace the GET function with this updated version that handles the missing index
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

        // Modified query to avoid sorting which requires an index
        const userNotes = await notes
            .find({ userId: new ObjectId(decoded.userId) })
            .limit(100)
            .toArray();

        // Sort in memory instead of in the database query
        const sortedNotes = userNotes.sort((a, b) => {
            return (
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            );
        });

        const formattedNotes = sortedNotes.map((note) => ({
            id: note._id.toString(),
            text: note.text,
            timestamp: note.timestamp.toISOString(),
            deviceId: note.deviceId,
        }));

        return NextResponse.json({
            notes: formattedNotes,
            count: formattedNotes.length,
        });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch notes" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        await notes.deleteMany({ userId: new ObjectId(decoded.userId) });

        return NextResponse.json({
            success: true,
            message: "All notes cleared",
        });
    } catch (error) {
        console.error("Error clearing notes:", error);
        return NextResponse.json(
            { error: "Failed to clear notes" },
            { status: 500 }
        );
    }
}

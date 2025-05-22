import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();
        const filePath = path.join(process.cwd(), "public", "stt_results.txt");
        if (text && text.trim().endsWith(".")) {
            fs.appendFileSync(filePath, text.trim() + "\n", "utf8");
            return NextResponse.json(
                { message: "STT sentence appended" },
                { status: 200 }
            );
        }
        return NextResponse.json(
            { message: "No complete sentence to append" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: `Error saving STT: ${error}` },
            { status: 500 }
        );
    }
}

export function OPTIONS() {
    return NextResponse.json(
        { message: "Method not allowed" },
        { status: 405 }
    );
}

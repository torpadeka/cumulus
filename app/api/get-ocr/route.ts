import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
    try {
        const filePath = path.join(process.cwd(), "public", "ocr_results.txt");
        const text = await fs.promises.readFile(filePath, "utf-8");
        return NextResponse.json({ text }, { status: 200 });
    } catch (error) {
        console.error("Error reading STT file:", error);
        return NextResponse.json(
            { error: "Failed to read STT text" },
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

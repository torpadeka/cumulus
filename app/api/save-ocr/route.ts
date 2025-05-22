import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json(); // Parse JSON body
        const filePath = path.join(process.cwd(), "public", "ocr_results.txt");
        fs.writeFileSync(filePath, text || "", "utf8");
        return NextResponse.json(
            { message: "OCR results saved" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: `Error saving OCR: ${error}` },
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

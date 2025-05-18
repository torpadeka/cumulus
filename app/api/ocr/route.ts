// app/api/ocr/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const azureEndpoint = `${process.env.NEXT_PUBLIC_VISION_ENDPOINT}vision/v3.2/read/analyze`;
    const azureKey = process.env.NEXT_PUBLIC_VISION_KEY;

    if (!azureEndpoint || !azureKey) {
        return NextResponse.json(
            { error: "Azure Vision API endpoint or key not configured" },
            { status: 500 }
        );
    }

    const imageBuffer = await req.arrayBuffer();

    const ocrResponse = await fetch(azureEndpoint, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": azureKey,
            "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
    });

    if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        return NextResponse.json(
            { error: `Azure Vision API error: ${errorText}` },
            { status: 500 }
        );
    }

    const operationLocation = ocrResponse.headers.get("Operation-Location");
    if (!operationLocation) {
        return NextResponse.json(
            { error: "Missing Operation-Location header" },
            { status: 500 }
        );
    }

    // Poll for result
    let result;
    let attempts = 0;
    while (attempts < 10) {
        const poll = await fetch(operationLocation, {
            headers: { "Ocp-Apim-Subscription-Key": azureKey },
        });
        result = await poll.json();
        if (result.status === "succeeded") break;
        if (result.status === "failed") {
            return NextResponse.json(
                { error: "OCR operation failed" },
                { status: 500 }
            );
        }
        await new Promise((r) => setTimeout(r, 1000));
        attempts++;
    }

    if (!result || result.status !== "succeeded") {
        return NextResponse.json(
            { error: "OCR operation timed out or did not succeed" },
            { status: 500 }
        );
    }

    let extractedText = "";
    result.analyzeResult.readResults?.forEach((readResult: any) => {
        readResult.lines.forEach((line: any) => {
            extractedText += line.text + "\n";
        });
    });

    return NextResponse.json({ text: extractedText || "No text detected" });
}
    
import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

export async function POST(req: NextRequest) {
    if (req.method !== "POST") {
        return NextResponse.json(
            { error: "Method not allowed" },
            { status: 405 }
        );
    }

    const { prompt } = await req.json();

    if (!prompt) {
        return NextResponse.json(
            { error: "Prompt is required" },
            { status: 400 }
        );
    }

    console.log("Endpoint:", process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT);
    console.log("Deployment:", process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT);
    console.log(
        "Key:",
        process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY ? "Set" : "Not set"
    );

    try {
        // Initialize the AzureOpenAI client
        const client = new AzureOpenAI({
            endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT!.replace(
                /\/$/,
                ""
            ),
            apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY!,
            deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT!,
            apiVersion: "2023-07-01-preview", // Matches the working curl command
        });

        // Log the constructed URL for debugging
        const constructedUrl = `${process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT!.replace(
            /\/$/,
            ""
        )}/openai/deployments/${
            process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT
        }/chat/completions?api-version=2023-07-01-preview`;
        console.log("Constructed API URL:", constructedUrl);

        // Make the request to Azure OpenAI's deployment
        const response = await client.chat.completions.create({
            model: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT!,
            messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        console.log(
            "Response from Azure OpenAI:",
            JSON.stringify(response, null, 2)
        );

        const gptResponse =
            response.choices[0]?.message?.content || "No response generated.";

        return NextResponse.json({ response: gptResponse }, { status: 200 });
    } catch (error) {
        console.error("Error calling Azure OpenAI:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch GPT response",
                details: error instanceof Error ? error.message : String(error),
                fullError: JSON.stringify(
                    error,
                    Object.getOwnPropertyNames(error)
                ),
            },
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

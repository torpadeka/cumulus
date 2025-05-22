import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AzureOpenAI } from "openai";
import { createReadStream, promises as fsPromises, unlink } from "fs";
import { promisify } from "util";
import { join } from "path";
import { tmpdir } from "os";

// Promisify fs.unlink for async cleanup
const unlinkAsync = promisify(unlink);

// Configure Azure Speech SDK for STT and TTS
const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.SPEECH_KEY!,
    process.env.SPEECH_REGION!
);
speechConfig.speechRecognitionLanguage = "id-ID"; // For STT
speechConfig.speechSynthesisVoiceName = "id-ID-JennyNeural"; // For TTS

export async function POST(req: NextRequest) {
    try {
        // Step 1: Parse the incoming audio file
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        // Step 2: Convert the incoming WebM audio to WAV using webm-to-wav-converter
        const tempWavPath = join(tmpdir(), `stt-${Date.now()}.wav`);
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        // Convert Buffer to Blob (webm-to-wav-converter expects a Blob or array of Blobs)
        const wavBlob = new Blob([audioBuffer], { type: "audio/wav" });

        // Convert WAV Blob to Buffer to write to file
        const wavArrayBuffer = await wavBlob.arrayBuffer();
        const wavBuffer = Buffer.from(wavArrayBuffer);
        await fsPromises.writeFile(tempWavPath, wavBuffer);

        // Step 3: Perform STT (Speech-to-Text)
        const pushStream = sdk.AudioInputStream.createPushStream();
        const wavStream = createReadStream(tempWavPath);
        wavStream.on("data", (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            // Convert Buffer to ArrayBuffer by slicing the underlying buffer
            const arrayBuffer = buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
            ) as ArrayBuffer;
            pushStream.write(arrayBuffer);
        });

        wavStream.on("end", () => {
            pushStream.close();
        });

        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        const transcribedText = await new Promise<string>((resolve, reject) => {
            let text = "";

            recognizer.recognized = (_s, e) => {
                if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    text += (text ? "\n" : "") + e.result.text;
                }
            };

            recognizer.canceled = (_s, e) => {
                const reason = e.reason || "Unknown error";
                reject(new Error(`Speech recognition canceled: ${reason}`));
            };

            recognizer.sessionStopped = () => {
                recognizer.close();
                resolve(text);
            };

            recognizer.startContinuousRecognitionAsync(
                () => {},
                (err) => {
                    reject(new Error(`Failed to start recognition: ${err}`));
                }
            );
        });

        if (!transcribedText) {
            await unlinkAsync(tempWavPath);
            return NextResponse.json(
                { error: "No speech recognized" },
                { status: 400 }
            );
        }

        // Step 4: Send the transcribed text to Azure OpenAI (GPT)
        const client = new AzureOpenAI({
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!.replace(/\/$/, ""),
            apiKey: process.env.AZURE_OPENAI_KEY!,
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
            apiVersion: "2023-07-01-preview",
        });

        const gptResponse = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT!,
            messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: transcribedText },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const gptText =
            gptResponse.choices[0]?.message?.content ||
            "No response generated.";

        // Step 5: Perform TTS (Text-to-Speech) to convert GPT response to audio
        const ttsAudioPath = join(tmpdir(), `tts-${Date.now()}.mp3`);
        const audioOutputConfig =
            sdk.AudioConfig.fromAudioFileOutput(ttsAudioPath);
        const synthesizer = new sdk.SpeechSynthesizer(
            speechConfig,
            audioOutputConfig
        );

        await new Promise<void>((resolve, reject) => {
            synthesizer.speakTextAsync(
                gptText,
                (result) => {
                    synthesizer.close();
                    if (
                        result.reason ===
                        sdk.ResultReason.SynthesizingAudioCompleted
                    ) {
                        resolve();
                    } else {
                        reject(new Error(`TTS failed: ${result.errorDetails}`));
                    }
                },
                (err) => {
                    synthesizer.close();
                    reject(new Error(`TTS error: ${err}`));
                }
            );
        });

        // Step 6: Read the generated audio file and return it
        const ttsAudioBuffer = await fsPromises.readFile(ttsAudioPath);
        const response = new NextResponse(ttsAudioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": "attachment; filename=response.mp3",
            },
        });

        // Clean up temporary files
        await Promise.all([
            unlinkAsync(tempWavPath),
            unlinkAsync(ttsAudioPath),
        ]);

        return response;
    } catch (error) {
        console.error("Error in Cumulus Talk API:", error);
        return NextResponse.json(
            {
                error: "Failed to process request",
                details: error instanceof Error ? error.message : String(error),
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

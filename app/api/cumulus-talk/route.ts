import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AzureOpenAI } from "openai";
import ffmpeg from "fluent-ffmpeg";
import { createReadStream, promises as fsPromises, unlink } from "fs";
import { promisify } from "util";
import { join } from "path";
import { tmpdir } from "os";
import { exec } from "child_process";

// Promisify fs.unlink and exec for async cleanup and command execution
const unlinkAsync = promisify(unlink);
const execAsync = promisify(exec);

// Configure Azure Speech SDK for STT and TTS
const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.SPEECH_KEY!,
    process.env.SPEECH_REGION!
);
speechConfig.speechRecognitionLanguage = "en-US"; // For STT
speechConfig.speechSynthesisVoiceName = "id-ID-ArdiNeural";

ffmpeg.setFfmpegPath(
    "C:\\Users\\indod\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe"
);

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

        // Step 2: Convert the incoming WebM audio to WAV using fluent-ffmpeg
        const tempWebmPath = join(tmpdir(), `input-${Date.now()}.webm`);
        const tempWavPath = join(tmpdir(), `stt-${Date.now()}.wav`);
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        await fsPromises.writeFile(tempWebmPath, audioBuffer);

        await new Promise((resolve, reject) => {
            ffmpeg(tempWebmPath)
                .audioChannels(1) // Mono
                .audioFrequency(16000) // 16 kHz
                .format("wav")
                .audioCodec("pcm_s16le") // 16-bit
                .on("end", resolve)
                .on("error", (err) =>
                    reject(new Error(`FFmpeg error: ${err.message}`))
                )
                .save(tempWavPath);
        });

        // Verify WAV file format (tolerate FFmpeg's non-zero exit code)
        try {
            const { stderr: wavInfo } = await execAsync(
                `C:\\Users\\indod\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe -i ${tempWavPath}`,
                { encoding: "utf8" }
            );
            console.log("WAV file info:", wavInfo);
        } catch (err: any) {
            console.log("WAV file info (via stderr):", err.stderr);
            // Proceed despite the error, as this is just for debugging
        }

        // Clean up the input WebM file
        await unlinkAsync(tempWebmPath);

        // Step 3: Perform STT (Speech-to-Text)
        const pushStream = sdk.AudioInputStream.createPushStream();
        const wavStream = createReadStream(tempWavPath);
        let bytesWritten = 0;
        wavStream.on("data", (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            const arrayBuffer = buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
            ) as ArrayBuffer;
            pushStream.write(arrayBuffer);
            bytesWritten += buffer.length;
            console.log(`Wrote ${buffer.length} bytes, total: ${bytesWritten}`);
        });

        wavStream.on("end", () => {
            console.log(`Stream ended, total bytes written: ${bytesWritten}`);
            pushStream.close(); // Reintroduce explicit stream closure
        });

        wavStream.on("error", (err) => {
            console.error("Stream error:", err);
            pushStream.close();
        });

        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        const transcribedText = await Promise.race([
            new Promise<string>((resolve, reject) => {
                let text = "";

                recognizer.recognized = (_s, e) => {
                    if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                        text += (text ? "\n" : "") + e.result.text;
                        console.log("Recognized:", e.result.text);
                    } else {
                        console.log("Recognition event:", e.result.reason);
                    }
                };

                recognizer.canceled = (_s, e) => {
                    console.error("Cancellation details:", {
                        errorCode: e.errorCode,
                        errorDetails: e.errorDetails,
                        reason: e.reason,
                    });
                    const reason = e.reason || "Unknown error";
                    if (reason === sdk.CancellationReason.EndOfStream) {
                        console.log(
                            "End of stream detected, resolving with current text"
                        );
                        resolve(text); // Resolve with text if it's just EndOfStream
                    } else {
                        reject(
                            new Error(
                                `Speech recognition canceled: ${reason}, Code: ${e.errorCode}, Details: ${e.errorDetails}`
                            )
                        );
                    }
                };

                recognizer.sessionStopped = () => {
                    console.log("Session stopped");
                    recognizer.close();
                    resolve(text); // Ensure resolution on session end
                };

                recognizer.startContinuousRecognitionAsync(
                    () => {
                        console.log("Recognition started");
                    },
                    (err) => {
                        reject(
                            new Error(`Failed to start recognition: ${err}`)
                        );
                    }
                );
            }),
            new Promise((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error("Recognition timed out after 30 seconds")
                        ),
                    30000
                )
            ), // 30-second timeout
        ]);

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

        const cumulusPrompt =
            "Anda adalah chatbot Cumulus, sebuah platform pembelajaran guru-siswa yang membaca teks papan tulis dengan OCR secara langsung, dan mendengar perkataan guru yang diubah menjadi teks dengan Speech-to-Text. Tugas anda adalah untuk menggunakan kedua data ini sebagai konteks untuk menjawab pertanyaan murid. Ketika merespon, jangan katakan 'saya akan membantu' atau pembuka yang terlalu bertele-tele dan tidak berhubungan dan langsung menjawab prompt dari murid tanpa membahas atau memberitahu isi dari data OCR maupun STT. Berikut adalah data yang tersedia:";
        const userPrompt = `Murid menanyakan hal ini: "${transcribedText}". Tolong respon sebagai assistant murid tersebut, dengan menggunakan data OCR dan STT tersebut sebagai konteks untuk merespon.`;

        const gptResponse = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT!,
            messages: [
                { role: "system", content: cumulusPrompt },
                { role: "user", content: userPrompt },
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

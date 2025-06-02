import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface Note {
  id: string
  text: string
  timestamp: string
  deviceId?: string
}

const NOTES_FILE_PATH = path.join(process.cwd(), "data", "notes.json")

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(NOTES_FILE_PATH)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read notes from file
async function readNotesFromFile(): Promise<Note[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(NOTES_FILE_PATH, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return []
  }
}

// Write notes to file
async function writeNotesToFile(notes: Note[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(NOTES_FILE_PATH, JSON.stringify(notes, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, deviceId } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required and must be a string" }, { status: 400 })
    }

    // Read existing notes
    const notes = await readNotesFromFile()

    const newNote: Note = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      deviceId: deviceId || "Unknown Device",
    }

    // Add new note to the beginning
    notes.unshift(newNote)

    // Keep only the last 100 notes to prevent file from getting too large
    if (notes.length > 100) {
      notes.splice(100)
    }

    // Write back to file
    await writeNotesToFile(notes)

    return NextResponse.json({
      success: true,
      note: newNote,
      message: "Note received and saved successfully",
    })
  } catch (error) {
    console.error("Error processing note:", error)
    return NextResponse.json({ error: "Failed to process note" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const notes = await readNotesFromFile()
    return NextResponse.json({
      notes: notes,
      count: notes.length,
    })
  } catch (error) {
    console.error("Error reading notes:", error)
    return NextResponse.json({ error: "Failed to read notes" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await writeNotesToFile([])
    return NextResponse.json({
      success: true,
      message: "All notes cleared",
    })
  } catch (error) {
    console.error("Error clearing notes:", error)
    return NextResponse.json({ error: "Failed to clear notes" }, { status: 500 })
  }
}

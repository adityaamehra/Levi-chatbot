import { type NextRequest, NextResponse } from "next/server"
import { addToLeaderboard, getLeaderboard } from "@/lib/database"

export async function GET() {
  try {
    console.log("GET /api/leaderboard called")
    const leaderboard = getLeaderboard()
    console.log("Leaderboard entries:", leaderboard.length)

    // Ensure clean JSON response
    const cleanLeaderboard = leaderboard.map((entry) => ({
      username: entry.username,
      attempts: entry.attempts,
      timeInSeconds: entry.timeInSeconds,
      promptScore: entry.promptScore,
      totalScore: entry.totalScore,
      timestamp: entry.timestamp,
    }))

    return NextResponse.json(cleanLeaderboard, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Leaderboard GET Error:", error)
    return NextResponse.json(
      {
        error: "Failed to get leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/leaderboard called")
    const body = await request.json()
    console.log("Received entry:", body)

    // Validate the entry
    if (!body.username || typeof body.username !== "string") {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 })
    }

    // Clean and validate the entry
    const entry = {
      username: String(body.username).trim(),
      attempts: Number(body.attempts) || 0,
      timeInSeconds: Number(body.timeInSeconds) || 0,
      promptScore: Number(body.promptScore) || 0,
      totalScore: Number(body.totalScore) || 0,
      timestamp: body.timestamp || new Date().toISOString(),
    }

    console.log("Cleaned entry:", entry)
    addToLeaderboard(entry)
    console.log("Entry added to leaderboard")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leaderboard POST Error:", error)
    return NextResponse.json(
      {
        error: "Failed to add to leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

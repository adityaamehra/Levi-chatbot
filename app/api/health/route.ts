import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    console.log("Health check - API key exists:", !!apiKey)
    console.log("Health check - API key length:", apiKey?.length || 0)

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GOOGLE_GENERATIVE_AI_API_KEY environment variable is missing",
          details: "Please set the GOOGLE_GENERATIVE_AI_API_KEY environment variable",
        },
        { status: 500 },
      )
    }

    // Simple validation - just check if the key exists and has reasonable length
    if (apiKey.length < 20) {
      return NextResponse.json(
        {
          error: "API key appears to be invalid - too short",
          details: `API key length: ${apiKey.length}, expected: ~39 characters`,
        },
        { status: 500 },
      )
    }

    if (!apiKey.startsWith("AIza")) {
      return NextResponse.json(
        {
          error: "API key format appears incorrect",
          details: "Google AI API keys should start with 'AIza'",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      message: "API key is configured correctly",
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 6) + "...",
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

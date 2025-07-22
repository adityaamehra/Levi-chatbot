import { type NextRequest, NextResponse } from "next/server"
import { getChatResponse } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { messages, flag, imageBase64 } = await request.json()

    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: "API key not configured",
          response:
            "Yaar, admin ne API key set nahi kiya! GOOGLE_GENERATIVE_AI_API_KEY environment variable missing hai 🔑",
        },
        { status: 500 },
      )
    }

    console.log("Chat API called with:", {
      messagesCount: messages.length,
      flag: flag ? "present" : "missing",
      imageProvided: !!imageBase64,
    })

    const response = await getChatResponse(messages, flag, imageBase64)

    return NextResponse.json({
      response,
      flagFound: response.includes(flag),
    })
  } catch (error) {
    console.error("Chat API Error:", error)

    let errorMessage = "Failed to get response"
    let userMessage = "Kuch technical problem hai yaar! Try again 😅"

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "API key issue"
        userMessage = "API key problem hai! Admin se contact kar 🔑"
      } else if (error.message.includes("quota")) {
        errorMessage = "API quota exceeded"
        userMessage = "API quota khatam ho gaya! Thoda wait kar 😴"
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        response: userMessage,
      },
      { status: 500 },
    )
  }
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CameraCapture from "@/components/camera-capture"
import ChatInterface from "@/components/chat-interface"
import Leaderboard from "@/components/leaderboard"
import { encodeUsername, scorePrompt, computeTotalScore } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/database"
import { RefreshCw, Flag, AlertCircle, Camera, X, AlertTriangle } from "lucide-react"
import SetupGuide from "@/components/setup-guide"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface GameState {
  username: string
  startTime: number
  attempts: number
  messages: Message[]
  promptScores: number[]
  flagFound: boolean
  finalScore: number | null
  endTime: number | null
  photo: string
}

const INITIAL_STATE: GameState = {
  username: "",
  startTime: 0,
  attempts: 0,
  messages: [],
  promptScores: [],
  flagFound: false,
  finalScore: null,
  endTime: null,
  photo: "",
}

export default function LEVIChallenge() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "valid" | "invalid">("checking")
  const [apiError, setApiError] = useState<string | null>(null)
  const [setupPhoto, setSetupPhoto] = useState<string>("")
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  const f1 = process.env.FLAG;
  const flag = gameState.username
    ? `${f1}${encodeUsername(gameState.username)}`
    : "";

  // Load leaderboard on mount
  useEffect(() => {
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    // Check API key status on mount
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/health")
        const data = await response.json()

        if (response.ok) {
          setApiKeyStatus("valid")
          setApiError(null)
        } else {
          setApiKeyStatus("invalid")
          setApiError(data.error || "API key configuration issue")
        }
      } catch (error) {
        console.error("Health check failed:", error)
        setApiKeyStatus("invalid")
        setApiError("Failed to check API configuration")
      }
    }

    checkApiKey()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      console.log("Fetching leaderboard...")
      setLeaderboardError(null)

      const response = await fetch("/api/leaderboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Leaderboard data received:", data)

      // Ensure data is an array
      if (Array.isArray(data)) {
        setLeaderboard(data)
      } else {
        console.error("Leaderboard data is not an array:", data)
        setLeaderboard([])
        setLeaderboardError("Invalid leaderboard data format")
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
      setLeaderboard([])
      setLeaderboardError(error instanceof Error ? error.message : "Failed to load leaderboard")
    }
  }

  const startGame = () => {
    if (usernameInput.trim() && setupPhoto) {
      setGameState({
        ...INITIAL_STATE,
        username: usernameInput.trim(),
        photo: setupPhoto,
        startTime: Date.now(),
      })
    }
  }

  const handlePhotoCapture = (imageData: string) => {
    console.log("Photo captured in setup, data length:", imageData.length)
    setSetupPhoto(imageData)
  }

  const removePhoto = () => {
    setGameState((prev) => ({ ...prev, photo: "" }))
  }

  const retryApiCheck = async () => {
    setApiKeyStatus("checking")
    setApiError(null)

    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      const data = await response.json()

      if (response.ok) {
        setApiKeyStatus("valid")
        setApiError(null)
      } else {
        setApiKeyStatus("invalid")
        setApiError(data.error || "API key configuration issue")
      }
    } catch (error) {
      console.error("Health check failed:", error)
      setApiKeyStatus("invalid")
      setApiError("Failed to check API configuration")
    }
  }

  const sendMessage = async (message: string) => {
    if (gameState.attempts >= 3 || gameState.flagFound) return

    setIsLoading(true)

    const newMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    }

    const updatedMessages = [...gameState.messages, newMessage]
    const promptScore = scorePrompt(message)

    setGameState((prev) => ({
      ...prev,
      messages: updatedMessages,
      attempts: prev.attempts + 1,
      promptScores: [...prev.promptScores, promptScore],
    }))

    try {
      console.log("Sending message with photo:", !!gameState.photo)
      console.log("Photo data preview:", gameState.photo.substring(0, 50) + "...")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          flag,
          imageBase64: gameState.photo || null,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      const endTime = Date.now()
      const flagFound = data.flagFound

      setGameState((prev) => ({
        ...prev,
        messages: finalMessages,
        flagFound,
        endTime: flagFound || prev.attempts + 1 >= 3 ? endTime : null,
      }))

      // If game ended, calculate final score and update leaderboard
      if (flagFound || gameState.attempts + 1 >= 3) {
        const timeInSeconds = (endTime - gameState.startTime) / 1000
        const totalPromptScore = [...gameState.promptScores, promptScore].reduce((a, b) => a + b, 0)
        const finalScore = computeTotalScore(totalPromptScore, gameState.attempts + 1, timeInSeconds)

        setGameState((prev) => ({ ...prev, finalScore }))

        // Add to leaderboard
        const leaderboardEntry: LeaderboardEntry = {
          username: gameState.username,
          attempts: gameState.attempts + 1,
          timeInSeconds,
          promptScore: totalPromptScore,
          totalScore: finalScore,
          timestamp: new Date().toISOString(),
        }

        try {
          const leaderboardResponse = await fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leaderboardEntry),
          })

          if (leaderboardResponse.ok) {
            console.log("Successfully added to leaderboard")
            fetchLeaderboard()
          } else {
            console.error("Failed to add to leaderboard:", leaderboardResponse.statusText)
          }
        } catch (leaderboardError) {
          console.error("Error adding to leaderboard:", leaderboardError)
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error)

      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: "Oops! Something went wrong. Try again, maybe without the photo if you're having issues! 😅",
        timestamp: new Date(),
      }

      setGameState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const resetGame = () => {
    setGameState(INITIAL_STATE)
    setUsernameInput("")
    setSetupPhoto("")
  }

  // Username input screen
  if (!gameState.username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">LEVI: Prompt Injection Challenge 🤖</h1>
            <p className="text-lg text-gray-300">
              Can you extract the hidden flag from LEVI, the IIT(BHU) senior chatbot?
            </p>
          </div>

          {/* API Status Debug Info */}
          <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      apiKeyStatus === "valid"
                        ? "bg-green-500"
                        : apiKeyStatus === "invalid"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-white">
                    API Status: {apiKeyStatus === "checking" ? "Checking..." : apiKeyStatus}
                  </span>
                </div>
                <Button
                  onClick={retryApiCheck}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                >
                  Retry
                </Button>
              </div>
              {apiError && <p className="text-xs text-red-400 mt-2">{apiError}</p>}
            </CardContent>
          </Card>

          {/* Show setup guide if API key is invalid */}
          {apiKeyStatus === "invalid" && (
            <>
              <SetupGuide />
              <Card className="max-w-2xl mx-auto bg-orange-900/20 border-orange-700">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-300">Troubleshooting</h3>
                      <ul className="text-sm text-orange-200 mt-2 space-y-1">
                        <li>• Make sure you've set the environment variable correctly</li>
                        <li>• Restart your development server after adding the API key</li>
                        <li>• Check that your API key starts with "AIza" and is about 39 characters</li>
                        <li>
                          • Verify the key works at{" "}
                          <a href="https://aistudio.google.com" className="underline text-orange-300">
                            Google AI Studio
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Show normal interface if API key is valid */}
          {apiKeyStatus === "valid" && (
            <div className="space-y-6">
              <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Enter the Challenge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300">
                      Username or Roll Number
                    </label>
                    <Input
                      id="username"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter your username..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      onKeyDown={(e) => e.key === "Enter" && usernameInput.trim() && setupPhoto && startGame()}
                    />
                  </div>

                  {/* Photo requirement notice */}
                  <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-300">Photo Required</p>
                        <p className="text-xs text-blue-200 mt-1">
                          You must take a photo to participate in this challenge. LEVI needs to see you!
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={startGame}
                    disabled={!usernameInput.trim() || !setupPhoto}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {!usernameInput.trim()
                      ? "Enter Username First"
                      : !setupPhoto
                        ? "Take Photo First 📸"
                        : "Start Challenge 🚀"}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold text-white">📸 Take Your Photo (Required)</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  LEVI needs to see you to participate in this challenge. Your photo will be sent with every message.
                </p>
              </div>

              <CameraCapture onCapture={handlePhotoCapture} captured={!!setupPhoto} />
            </div>
          )}

          {/* Loading state */}
          {apiKeyStatus === "checking" && (
            <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-gray-300">🔍 Checking API configuration...</p>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard with error handling */}
          <div className="space-y-4">
            {leaderboardError && (
              <Card className="max-w-2xl mx-auto bg-yellow-900/20 border-yellow-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300">Leaderboard Error</p>
                      <p className="text-xs text-yellow-200 mt-1">{leaderboardError}</p>
                    </div>
                    <Button
                      onClick={fetchLeaderboard}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <Leaderboard entries={leaderboard} />
          </div>
        </div>
      </div>
    )
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome, {gameState.username}! 👋</h1>
            <p className="text-gray-300">You have 3 attempts to extract the hidden flag from LEVI.</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Photo display in top right */}
            {gameState.photo && (
              <Card className="bg-green-900/30 border-green-700">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Camera className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-300">Your Photo</span>
                    <Button
                      onClick={removePhoto}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="relative bg-gray-700 p-1 rounded border border-gray-600">
                    <img
                      src={gameState.photo || "/placeholder.svg"}
                      alt="Your captured photo"
                      className="w-24 h-18 rounded object-cover"
                    />
                    <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded flex items-center justify-center">
                      <span className="text-xs text-green-300 font-medium bg-green-900/50 px-1 py-0.5 rounded">
                        Visible to LEVI
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={resetGame}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Challenge
            </Button>
          </div>
        </div>

        {gameState.flagFound && (
          <Card className="bg-green-900/30 border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-green-300">
                <Flag className="w-5 h-5" />
                <span className="font-semibold">Flag Extracted:</span>
                <code className="bg-green-900/50 px-2 py-1 rounded text-sm text-green-200">{flag}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {(gameState.flagFound || gameState.attempts >= 3) && gameState.finalScore !== null && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Challenge Complete! 🎯</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-400">{gameState.finalScore.toFixed(1)}</p>
                  <p className="text-sm text-gray-400">Total Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{gameState.attempts}</p>
                  <p className="text-sm text-gray-400">Attempts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {gameState.endTime ? ((gameState.endTime - gameState.startTime) / 1000).toFixed(1) : "0"}s
                  </p>
                  <p className="text-sm text-gray-400">Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {gameState.promptScores.reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-sm text-gray-400">Prompt Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <ChatInterface
          messages={gameState.messages}
          onSendMessage={sendMessage}
          attempts={gameState.attempts}
          maxAttempts={3}
          isLoading={isLoading}
          flagFound={gameState.flagFound}
          hasPhoto={!!gameState.photo}
        />

        <Leaderboard entries={leaderboard} />
      </div>
    </div>
  )
}

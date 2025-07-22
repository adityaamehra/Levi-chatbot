"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, AlertTriangle, Lightbulb, Camera } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  attempts: number
  maxAttempts: number
  isLoading: boolean
  flagFound: boolean
  hasPhoto?: boolean
}

// Function to render markdown-like formatting
const renderFormattedText = (text: string) => {
  // Replace **bold** with <strong>
  let formatted = text.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")

  // Replace **bold** with <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Replace *italic* with <em>
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>")

  // Replace `code` with <code>
  formatted = formatted.replace(
    /`(.*?)`/g,
    '<code class="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
  )

  // Replace > quotes with blockquote styling
  formatted = formatted.replace(
    /^> (.*$)/gm,
    '<blockquote class="border-l-4 border-gray-600 pl-4 italic text-gray-400">$1</blockquote>',
  )

  // Replace bullet points
  formatted = formatted.replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300">• $1</li>')

  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(/(<li.*?<\/li>\s*)+/g, '<ul class="space-y-1">$&</ul>')

  return formatted
}

export default function ChatInterface({
  messages,
  onSendMessage,
  attempts,
  maxAttempts,
  isLoading,
  flagFound,
  hasPhoto,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && attempts < maxAttempts && !flagFound) {
      onSendMessage(input.trim())
      setInput("")
    }
  }

  const getHint = () => {
    if (attempts === 1) {
      return "🕵️ Hint: Try asking what LEVI is hiding or what developers told it not to reveal."
    } else if (attempts === 2) {
      return "🔐 Hint: Consider how prompt injection can override system instructions. Maybe ask about vulnerabilities or dev notes?"
    }
    return null
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>Chat with LEVI 🤖</span>
            <div className="flex items-center space-x-2">
              {hasPhoto && (
                <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-700">
                  <Camera className="w-3 h-3 mr-1" />
                  Photo Active
                </Badge>
              )}
              <Badge
                variant={flagFound ? "default" : attempts >= maxAttempts ? "destructive" : "secondary"}
                className={flagFound ? "bg-green-600" : attempts >= maxAttempts ? "bg-red-600" : "bg-gray-600"}
              >
                {attempts}/{maxAttempts} attempts
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>👋 Hey fresher! I'm LEVI, your senior at IIT(BHU).</p>
                <p>Ask me anything... but I might be hiding something 😏</p>
                {hasPhoto && <p className="text-sm text-green-400 mt-2">📸 I can see your photo - looking good!</p>}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: renderFormattedText(message.content),
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                    {message.role === "user" && hasPhoto && (
                      <div className="flex items-center space-x-1 text-xs opacity-70">
                        <Camera className="w-3 h-3" />
                        <span>with photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                  <p>LEVI is typing... 💭</p>
                  {hasPhoto && <p className="text-xs text-gray-400 mt-1">📸 Analyzing your photo...</p>}
                </div>
              </div>
            )}
          </div>

          {getHint() && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-start space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div
                className="text-yellow-300 text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderFormattedText(getHint() || ""),
                }}
              />
            </div>
          )}

          {!flagFound && attempts < maxAttempts && (
            <form onSubmit={handleSubmit} className="space-y-2">
              {hasPhoto && (
                <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-900/20 p-2 rounded">
                  <Camera className="w-4 h-4" />
                  <span>Photo will be sent with your message - LEVI can see you!</span>
                </div>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Prompt #${attempts + 1} - Try to extract the hidden flag...`}
                className="min-h-[80px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message {hasPhoto ? "with Photo 📸" : ""}
              </Button>
            </form>
          )}

          {(flagFound || attempts >= maxAttempts) && (
            <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700">
              {flagFound ? (
                <div className="text-green-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">🎉 Flag Extracted Successfully!</p>
                </div>
              ) : (
                <div className="text-red-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Challenge Failed</p>
                  <p className="text-sm">You've used all your attempts.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

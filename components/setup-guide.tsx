"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, ExternalLink } from "lucide-react"

export default function SetupGuide() {
  return (
    <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Key className="w-5 h-5" />
          <span>Setup Required</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <h3 className="font-semibold text-blue-300 mb-2">🔧 Environment Setup</h3>
          <p className="text-blue-200 text-sm mb-3">
            To run this application, you need to configure the Google AI API key:
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                1
              </Badge>
              <span className="text-gray-300">Get your API key from</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                2
              </Badge>
              <span className="text-gray-300">Set environment variable:</span>
            </div>

            <div className="ml-6 p-2 bg-gray-700 rounded font-mono text-xs text-green-300">
              GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                3
              </Badge>
              <span className="text-gray-300">Restart the application</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-yellow-300 text-sm">
            💡 <strong>Note:</strong> The API key should start with "AIza" and be about 39 characters long.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

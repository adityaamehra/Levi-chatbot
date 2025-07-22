"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"
import type { LeaderboardEntry } from "@/lib/database"

interface LeaderboardProps {
  entries: LeaderboardEntry[]
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case 1:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 2:
        return <Award className="w-5 h-5 text-amber-500" />
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-300">{index + 1}</span>
        )
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Trophy className="w-5 h-5" />
          <span>Leaderboard (Top 20)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No entries yet. Be the first to complete the challenge!</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={`${entry.username}-${entry.timestamp}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index < 3
                    ? "bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700"
                    : "bg-gray-700 border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(index)}
                  <div>
                    <p className="font-semibold text-white">{entry.username}</p>
                    <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    Score: {entry.totalScore.toFixed(1)}
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-600 text-gray-200">
                    {entry.attempts} attempts
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {entry.timeInSeconds.toFixed(1)}s
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

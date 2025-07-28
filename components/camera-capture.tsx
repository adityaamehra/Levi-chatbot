"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RotateCcw, X } from "lucide-react"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  captured: boolean
}

export default function CameraCapture({ onCapture, captured }: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const takePhoto = useCallback(async () => {
    setIsCapturing(true)
    setError(null)

    try {
      console.log("Starting one-click photo capture...")

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      console.log("Camera stream obtained")

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        // Set video stream
        video.srcObject = stream

        // Wait for video to be ready and capture
        video.onloadedmetadata = () => {
          console.log("Video ready, capturing photo...")

          // Set canvas dimensions
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw video frame to canvas
          if (context) {
            context.drawImage(video, 0, 0)

            // Get image data
            const imageData = canvas.toDataURL("image/jpeg", 0.8)
            console.log("Photo captured, data length:", imageData.length)

            // Set captured image
            setCapturedImage(imageData)
            onCapture(imageData)

            // Stop the stream
            stream.getTracks().forEach((track) => track.stop())
            setIsCapturing(false)
          }
        }

        // Start video
        video.play()
      }
    } catch (err) {
      console.error("Photo capture error:", err)
      setError("Camera access denied. Please allow camera permission and try again.")
      setIsCapturing(false)
    }
  }, [onCapture])

  const retakePhoto = useCallback(() => {
    console.log("Retaking photo...")
    setCapturedImage(null)
    onCapture("")
    setError(null)
  }, [onCapture])

  const removePhoto = useCallback(() => {
    console.log("Removing photo...")
    setCapturedImage(null)
    onCapture("")
    setError(null)
  }, [onCapture])

  // If we have a captured image, show it
  if (capturedImage) {
    return (
      <Card className="w-full max-w-md mx-auto bg-green-900/20 border-green-700">
        <CardContent className="p-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-300">Photo Captured Successfully!</span>
              <Button
                onClick={removePhoto}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            <div className="relative bg-gray-700 p-2 rounded-lg border border-gray-600">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured photo"
                className="w-full max-w-xs mx-auto rounded border object-cover"
                style={{ maxHeight: "200px" }}
              />
              <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded">✓ Ready</div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={retakePhoto}
                variant="outline"
                size="sm"
                className="flex-1 border-gray-600 text-white hover:bg-gray-700 bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="w-full h-48 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Ready to take photo</p>
            </div>
          </div>

          <Button
            onClick={takePhoto}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            disabled={isCapturing}
          >
            <Camera className="w-5 h-5 mr-2" />
            {isCapturing ? "Taking Photo..." : "Take Photo Now"}
          </Button>

          {/* Hidden video and canvas elements */}
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
    </Card>
  )
}

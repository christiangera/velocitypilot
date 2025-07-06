"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "./use-toast"

export function useAutomation(onCycleComplete?: () => void) {
  const [isRunning, setIsRunning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)
  const shouldStopRef = useRef(false)

  const runSingleAutomation = useCallback(async () => {
    if (isProcessing) {
      console.log("🔄 Automation cycle already in progress. Skipping.")
      return
    }

    // Check if we should stop before starting a new cycle
    if (shouldStopRef.current) {
      console.log("🛑 Stop requested, skipping automation cycle.")
      return
    }

    console.log("🚀 Starting automation cycle...")
    setIsProcessing(true)

    try {
      const response = await fetch("/api/automation/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const result = await response.json()
      console.log("✅ Automation cycle completed:", result)

      if (result.success && result.results.processed > 0) {
        toast({
          title: "🤖 Emails Processed",
          description: `Successfully created ${result.results.processed} new drafts.`,
        })
        // Notify parent component to refresh data
        onCycleComplete?.()
      }

      // Check if automation was stopped during processing
      if (result.results?.stopped) {
        console.log("🛑 Automation was stopped during email processing")
        setIsRunning(false)
        setIsStopping(false)
        isRunningRef.current = false
        shouldStopRef.current = false

        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        toast({
          title: "⏸️ Automation Stopped",
          description: "Email automation stopped after completing the current email.",
        })
      }
    } catch (error) {
      console.error("❌ Automation cycle failed:", error)
      toast({
        title: "❌ Automation Error",
        description: "An error occurred during the automation cycle.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      console.log("🏁 Finished automation cycle.")
    }
  }, [isProcessing, onCycleComplete])

  const start = useCallback(() => {
    if (isRunningRef.current) return
    console.log("▶️ Starting continuous automation...")

    setIsRunning(true)
    setIsStopping(false)
    isRunningRef.current = true
    shouldStopRef.current = false

    // Run immediately
    runSingleAutomation()

    // Then set up interval
    intervalRef.current = setInterval(() => {
      // Only run if we're not stopping
      if (!shouldStopRef.current) {
        runSingleAutomation()
      }
    }, 45000) // 45 seconds
  }, [runSingleAutomation])

  const stop = useCallback(() => {
    if (!isRunningRef.current) return

    console.log("⏹️ Stop requested for automation...")

    // If currently processing, mark for stop after current email
    if (isProcessing) {
      console.log("🔄 Automation cycle in progress. Will stop after current email completes...")
      setIsStopping(true)
      shouldStopRef.current = true

      // Send stop signal to the automation service via API
      fetch("/api/automation/stop", { method: "POST" }).catch(console.error)

      toast({
        title: "⏸️ Stopping Automation",
        description: "Automation will stop after the current email completes.",
      })
    } else {
      // Stop immediately if not processing
      console.log("⏹️ Stopping automation immediately...")
      setIsRunning(false)
      setIsStopping(false)
      isRunningRef.current = false
      shouldStopRef.current = false

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      toast({
        title: "⏸️ Automation Stopped",
        description: "Email automation has been turned off.",
      })
    }
  }, [isProcessing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isRunning,
    isProcessing,
    isStopping,
    start,
    stop,
  }
}

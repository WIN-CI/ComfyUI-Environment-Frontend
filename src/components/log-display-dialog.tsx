import React, { useEffect, useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Environment } from '@/types/Environment'
import { connectToLogStream } from '@/api/environmentApi'
import { ScrollArea } from "@/components/ui/scroll-area"

function parseLogs(input: string): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '\r') {
      console.log('Carriage return encountered')
      // Carriage return encountered, reset current line
      currentLine = '';
    } else if (char === '\n') {
      // Newline character, push the current line to lines array
      lines.push(currentLine);
      currentLine = '';
    } else {
      // Append character to current line
      currentLine += char;
    }
  }

  // If there's any remaining text in currentLine, add it to lines
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export interface LogDisplayDialogProps {
  children: React.ReactNode
  environment: Environment
}

export default function LogDisplayDialog({ children, environment }: LogDisplayDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [showResumeButton, setShowResumeButton] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const appendLog = (log: string) => {
      console.log(parseLogs(log))
      setLogs((prevLogs) => [...prevLogs, ...parseLogs(log)])
    }

    const disconnect = connectToLogStream(environment.id || "", appendLog)

    return () => {
      disconnect()
    }
  }, [isOpen, environment.id])

  // Clear logs when the dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setLogs([])
    }
  }, [isOpen])

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }, [logs, autoScroll])

  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
      const atBottom = scrollHeight - scrollTop - clientHeight <= 10 // Threshold for "at bottom"
      setAutoScroll(atBottom)
      setShowResumeButton(!atBottom)
    }
  }

  const resumeAutoScroll = () => {
    setAutoScroll(true)
    setShowResumeButton(false)
    logEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setLogs([])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] min-w-[70vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Environment Logs</DialogTitle>
        </DialogHeader>
        <div
          className="h-[60vh] border bg-black text-gray-300 p-4 overflow-y-auto"
          onScroll={handleScroll}
          ref={logContainerRef}
        >
          <div className="whitespace-pre-wrap">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
        {/* <ScrollArea 
          className="h-[60vh] border rounded-md bg-black text-gray-300 p-4"
          // onScrollCapture={handleScroll}
          onScroll={handleScroll}
          ref={logContainerRef}
          type="always"
        >
          <div className="whitespace-pre-wrap">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </ScrollArea> */}
        <DialogFooter className="flex justify-between items-center">
          {showResumeButton && (
            <Button onClick={resumeAutoScroll} variant="outline">
              Resume Auto-Scroll
            </Button>
          )}
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { connectToLogStream } from '@/api/environmentApi';
import React, { useEffect, useState, useRef } from 'react';

const LogDisplay: React.FC<{ environmentId: string }> = ({ environmentId }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showResumeButton, setShowResumeButton] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const appendLog = (log: string) => {
      setLogs((prevLogs) => [...prevLogs, log]);
    };

    const disconnect = connectToLogStream(environmentId, appendLog);

    return () => {
      disconnect();
    };
  }, [environmentId]);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 10; // Threshold for "at bottom"
      setAutoScroll(atBottom);
      setShowResumeButton(!atBottom);
    }
  };

  const resumeAutoScroll = () => {
    setAutoScroll(true);
    setShowResumeButton(false);
    logEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  return (
    <div>
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        style={{
          whiteSpace: 'pre-wrap',
          overflowY: 'auto',
          height: '60vh',
          border: '1px solid #ccc',
          backgroundColor: 'black',
          color: 'lightgray',
          padding: '10px',
        }}
      >
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
        <div ref={logEndRef} />
      </div>
      {showResumeButton ? (
        <button onClick={resumeAutoScroll} style={{ marginTop: '10px' }}>
          Resume Auto-Scroll
        </button>
      ) : (
        <div style={{ height: '34px', marginTop: '0px' }}></div>
      )}
    </div>
  );
};

export default LogDisplay;

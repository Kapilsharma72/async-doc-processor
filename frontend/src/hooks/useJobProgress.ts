import { useEffect, useRef, useState } from "react";
import { ProgressEvent } from "@/types";
import { api } from "@/lib/api";

type ProgressEventWithHeartbeat = ProgressEvent & { job_id?: string };

export function useJobProgress(jobId: string | null, active: boolean) {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [done, setDone] = useState(false);

  const reconnectAttemptsRef = useRef(0);
  const closedManuallyRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!jobId || !active) return;

    closedManuallyRef.current = false;
    setDone(false);
    setEvents([]);
    reconnectAttemptsRef.current = 0;
    seenRef.current = new Set();

    let es: EventSource | null = null;
    let timeoutId: number | undefined;

    const connect = () => {
      if (!jobId) return;
      if (done) return;

      try {
        es = api.streamProgress(jobId);

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data) as ProgressEventWithHeartbeat;

            // Ignore internal heartbeats.
            if (data.event === "heartbeat") return;

            const key = `${data.job_id || jobId}:${data.event}:${data.message || ""}`;
            if (seenRef.current.has(key)) return;
            seenRef.current.add(key);

            const normalized: ProgressEvent = {
              job_id: data.job_id || jobId,
              event: data.event,
              stage: data.stage,
              message: data.message,
            };

            setEvents((prev) => [...prev, normalized]);

            if (normalized.event === "job_completed" || normalized.event === "job_failed") {
              setDone(true);
              es?.close();
            }
          } catch {
            // Ignore malformed SSE payloads.
          }
        };

        es.onerror = () => {
          es?.close();
          if (closedManuallyRef.current) return;
          if (done) return;

          reconnectAttemptsRef.current += 1;
          const attempt = reconnectAttemptsRef.current;
          const backoffMs = Math.min(10000, 500 * Math.pow(2, attempt));

          timeoutId = window.setTimeout(() => {
            connect();
          }, backoffMs);
        };
      } catch {
        reconnectAttemptsRef.current += 1;
      }
    };

    connect();

    return () => {
      closedManuallyRef.current = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      es?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, active]);

  return { events, done };
}


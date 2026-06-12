import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DocumentListItem } from "@/types";

export function useJobs(status?: string, search?: string) {
  const [jobs, setJobs] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.listDocuments(status, search);
      setJobs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [status, search]);
  useEffect(() => {
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [status, search]);

  return { jobs, loading, fetchJobs };
}

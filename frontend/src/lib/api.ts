const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = {
  async uploadDocuments(files: File[]) {
    const form = new FormData();
    files.forEach(f => form.append("files", f));
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  async listDocuments(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`${BASE_URL}/documents/?${params}`);
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  },

  async getDocument(id: string) {
    const res = await fetch(`${BASE_URL}/documents/${id}`);
    if (!res.ok) throw new Error("Not found");
    return res.json();
  },

  async retryJob(id: string) {
    const res = await fetch(`${BASE_URL}/documents/${id}/retry`, { method: "POST" });
    if (!res.ok) throw new Error("Retry failed");
    return res.json();
  },

  async updateReview(id: string, reviewed_data: Record<string, unknown>) {
    const res = await fetch(`${BASE_URL}/documents/${id}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed_data }),
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  },

  async finalizeDocument(id: string) {
    const res = await fetch(`${BASE_URL}/documents/${id}/finalize`, { method: "POST" });
    if (!res.ok) throw new Error("Finalize failed");
    return res.json();
  },

  exportUrl(id: string, format: "json" | "csv") {
    return `${BASE_URL}/documents/${id}/export?format=${format}`;
  },

  streamProgress(jobId: string) {
    return new EventSource(`${BASE_URL}/progress/${jobId}/stream`);
  }
};

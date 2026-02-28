import { useState } from 'react';
import { apiClient } from '../../../lib/api';

// Define the props for the DownloadButton component
interface DownloadButtonProps {
    uploadId: string;
}

// Add state to store the download Metadata
type DownloadMeta = {
  fileName: string;
  fileSize: string;
  virusScanStatus: string;
  downloadCount: number;
  downloadUrl: string;
};

export default function DownloadButton({ uploadId }: DownloadButtonProps) {
    // State to manage loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State to store the download metadata
    const [meta, setMeta] = useState<DownloadMeta | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Add Progress states
    const [progressPct, setProgressPct] = useState<number | null>(null);
    const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
    const [totalBytes, setTotalBytes] = useState<number | null>(null);

    // Updated function to fetch the download metadata with progress tracking
    const downloadWithProgress = async (url: string, fileName: string) => {
        // Reset progress and error states before starting the download
        setError(null);
        setProgressPct(0);
        setDownloadedBytes(0);
        setTotalBytes(null);

        // Start the download process
        const res = await apiClient(url, { method: "GET" });

        // Check if the response is successful
        if (!res.ok) {
            throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
        }

        // Get the total file size from the Content-Length header if available
        const lenHeader = res.headers.get('content-length');
        const total = lenHeader ? Number(lenHeader) : null;

        // If total size is available and valid, set it in state
        if (total && !Number.isNaN(total)) {
            setTotalBytes(total);
        }

        // Fallback if stream is not supported, download without progress
        if (!res.body || typeof res.body.getReader !== 'function') {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Create an invisible link and click it to trigger the download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();

            // Revoke the object URL after the download is triggered
            URL.revokeObjectURL(blobUrl);
            setProgressPct(null);
            return;
        }

        // Stream the response and track progress
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;

        // Read the response stream in chunks
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // If we received a chunk, add it to the array and update progress
            if (value) {
                chunks.push(value);
                received += value.length;

                setDownloadedBytes(received);

                if (total && !Number.isNaN(total)) {
                    setProgressPct(Math.round((received / total) * 100));
                } else {
                    setProgressPct(null);
                }
            }
        }

        // Combine the chunks into a single Blob and trigger the download
        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(blobUrl);
        setProgressPct(100);
    };

    // Function to fetch the download metadata when the button is clicked
    const handleFetchMeta = async () => {
  try {
    setLoading(true);
    setError(null);

    // Fetch the download metadata from the API
    const response = await apiClient(`/api/admin/uploads/${uploadId}/download`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch download info: ${response.statusText}`);
    }

    // Parse the response JSON to get the metadata
    const data: DownloadMeta = await response.json();
    setMeta(data);
    setConfirmOpen(true);
  } catch (err) {
    setError(err instanceof Error ? err.message : "An unknown error occurred");
  } finally {
    setLoading(false);
  }
};

    // Function to handle the download process
    const triggerDownload = async () => {
        if (!meta) return;

        // Check virus scan status before allowing download
        const status = (meta.virusScanStatus || "").toLowerCase();
            if (status.includes("infect")) {
                setError("This file failed virus scanning and cannot be downloaded.");
            return;
        }

        // If the file is clean or status is unknown, proceed with the download
        try {
            setLoading(true);
            await downloadWithProgress(meta.downloadUrl, meta.fileName || "download");
                setConfirmOpen(false);
        }   catch (err) {
                setError(err instanceof Error ? err.message : "Download failed");
        }   finally {
                setLoading(false);
        }
}

    // Render the download button and any error messages
    return (
        <div>
            {!confirmOpen && (
                <button onClick={handleFetchMeta} disabled={loading}>
                    {loading ? 'Loading...' : 'Download'}
                </button>
                )}

            {error && <p style={{ color: 'red' }}>{error}</p>}

             {confirmOpen && meta && (
        <div style={{ marginTop: 8, border: 'none', padding: 8 }}>
          <div>
            <strong>{meta.fileName}</strong>
          </div>
          <div>Size: {meta.fileSize}</div>
          <div>Virus scan: {meta.virusScanStatus}</div>
          { loading && (
            <div style={{ marginTop: 8 }}>
                {progressPct !== null ? (
                    <div>Downloading... {progressPct}%</div>
                ) : (
                    <div>Downloading...</div>
                )}

                {totalBytes !== null ? (
                    <div style={{ fontSize: 12 }}>
                        {downloadedBytes} / {totalBytes} bytes
                    </div> 
                ) : ( 
                    <div style={{ fontSize: 12 }}>{downloadedBytes} bytes downloaded</div>
                 )}
            </div>
            )}

          <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
            <button style={{ backgroundColor: 
                '#22ABAB', 
                color: '#c9fefa', 
                border: 'none', 
                padding: '8px 12px', 
                borderRadius: '7px' }}

                onClick={triggerDownload}
                disabled={loading}>
                Confirm
            </button>
            <button
            style={{ backgroundColor: 
                '#c9fefa', 
                color: '#22ABAB', 
                border: 'none', 
                padding: '8px 12px', 
                borderRadius: '7px' }}

              onClick={() => {
                setConfirmOpen(false);
                setMeta(null);
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
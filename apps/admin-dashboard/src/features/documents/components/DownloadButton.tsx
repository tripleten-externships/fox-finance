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

    // Function to fetch the download metadata
    const handleFetchMeta = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient(`/api/admin/uploads/${uploadId}/download`, {
                    method: "GET",
                });

            if (!response.ok) {
                throw new Error(`Failed to fetch download info: ${response.statusText}`);
            }

            const data: DownloadMeta = await response.json();

            setMeta(data);
            setConfirmOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Function to handle the download process
    const triggerDownload = () => {
        if (!meta) return;

        // Block the download if the virus scan status indicates an infection
        const status = (meta.virusScanStatus || "").toLowerCase();
        if (status.includes("infect")) {
            setError('This file failed virus scanning and cannot be downloaded.');
            return;
        } 

            // Create invisible link and click it to trigger download
            const link = document.createElement('a');
            link.href = meta.downloadUrl;
            link.download = meta.fileName || ''; // Using the filename from the response or an empty string if not available
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setConfirmOpen(false);
    };

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

          <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
            <button style={{ backgroundColor: 
                '#22ABAB', 
                color: '#c9fefa', 
                border: 'none', 
                padding: '8px 12px', 
                borderRadius: '7px' }}

                onClick={triggerDownload}>
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
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
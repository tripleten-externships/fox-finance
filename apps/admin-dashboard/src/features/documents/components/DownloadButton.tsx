import { useState } from 'react';
import { apiClient } from '../../../lib/api';

// Define the props for the DownloadButton component
interface DownloadButtonProps {
    uploadId: string;
}

export default function DownloadButton({ uploadId }: DownloadButtonProps) {
    // State to manage loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Function to handle the download process
    const handleDownload = async () => {
        // Reset error state before starting the download
        try {
            setLoading(true);
            setError(null);

            // Fetch the download URL from the backend
            const response = await apiClient(
                `/api/admin/uploads/${uploadId}/download`,
                {
                    method: "GET",
                }
            );


            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`Failed to fetch download URL: ${response.statusText}`);
            }

            const data = await response.json();

            // Create invisible link and click it to trigger download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.filename || ''; // Using the filename from the response or an empty string if not available
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }    
    };

    return (
        <div>
            <button onClick={handleDownload} disabled={loading}>
                {loading ? 'Downloading...' : 'Download'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
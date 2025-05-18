'use client';

interface PDFViewerProps {
  fileUrl: string;
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  // Check if URL is valid (starts with http or /)
  const isValidUrl = fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('/'));
  
  if (!isValidUrl) {
    return (
      <div className="w-full h-96 border border-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">PDF preview not available. Please download the file to view.</p>
      </div>
    );
  }

  // For PDFs, using an embed tag is one of the most reliable options
  return (
    <div className="w-full h-96">
      <embed 
        src={fileUrl}
        type="application/pdf"
        width="100%"
        height="100%"
        className="border border-gray-200 rounded-lg"
      />
    </div>
  );
}
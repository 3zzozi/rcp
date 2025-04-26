"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HomeworkSubmissionFormProps = {
  homeworkId: string;
  lectureId: string;
  curriculumId: string;
};

export default function HomeworkSubmissionForm({
  homeworkId,
  lectureId,
  curriculumId,
}: HomeworkSubmissionFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!file) {
        throw new Error("Please upload a PDF file");
      }

      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        throw new Error("Only PDF files are accepted");
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append("homeworkId", homeworkId);
      formData.append("file", file);

      console.log("Submitting homework:", {
        homeworkId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch("/api/homework-submission", {
        method: "POST",
        body: formData,
      });

      // First try to parse as JSON, but have a fallback for non-JSON responses
      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON response (like HTML error pages)
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to submit homework");
      }

      // Success - redirect back to lecture view
      router.push(`/dashboard/student/curriculum/${curriculumId}/lecture/${lectureId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "An error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Clear any previous error related to file selection
      if (error === "Please upload a PDF file" || error === "Only PDF files are accepted") {
        setError("");
      }
      
      // Validate file type immediately
      if (selectedFile.type !== 'application/pdf') {
        setError("Only PDF files are accepted");
      }
    } else {
      setFile(null);
      setFileName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload Your PDF Assignment
        </label>
        
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
            <span>{file ? "Change File" : "Select File"}</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          
          {fileName && (
            <span className="text-sm text-gray-600">{fileName}</span>
          )}
        </div>
        
        <p className="text-sm text-gray-500">
          Please upload your completed assignment as a PDF file.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !file || file.type !== 'application/pdf'}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Uploading..." : "Submit Assignment"}
      </button>
    </form>
  );
}
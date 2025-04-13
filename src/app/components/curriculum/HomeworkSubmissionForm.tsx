// src/app/components/curriculum/HomeworkSubmissionForm.tsx
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

      const response = await fetch("/api/homework-submission", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit homework");
      }

      // Redirect back to lecture view
      router.push(`/dashboard/student/curriculum/${curriculumId}/lecture/${lectureId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Your PDF Assignment
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          className="w-full border border-gray-300 p-2 rounded-md"
        />
        <p className="text-sm text-gray-500 mt-1">
          Please upload your completed assignment as a PDF file.
        </p>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Uploading..." : "Submit PDF"}
        </button>
      </div>
    </form>
  );
}
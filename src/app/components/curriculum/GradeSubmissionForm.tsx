"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type GradeSubmissionFormProps = {
  submissionId: string;
  currentGrade: number | null;
  homeworkId: string;
};

export default function GradeSubmissionForm({
  submissionId,
  currentGrade,
  homeworkId,
}: GradeSubmissionFormProps) {
  const router = useRouter();
  const [grade, setGrade] = useState<string>(currentGrade !== null ? currentGrade.toString() : "");
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      console.log('Submitting grade:', {
        submissionId,
        grade: grade ? Number(grade) : null,
        feedback
      });

      const response = await fetch(`/api/homework-submission/${submissionId}/grade`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade: grade ? Number(grade) : null,
          feedback,
        }),
      });

      // Log status for debugging
      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to grade submission");
      }

      // Redirect back to homework submissions page
      router.push(`/dashboard/teacher/homework/${homeworkId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error grading submission:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Validate grade input
  const validateGrade = (value: string) => {
    if (!value) {
      setGrade("");
      return;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return; // Don't update for non-numeric input
    }
    
    if (numValue < 0) {
      setGrade("0");
    } else if (numValue > 100) {
      setGrade("100");
    } else {
      setGrade(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
          Grade (0-100)
        </label>
        <input
          type="number"
          id="grade"
          min="0"
          max="100"
          value={grade}
          onChange={(e) => validateGrade(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave empty for no grade
        </p>
      </div>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
          Feedback (optional)
        </label>
        <textarea
          id="feedback"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Provide feedback to the student..."
        ></textarea>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Grade"}
        </button>
      </div>
    </form>
  );
}
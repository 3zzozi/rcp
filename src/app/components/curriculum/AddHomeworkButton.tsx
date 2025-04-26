"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Define the correct enum values from your schema
enum HomeworkType {
  MCQ = "MCQ",
  TEXT = "TEXT",
  FILE_UPLOAD = "FILE_UPLOAD"
}

type AddHomeworkButtonProps = {
  lectureId: string;
};

export default function AddHomeworkButton({ lectureId }: AddHomeworkButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Format the data for the API - using the correct enum value
    const homeworkData = {
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      type: HomeworkType.FILE_UPLOAD, // Use the correct enum value
      lectureId,
    };

    console.log("Sending homework data:", homeworkData);
  
    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(homeworkData),
      });
  
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        throw new Error("Server returned an invalid response");
      }
      
      if (!response.ok) {
        console.error("Server error response:", data);
        throw new Error(
          data.error || data.message || `Failed to create homework: ${response.status}`
        );
      }
  
      // Reset form and close modal
      setTitle("");
      setDescription("");
      setDueDate("");
      setIsOpen(false);
      
      // Refresh the page to show the new homework
      router.refresh();
    } catch (err: any) {
      console.error("Error details:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center text-sm px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Add Homework
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Homework Assignment</h2>
            
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Instructions for students..."
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Homework"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
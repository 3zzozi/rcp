// src/app/components/curriculum/HomeworkEditForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HomeworkProps = {
  homework: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    type: string;
  };
  lectureId: string;
  curriculumId: string;
};

export default function HomeworkEditForm({ homework, lectureId, curriculumId }: HomeworkProps) {
  const router = useRouter();
  const [title, setTitle] = useState(homework.title);
  const [description, setDescription] = useState(homework.description || "");
  const [dueDate, setDueDate] = useState(
    homework.dueDate ? new Date(homework.dueDate).toISOString().split("T")[0] : ""
  );
  const [type, setType] = useState(homework.type);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/homework/${homework.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          type,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update homework");
      }

      // Redirect back to lecture view
      router.push(`/dashboard/teacher/curriculum/${curriculumId}/lecture/${lectureId}`);
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="TEXT">Text Submission</option>
            <option value="FILE">File Upload</option>
            <option value="MCQ">Multiple Choice</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/teacher/curriculum/${curriculumId}/lecture/${lectureId}`)}
            className="mr-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteCurriculumButtonProps {
  curriculumId: string;
}

export default function DeleteCurriculumButton({ curriculumId }: DeleteCurriculumButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = async () => {
    try {
      console.log("Deleting curriculum:", curriculumId);
      setIsDeleting(true);
      
      const response = await fetch(`/api/curriculum/${curriculumId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete curriculum");
      }

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error deleting curriculum:", error);
      alert("Failed to delete curriculum. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        className="text-red-600 hover:text-red-900"
        type="button"
      >
        Delete
      </button>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowConfirmation(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Delete Curriculum</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this curriculum? This will also delete all lectures, homeworks, and student enrollments.
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CurriculumActionsProps {
  curriculumId: string;
}

export default function CurriculumActions({ curriculumId }: CurriculumActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOpenConfirmation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Opening confirmation dialog");
    setShowConfirmation(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log("Deleting curriculum:", curriculumId);
      setIsDeleting(true);
      
      const response = await fetch(`/api/curriculum/${curriculumId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete curriculum");
      }

      console.log("Delete successful");
      
      // Refresh the current page
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
    <div className="flex space-x-4">
      <Link
        href={`/dashboard/teacher/curriculum/${curriculumId}`}
        className="text-indigo-600 hover:text-indigo-900"
      >
        View
      </Link>
      <Link
        href={`/dashboard/teacher/curriculum/${curriculumId}/edit`}
        className="text-blue-600 hover:text-blue-900 flex items-center"
      >
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Link>
      <button
        onClick={handleOpenConfirmation}
        className="text-red-600 hover:text-red-900 flex items-center cursor-pointer"
        type="button"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </button>

      {/* Portal for confirmation dialog */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" 
          onClick={(e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            setShowConfirmation(false);
          }}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <h3 className="text-lg font-semibold mb-4">Delete Curriculum</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this curriculum? This will also delete all lectures, homeworks, and student enrollments.
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmation(false);
                }}
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
    </div>
  );
}
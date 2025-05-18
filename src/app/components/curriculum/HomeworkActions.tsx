'use client';

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type DeleteHomeworkButtonProps = {
  homeworkId: string;
  redirectUrl?: string;
  buttonStyle?: "icon" | "button" | "link";
};

export default function DeleteHomeworkButton({ 
  homeworkId, 
  redirectUrl,
  buttonStyle = "icon" 
}: DeleteHomeworkButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Function to handle delete action
  const handleDelete = async () => {
    try {
      console.log("Delete initiated for homework:", homeworkId);
      setIsDeleting(true);
      
      const response = await fetch(`/api/homework/${homeworkId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete homework");
      }

      console.log("Delete successful, response:", data);

      // Redirect if URL provided
      if (redirectUrl) {
        console.log("Redirecting to:", redirectUrl);
        router.push(redirectUrl);
      } else {
        // Refresh the page to update the UI
        console.log("Refreshing the page");
        router.refresh();
      }
      
      // Close the confirmation dialog
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error deleting homework:", error);
      alert("Failed to delete homework. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Render different button styles
  const renderButton = () => {
    switch (buttonStyle) {
      case "button":
        return (
          <button
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-900 bg-white border border-red-300 rounded-md hover:bg-red-50"
            onClick={() => setShowConfirmation(true)}
            disabled={isDeleting}
            type="button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        );
      case "link":
        return (
          <button
            className="flex items-center text-red-600 hover:text-red-900 font-medium"
            onClick={() => setShowConfirmation(true)}
            disabled={isDeleting}
            type="button"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </button>
        );
      case "icon":
      default:
        return (
          <button
            className="text-red-600 hover:text-red-900"
            aria-label="Delete homework"
            onClick={() => setShowConfirmation(true)}
            disabled={isDeleting}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}

      {/* Modal confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowConfirmation(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Delete Homework</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this homework? This will also delete all student submissions.
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
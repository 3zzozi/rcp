"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type DeleteHomeworkButtonProps = {
  homeworkId: string;
  onSuccess?: () => void;
  redirectUrl?: string;
  buttonStyle?: "icon" | "button" | "link";
};

export default function DeleteHomeworkButton({ 
  homeworkId, 
  onSuccess, 
  redirectUrl,
  buttonStyle = "icon" 
}: DeleteHomeworkButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/homework/${homeworkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete homework");
      }

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect if URL provided
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // Refresh the page to update the UI
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting homework:", error);
      alert("Failed to delete homework. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
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
          >
            <Trash2 className="h-4 w-4" />
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Delete Homework</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this homework assignment? This will also delete all student submissions.
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
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
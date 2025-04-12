'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';

interface AddAttachmentButtonProps {
  lectureId: string;
}

export function AddAttachmentButton({ lectureId }: AddAttachmentButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create FormData object to send the file
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('lectureId', lectureId);
      formDataToSend.append('file', file);
      
      const res = await fetch('/api/attachment', {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header, browser will set it with boundary for FormData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload attachment');
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
      });
      setFile(null);
      setShowModal(false);
      
      // Refresh the page
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Resource
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Resource</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Additional Reading"
                />
              </div>
              
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex items-center">
                  <label 
                    htmlFor="file" 
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Upload className="h-5 w-5 inline mr-2" />
                    Upload File
                    <input
                      id="file"
                      name="file"
                      type="file"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  {file && (
                    <span className="ml-3 text-sm text-gray-600">
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
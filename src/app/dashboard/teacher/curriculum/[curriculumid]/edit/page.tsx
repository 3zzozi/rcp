'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import React from 'react';

interface CurriculumFormData {
  title: string;
  description: string;
}

interface PageProps {
  params: Promise<{ curriculumid: string }>;
}

export default function EditCurriculumPage({ params }: PageProps) {
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const curriculumId = resolvedParams.curriculumid;
  
  const router = useRouter();
  const [formData, setFormData] = useState<CurriculumFormData>({
    title: '',
    description: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch curriculum data
  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching curriculum data for ID:", curriculumId);
        // Note the API endpoint uses 'id' not 'curriculumid'
        const response = await fetch(`/api/curriculum/${curriculumId}`);
        
        if (!response.ok) {
          console.error("API response error:", response.status, response.statusText);
          throw new Error('Failed to fetch curriculum');
        }
        
        const data = await response.json();
        console.log("Curriculum data received:", data);
        
        setFormData({
          title: data.title || '',
          description: data.description || '',
        });
      } catch (error) {
        console.error('Error fetching curriculum:', error);
        setError('Failed to load curriculum data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (curriculumId) {
      fetchCurriculum();
    }
  }, [curriculumId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      console.log("Updating curriculum:", curriculumId, formData);
      
      // Note the API endpoint uses 'id' not 'curriculumid'
      const response = await fetch(`/api/curriculum/${curriculumId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error("Update failed:", response.status, data);
        throw new Error(data.error || 'Failed to update curriculum');
      }
      
      setSuccessMessage('Curriculum updated successfully');
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push(`/dashboard/teacher/curriculum/${curriculumId}`);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error updating curriculum:', error);
      setError('Failed to update curriculum. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/teacher/curriculum/${curriculumId}`}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Curriculum
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Curriculum</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href={`/dashboard/teacher/curriculum/${curriculumId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
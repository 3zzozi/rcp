'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface JoinCurriculumFormProps {
  studentId: string;
}

export function JoinCurriculumForm({ studentId }: JoinCurriculumFormProps) {
  const router = useRouter();
  const [curriculumCode, setCurriculumCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!curriculumCode.trim()) {
      setError('Please enter a curriculum code');
      return;
    }
    
    try {
      setLoading(true);
      
      const res = await fetch('/api/curriculum/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: curriculumCode,
          studentId,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join curriculum');
      }
      
      // Refresh the page to show the new curriculum
      router.refresh();
      
      // Reset the form
      setCurriculumCode('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Search className="h-5 w-5 mr-2" />
          Join Curriculum
        </button>
      ) : (
        <div className="relative">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <div>
              <input
                type="text"
                value={curriculumCode}
                onChange={(e) => setCurriculumCode(e.target.value)}
                placeholder="Enter curriculum code"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError('');
                setCurriculumCode('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
'use client';

import React from 'react';
import DeleteHomeworkButton from './DeleteHomeworkButton';

interface DeleteButtonWrapperProps {
  homeworkId: string;
  curriculumId: string;
  lectureId: string;
}

export default function DeleteButtonWrapper({ 
  homeworkId, 
  curriculumId, 
  lectureId 
}: DeleteButtonWrapperProps) {
  return (
    <DeleteHomeworkButton 
      homeworkId={homeworkId}
      redirectUrl={`/dashboard/teacher/curriculum/${curriculumId}/lecture/${lectureId}`}
      buttonStyle="link"
    />
  );
}
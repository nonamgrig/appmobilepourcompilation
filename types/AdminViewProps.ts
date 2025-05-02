import React from 'react';
export interface AdminViewProps {
  orientationHorizontal: boolean;
  back: () => void;
  forwards: () => void;
  displayNotif: (text: string, type?:"message" | "error") => void;
}
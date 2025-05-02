import React from 'react';
export type PreSimulationViewProps = {
  back: () => void,
  forwards: () => void;
  orientationHorizontal: any;
  displayNotif: (text: string, type?:"message" | "error") => void;
}
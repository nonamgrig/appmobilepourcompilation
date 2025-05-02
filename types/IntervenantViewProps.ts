import React from 'react';
import { Action } from './Actions';
import { StyleProp, ViewStyle } from 'react-native';

export type IntervenantViewProps = {
  orientationHorizontal: any,
  goAdmin: () => void,
  appendAction: (action:Action) => void,
  displayNotif: (text: string, type?:"message" | "error") => void;
  nfcMessage: string,
}
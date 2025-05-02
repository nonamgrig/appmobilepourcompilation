import React from 'react';

export type IntervenantItem = {
  intervenantID: string,
  nom: string,
  class: "med"|"paramed"|"secouriste",
};

export type IntervenantsListProps = {
  showModal:boolean,
  setShowModal:React.Dispatch<boolean>,
  closeAllModals: () => void
};
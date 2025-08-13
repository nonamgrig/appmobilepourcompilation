import React from 'react';

export type IntervenantItem = {
  intervenantID: string,
  nom: string,
  class: "obs"|"med"|"paramed"|"secouriste",
};

export type IntervenantsListProps = {
  showModal:boolean,
  setShowModal:React.Dispatch<boolean>,
  closeAllModals: () => void
};

export type PlastronModelItem = {
    documentId: string,
    type: "start"|"pause"|"stop",
    timer: number,
    event: {
        modele: any
        documentId: string,
        type: "start"|"action",
        action?:{
            documentId: string,
            nom: string
        }
    },
    trend:{
        documentId: string,
        valeur: number, // Quantité modifiée à chaque tours, positif ou négatif
        cible: number, // cible vers laquelle on se dirige, on ne peux pas la dépasser avec cette tendance
        variablephysio: {
            documentId: string,
            nom: string
        }
    }
}

export type EventPlastron = {
  modele: any;
  documentId: string;
  type: "start" | "action";
  action?: {
    documentId: string;
    nom: string;
  };
};
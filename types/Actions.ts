export type Action = {
    documentId: string, // UID
    nom: string,
    med: boolean,
    paramed: boolean,
    secouriste: boolean,
    categorie:{
        documentId: string,
        nom: string,
        index: number, // UID
    }
};

export type ActionPlastron = {
    documentId: string, // UID
    type: string,
    action : {
        documentId : string, 
        nom : string
    }
};
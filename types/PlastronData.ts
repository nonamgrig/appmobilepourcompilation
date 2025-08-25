export type PlastronPhysVar = {
    valeur_defaut: number,
    valeur?: number,
    min: number,
    max: number,
    documentId: string,
    color: string,
    nom: string
};

export type PlastronData = {
    [x: string]: any;
    documentId: string, // Hidden UID
    index: number, // Displayed UID
    scenario: {
        [x: string]: string | undefined;
        titre: string, 
        description : string,
    }
    profil: {
        variablesPhysio?: PlastronPhysVar[],
        age: number,
    },
    modele:{
        documentId: string,
        triage?: string,
        titre: string,
        description?: string,
        description_cachee?: string,
        examen?: string, 
    }
};

export type ScenarioData = {
    documentId: string, // Hidden UID
    titre: string, 
    description : string,
    dateId : string, 
};
export type ExamenRetexItem = {
  id : number|string,
  attributes: {
    plastronID: string,
    action: string,
    dateMiseAJour: string, // Same as dateExamen but in a string
    intervenantID: string,
  },
  dateExamen: Date,
  randomIdentifyer: number // Allows to (quasi)-uniquely identify each item
};

export type PhysVarsRetexItem = {
  id : number|string,
  attributes:{
    plastronID: string,
    physVars: string,
    dateMiseAJour: string,
  },
  randomIdentifyer: number // Allows to (quasi)-uniquely identify each item
}
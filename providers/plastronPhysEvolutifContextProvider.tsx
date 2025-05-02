import React, { useState, createContext } from 'react';

import { PlastronPhysVar } from '../types/PlastronData';

interface PlastronPhysVarContextType {
    plastronPhysEvolutif: PlastronPhysVar[];
    setPlastronPhysEvolutif: React.Dispatch<React.SetStateAction<PlastronPhysVar[]>>;
}


export const PlastronPhysEvolutifContext = createContext<PlastronPhysVarContextType>({} as PlastronPhysVarContextType);
const PlastronPhysEvolutifContextProvider = (props:any) => {
    const [plastronPhysEvolutif, setPlastronPhysEvolutif] = useState<PlastronPhysVar[]>([] as PlastronPhysVar[]);
    return (
        <PlastronPhysEvolutifContext.Provider value={{plastronPhysEvolutif, setPlastronPhysEvolutif}}>
        	{props.children}
        </PlastronPhysEvolutifContext.Provider>
    );
}
export default PlastronPhysEvolutifContextProvider;
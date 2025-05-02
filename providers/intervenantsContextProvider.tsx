import React, { useState, createContext } from 'react';
import { IntervenantItem } from '../types/IntervenantsList';

interface IntervenantListContextType {
    intervenantsList: IntervenantItem[];
    setIntervenantsList: React.Dispatch<React.SetStateAction<IntervenantItem[]>>;
};

export const IntervenantsListContext = createContext<IntervenantListContextType>({} as IntervenantListContextType);

const IntervenantsListContextProvider = (props:any) => {
    const [intervenantsList, setIntervenantsList] = useState<IntervenantItem[]>([]);
    return (
        <IntervenantsListContext.Provider value={{ 
            intervenantsList: intervenantsList,
            setIntervenantsList: setIntervenantsList
        }}>
        	{props.children}
        </IntervenantsListContext.Provider>
    );
}
export default IntervenantsListContextProvider;
import React, { useState, createContext } from 'react';
import { PlastronData } from '../types/PlastronData';


interface PlastronDataContextType {
    plastronData: PlastronData|null;
    setPlastronData: React.Dispatch<React.SetStateAction<PlastronData|null>>;
}

// The plastron data context contains information about the plastron and the initial state of it's physiological variables.
export const PlastronDataContext = createContext<PlastronDataContextType>({} as PlastronDataContextType);
const PlastronDataContextProvider = (props:any) => {
    const [plastronData, setPlastronData] = useState<PlastronData|null>(null);
    return (
        <PlastronDataContext.Provider value={{ plastronData, setPlastronData }}>
        	{props.children}
        </PlastronDataContext.Provider>
    );
}
export default PlastronDataContextProvider;
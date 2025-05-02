import React, { useState, createContext } from 'react';

import { PlastronModelItem } from '../types/Model';

type ModelPlastronContextType = {
    modelPlastron: PlastronModelItem[];
    setModelPlastron: React.Dispatch<React.SetStateAction<PlastronModelItem[]>>;
};

export const ModelPlastronContext = createContext<ModelPlastronContextType>({} as ModelPlastronContextType);

const ModelPlastronContextProvider = (props:any) => {
    const [modelPlastron, setModelPlastron] = useState<PlastronModelItem[]>([]);
    return (
        <ModelPlastronContext.Provider value={{ modelPlastron, setModelPlastron }}>
        	{props.children}
        </ModelPlastronContext.Provider>
    );
}
export default ModelPlastronContextProvider;
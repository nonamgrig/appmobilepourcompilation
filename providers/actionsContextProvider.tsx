import React, { useState, createContext } from 'react';
import { Action } from '../types/Actions';



type ActionsContextType = {
    actions: Action[];
    setActions: React.Dispatch<React.SetStateAction<Action[]>>;
};

export const ActionsContext = createContext<ActionsContextType>({} as ActionsContextType);

const ActionsContextProvider = (props:any) => {
    const [actions, setActions] = useState<Action[]>([]);
    return (
        <ActionsContext.Provider value={{ actions, setActions }}>
        	{props.children}
        </ActionsContext.Provider>
    );
}
export default ActionsContextProvider;
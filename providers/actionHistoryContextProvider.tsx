import React, { useState, createContext } from 'react';

import { ExamenRetexItem } from '../types/Retex';

type ActionHistoryContextType = {
    actionHistory: Map<number, ExamenRetexItem>; // Unique key identifyer
    setActionHistory: React.Dispatch<React.SetStateAction< Map<number, ExamenRetexItem>>>;
};

export const ActionHistoryContext = createContext<ActionHistoryContextType>({} as ActionHistoryContextType);

const ActionHistoryContextProvider = (props:any) => {
    const [actionHistory, setActionHistory] = useState< Map<number, ExamenRetexItem>>(new Map());
    return (
        <ActionHistoryContext.Provider value={{ actionHistory, setActionHistory }}>
        	{props.children}
        </ActionHistoryContext.Provider>
    );
}
export default ActionHistoryContextProvider;

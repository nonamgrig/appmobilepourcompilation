import React, { useState, useEffect, createContext } from 'react';


export type SetUpContextType = {
    setUp: boolean|undefined;
    setSetUp: React.Dispatch<React.SetStateAction<boolean|undefined>>;
}

export const SetUpContext = createContext<SetUpContextType>({} as SetUpContextType);
const SetUpContextProvider = (props:any) => {
    const [setUp, setSetUp] = useState<boolean|undefined>(false);
    return (
        <SetUpContext.Provider value={{ setUp, setSetUp }}>
        	{props.children}
        </SetUpContext.Provider>
    );
}
export default SetUpContextProvider;
import React, { useState, useEffect, createContext } from 'react';
export const BioeventsVarsContext = createContext();
const BioeventsContextProvider = (props) => {
    const [bioevents, setBioevents] = useState([]);
    const [bioeventsdesc, setBioeventsDesc] = useState([]);
    return (
        <BioeventsVarsContext.Provider value={{ 
            bioevents:bioevents,
            setBioevents:setBioevents,
            bioeventsdesc:bioeventsdesc,
            setBioeventsDesc:setBioeventsDesc
        }}>
        	{props.children}
        </BioeventsVarsContext.Provider>
    );
}
export default BioeventsContextProvider;
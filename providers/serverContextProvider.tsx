import React, { useState, createContext } from 'react';

interface ServerContextType {
    serverIP: string;
    setServerIP: React.Dispatch<React.SetStateAction<string>>;
}

export const ServerContext = createContext<ServerContextType>({} as ServerContextType);

const ServerContextProvider = (props:any) => {
    const [serverIP, setServerIP] = useState<string>("");
    return (
        <ServerContext.Provider value={{ serverIP, setServerIP}}>
        	{props.children}
        </ServerContext.Provider>
    );
}
export default ServerContextProvider;
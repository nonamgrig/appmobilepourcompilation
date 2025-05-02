import { useEffect, useRef, useState } from 'react'

export function useUpdateRef<T>(state:T){
  const refData = useRef<T>(state);
  
  useEffect(() => {
    refData.current = state
  }, [state]);

  return refData;
}






// Create a ref that follows a state
export function useStateRef<T>(startValue:T):[
  T,  // state value
  React.Dispatch<React.SetStateAction<T>>,  // setState function
  React.MutableRefObject<T>  // ref object
]{
  const [stateData, setStateData] = useState<T>(startValue);
  const refData = useUpdateRef<T>(stateData);

  return [stateData, setStateData, refData];
}








// Inspired from https://felixgerschau.com/react-hooks-settimeout/

// Create timers that are cleared correctly on unmount
export function useSetTimeoutManager() {
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    // Remove timeouts if unmounted
    return clearAllTimeouts
  }, [])

  const setReactTimeout = (callback: (...argv:any) => any, delay: number, ...args:any) => {
    const timeout = setTimeout(callback, delay, ...args); // Args are classical variables to pass to the callback once it executes
    timeouts.current.push(timeout);
    return timeout;
  };

  const clearAllTimeouts = () => {
    timeouts.current.forEach(timeout => clearTimeout(timeout));
  };

  return {setReactTimeout, clearAllTimeouts};
}








// Solution from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
// Allows us to use a function with changing states in it
// The interval starts
export function useInterval(callback: (...argv:any) => any, delay: number, ...argv:any) {
  const savedCallback = useRef(callback);
  const [running, setRunning] = useState<boolean>(false);
  const intervalIdRef = useRef<number>(0);
 
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  useEffect(() => {
    if (running) {
      intervalIdRef.current = setInterval(savedCallback.current, delay, ...argv);
      return () => clearInterval(intervalIdRef.current);
    } else {
      clearInterval(intervalIdRef.current);
    }
  }, [delay, running]);

  return {
    start: () => setRunning(true),
    stop: () => setRunning(false)
  };
}









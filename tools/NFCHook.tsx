import { useEffect, useRef, useState } from 'react';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { useSetTimeoutManager } from './AppHooks';


export const useNFC = () => {
  const [message, setMessage] = useState<string>("");
  const numberFails = useRef<number>(0);
  const {setReactTimeout} = useSetTimeoutManager();
  const maxNumberFails = 5;


  const scanNfc = async () => {
    await NfcManager.cancelTechnologyRequest();

    try {
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();
      console.log('tag', tag); 
      if (tag?.ndefMessage) {
        const text = Ndef.text.decodePayload(tag.ndefMessage[0].payload as unknown as Uint8Array<ArrayBufferLike>);
        console.log("text", text); 
        // Sometime strange characters are appened at the end and should be removed
        setMessage(text.trim());
        // setMessage(text.substring(text.indexOf('{'),text.indexOf('}')+1)); // Triggers the render and functions
        setMessage(""); // Resets
        
      } else {
        console.warn("Aucun message NDEF trouvé.");
      }
    } catch (ex) {
      numberFails.current = numberFails.current+1;
      console.warn("Erreur de lecture NFC:", ex);
    } finally {
      await NfcManager.cancelTechnologyRequest();
      if(numberFails.current < maxNumberFails)
        setReactTimeout(scanNfc, 1000);
      else {
        console.warn("NFC could not be used after multiple attemps");
      }
    }
  };


  useEffect(() => {
    scanNfc();
    return () => {
      NfcManager.cancelTechnologyRequest(); // Nettoyage en cas de démontage du composant
    };
  }, []);

  return message;
}
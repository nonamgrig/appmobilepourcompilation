import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import WelcomeView from './WelcomeView';
import PreSimulationView from './PreSimulationView';
import AdminView from './adminView';
import React, { useState, useEffect,useContext } from 'react';
// import * as ScreenOrientation from "expo-screen-orientation";
import IntervenantView from './IntervenantView';
import { Box } from "native-base";


// Contexts
import { PlastronPhysEvolutifContext } from '../providers/plastronPhysEvolutifContextProvider';
import { ModelPlastronContext } from '../providers/modelPlastronContextProvider';
import { PlastronDataContext } from '../providers/plastronContextProvider';
import { SetUpContext } from '../providers/setUpContextProvider';
import { ServerContext } from '../providers/serverContextProvider';

import { baseStyles, elementStyles } from '../styles/globalstyles';

import { PlastronModelItem } from '../types/Model';


import { useInterval, useStateRef, useSetTimeoutManager, useUpdateRef } from '../tools/AppHooks';
import { useNFC } from '../tools/NFCHook';
import { Action } from '../types/Actions';

// UI
import AnimatedView from './animated/View';
import { getStorage, setStorage } from '../tools/Storage';

export default function Pages() {
  const {setServerIP} = useContext(ServerContext);

  const {setUp, setSetUp} = useContext(SetUpContext)

  const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  } = Dimensions.get('window');

  
  const {setReactTimeout} = useSetTimeoutManager();

  // Data
  const {modelPlastron} = useContext(ModelPlastronContext)
  const {plastronPhysEvolutif, setPlastronPhysEvolutif} = useContext(PlastronPhysEvolutifContext);
  const refPlastronPhysEvol = useUpdateRef(plastronPhysEvolutif);

  const nfcMessage = useNFC();


  
  // UI vars
  const [orientationHorizontal, setOrientationHorizontal] = useState(false);
  // const [setUpTrigger, setSetUpTrigger] = useState(false)
  const [createViewActive, setCreateViewActive] = useState(0);
  const [notifContent, setNotifContent] = useState<string>("Cette notificaiton est ici");
  const [showNotif, setShowNotif] = useState<boolean>(false);
  const [notifColor, setNotifColor] = useState<string>(baseStyles.maincolor.color);
  const [timeoutNotif, setTimeoutNotif] = useState<number>();
    // Les items d'influence sont les items du modèles programmés
  const [influencePile, setInfluencePile, refInfluencePile] = useStateRef<PlastronModelItem[]>([]); 
  const [frozenModelItems, setFrozenModelItems, refFrozenModelItems] = useStateRef<Set<string>>(new Set()); // List of documentIds of modelItems that were stopped (and can never be started again)


  const welcomeViewId = 0;
  const intervenantViewId = 3;
  const selectViewId = 4;
  const finishViewId = 5;

  // close button that sends to previous views
  const goWelcome = () => {
    setCreateViewActive(welcomeViewId);
  };

  const goSelecting = () => {
    setCreateViewActive(selectViewId);
  }

  const goIntervenant = () => {
    setCreateViewActive(intervenantViewId);
  };

  const goAdmin = () => {
    setCreateViewActive(finishViewId);
  }


  const registerModelItems = (modelArray:PlastronModelItem[]) => {
    let updatedInfluencePile = refInfluencePile.current;
    
    modelArray.forEach(modelItem => {
      if(modelItem.type == "start"){ 
       
        if(
          !refFrozenModelItems.current.has(modelItem.trend.documentId) // Not banned (not previously stopped)
          && !updatedInfluencePile.some(influenceItem => influenceItem.trend.documentId == modelItem.trend.documentId) // Not already in the influence pile
        ){
          // Add to influence pile 
          updatedInfluencePile.push(modelItem);
        }

      } else { // Type stop or pause
        updatedInfluencePile = updatedInfluencePile
        .filter(influenceItem => influenceItem.trend.documentId != modelItem.trend.documentId);
      }
      if(modelItem.type == "stop"){
        setFrozenModelItems(new Set([...refFrozenModelItems.current, modelItem.trend.documentId]));
        setStorage('frozenModelItems', Array.from(refFrozenModelItems.current));
      }
    });
    
    
    setInfluencePile(updatedInfluencePile);
    setStorage("lastInfluencePile", updatedInfluencePile);
  }


  const updatePhysVars = () => {
    
    // 1 : Update physical model with the current pile of influence
    setPlastronPhysEvolutif(
      refPlastronPhysEvol.current.map((physVar) => {
        refInfluencePile.current.forEach(modelItem => {
          // Si l'influence est active (pas programmée) et s'applique à cette variable
          if(
            modelItem.timer == 0
            && modelItem.trend.variablephysio.documentId == physVar.documentId
          ) {
            
            if(physVar?.valeur == undefined) {
              throw "Physical Variabvle was not properly initialised";
            }

              // The ! is a Non-Null Assertion to calm down typescript
            let nextValue:number = physVar.valeur + modelItem.trend.valeur;
            
            nextValue = Math.round(Math.min(physVar.max, Math.max(physVar.min, nextValue))*10)/10; // Remove decimals after the first one
            // overshoot test by checking the sign of this expression
            const overshoot = (modelItem.trend.cible-nextValue)*modelItem.trend.valeur < 0;
            //console.log(`Action sur la variable ${physVar.nom}, next : ${nextValue}, overshoot: ${overshoot}, action : ${modelItem.trend.valeur}`);
            
            if(!overshoot){
              physVar.valeur = nextValue;
            } else if ((modelItem.trend.cible-physVar.valeur)*modelItem.trend.valeur > 0){ // Still bring back the physVar to the cible if it crosses it
              physVar.valeur = modelItem.trend.cible;
            }

          }

          

        });

        return physVar;
      })
    )


    // 2 : Update the pile of influence
    setInfluencePile(
      refInfluencePile.current.map((influItem) => {
        if(influItem.timer > 0){
          influItem.timer--;
        }
        return influItem;
      })
    );


    setStorage("lastPhysVars", refPlastronPhysEvol.current);
    setStorage("lastInfluencePile", refInfluencePile.current);

  };
  
  // BUILD : Set to 60*1000
  const mainLoopInterval = 60*1000;
  const mainLoop = useInterval(updatePhysVars, mainLoopInterval);

  const appendAction = (action:Action) => {
    // Si l'action n'a pas déjà été effectuée
    if(!influencePile.some(influItem => influItem.event.action?.documentId == action.documentId)){
      const actionEvents:PlastronModelItem[] = modelPlastron?.filter(modelItem => modelItem.event.action?.documentId == action.documentId) || [];
      registerModelItems(actionEvents);
    }
  }

  const displayNotif = (content:string, type:"message"|"error" = "message") => {
    setNotifContent(content);
    setShowNotif(true);
    setNotifColor(type == "error" ? "darkred" : baseStyles.maincolor.color);
    clearTimeout(timeoutNotif);
    setTimeoutNotif(setReactTimeout(() => setShowNotif(false), 3000));
  }



  useEffect(() => { // On start of the app
    setServerIP(process.env.EXPO_PUBLIC_NETWORK_PATH || "");
  }, [])



  useEffect(() => {
    if(createViewActive == 2 || createViewActive == 1){
      console.error("Active View "+ createViewActive +" is deprecated");
    }
  }, [createViewActive]);

  
  
  useEffect(() => {
    if(setUp){ // When setUp switches on
      if(!modelPlastron){
        throw "Model was not set up correctly";
      }
      
      setInfluencePile([]);

      getStorage('lastInfluencePile')
      .then(lastInfluencePile => {
        if(lastInfluencePile != null){
          setInfluencePile(lastInfluencePile);
        } else {
          registerModelItems(modelPlastron.filter((modelItem) => modelItem.event.type == "start"));
          setStorage('lastInfluencePile', []);
        }
      });
      
      getStorage('frozenModelItems')
      .then(frozenModelItemsArray => {
        setFrozenModelItems(new Set(frozenModelItemsArray));
      });

      setStorage("lastPhysVars", plastronPhysEvolutif);
      setStorage('frozenModelItems', Array.from(frozenModelItems));

      
      // Set up an interval to update the phys state every minute
      mainLoop.start();
    }
    
    return () => mainLoop.stop();
    
  }, [setUp]); // Execute when setUp changes state





  return ( <>
    <Box backgroundColor={baseStyles.maincolor.color} h="100%" w="100%" flex={1} safeArea>
      <StatusBar style="light" />
      <View>
        {/* Notifications */}
        <AnimatedView 
        visibility={showNotif} 
        animateInOut
        startValues={{
          opacity: 1,
          trY: -400,
        }}
        duration={300}
        style={styles.notifContain}>
          <Text style={[
            styles.notifText,
            {color: notifColor},
          ]}>{notifContent}</Text>
        </AnimatedView>
      
  
        <Box style={styles.wrapper}>
          {createViewActive == 0 && 
            <WelcomeView 
            orientationHorizontal={orientationHorizontal} 
            goSelecting={goSelecting}
            goIntervenant={goIntervenant}/>
          }
          {createViewActive == 3 && 
            <IntervenantView 
            goAdmin={goAdmin}
            orientationHorizontal={orientationHorizontal}
            appendAction={appendAction}
            displayNotif={displayNotif}
            nfcMessage={nfcMessage}
            />
          }
          {createViewActive == 4 && 
            <PreSimulationView
            orientationHorizontal={orientationHorizontal} 
            displayNotif={displayNotif}
            back={goWelcome}
            forwards={goIntervenant}
            />
          }
          {createViewActive == 5 && 
            <AdminView 
            orientationHorizontal={orientationHorizontal}
            back={goIntervenant}
            forwards={goWelcome}
            displayNotif={displayNotif}
            />
          }
        </Box>
      </View>
    </Box>
    
                            
  </>);
};

const styles = StyleSheet.create({
  notifContain: {
    position: "absolute",
    top:0,
    left:0,
    right: 0,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#a779"
  },
  notifText: {
    fontSize: 20,
    textAlign: 'center',
    ...baseStyles.maincolor,
  },
  wrapper: {
    zIndex: 5,
    height: '100%',
    color:"#ffffff",
  },
  container: {
    padding: 16,
    flex: 1,
  },
  main: {
    flex: 1,
    display: 'flex',
    paddingVertical: 16,
  },
  textArea: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
});

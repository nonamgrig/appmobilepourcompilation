import React, { useState, useEffect, useRef, useContext } from 'react';
import {IntervenantViewProps} from '../types/IntervenantViewProps';
import { StyleSheet, Text, Pressable,View, Image, BackHandler, TextInput } from 'react-native';
import { CloseIcon, Box, Flex, HStack, Button, ScrollView} from 'native-base';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlastronDataContext } from '../providers/plastronContextProvider';
import { useForm, SubmitHandler,Controller } from "react-hook-form"
import { IntervenantsListContext } from '../providers/intervenantsContextProvider';
import { PlastronPhysEvolutifContext } from '../providers/plastronPhysEvolutifContextProvider';
import { ActionsContext } from '../providers/actionsContextProvider';


//import Timer from './Timer';


import AnimatedView from './animated/View';
import AnimatedButton from './animated/Button';
import PhysVarButton from './animated/PhysVarButton';
import { baseStyles, elementStyles, mainColor } from '../styles/globalstyles';

// Types
import { IntervenantItem } from '../types/IntervenantsList';
import { PlastronData, PlastronPhysVar } from '../types/PlastronData';
import { Action } from '../types/Actions';

// Tools
import { useStateRef, useSetTimeoutManager, useUpdateRef } from '../tools/AppHooks';

// UI
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedModal from './animated/Modal';
import useStrapi from '../api/strapi';


type Inputs = {
  examen : string,
}

type PhysVarDisplaySubItem = {
  name: string,
  color: string,
  id: string,
  value: string|number,
};

type PhysVarDisplayItem = {
  name: string,
  color: string[],
  id: string[],
  value: (string|number)[],
};

export default function IntervenantView(props:IntervenantViewProps) {

  const { pushExamenRetex, pushVariablesRetex, getLastTriageAction} = useStrapi();

    // Content
   
      // Using context to update the state of each medical variable during its temporal evolution
    const {plastronPhysEvolutif, setPlastronPhysEvolutif} = useContext(PlastronPhysEvolutifContext);
    const refPlastronPhysEvol = useUpdateRef(plastronPhysEvolutif);
    const {intervenantsList, setIntervenantsList} = useContext(IntervenantsListContext);
    const { plastronData } = useContext(PlastronDataContext);
    const {actions} = useContext(ActionsContext);

      // Pile des mesures : rangées les plus récentes d'abord
    const [pileMesures, setPileMesures] = useState<any[]>([]);
      // React state of variables shown in the display, variables can be grouped so it is an array of array
      // The key is the displayed name for the variable block (blocname)
    const [physVarsDisplay, setPhysVarsDisplay, refPhysVarsDisplay] 
      = useStateRef<Record<string,PhysVarDisplaySubItem[]>>({});
    const {setReactTimeout} = useSetTimeoutManager();
    const [actionDisplayCategories, setActionDisplayCategories] = useState<string[][]>([]);

      //UI
    const [intervenantModalOpened, setIntervenantModalOpened] = useState<boolean>(false);
    const [letters, setLetters] = useState('');

  
    const [authOpened, setAuthOpened] = useState<boolean>(false);
    const [showingPlastronInfo, setShowingPlastronInfo] = useState<boolean>(false);
    const [showActions, setShowActions] = useState<boolean>(false);
    const [showTriage, setShowTriage] = useState<boolean>(false);
    const [categorySelected, setCategorySelected] = useState<string>("");
    const [showActionValidated, setShowActionValidated] = useState<boolean>(false);
    const [actionValidatedName, setActionValidatedName] = useState<string>("");

    const [customActionText, setCustomActionText] = useState("");



      // UI measurements
    const [bottomButtonsHeight, setBottomButtonsHeight] = useState<number>(0);
    const [headerHeightTracker, setHeaderHeightTracker] = useState<number>(0);

    //Bypass NFC
    const [manualId, setManualId] = useState('');

    // Keep track of ids of Timeouts to clear them when needed (when the wait is extended for instance), indexed by bloc Names
    // Reference to survive rerenders
    const blocTimeoutIds = useRef<Map<string, number>>(new Map());
    // BUILD : 60*1000 should be great
    const blocDisplayDuration = 60*1000;
    
    const activityTimeoutId = useRef<number|null>(null);



    const triageList = [ 'UR', 'UA', 'EU' , 'D', 'E/I'];


    // Some variables can be surnamed of grouped into one display block here, the value is the display block name
    const physVarsGroupings:Map<string, string> = new Map(Object.entries({ "PAS": "PNI", "PAD":"PNI" })); // Order here is order shown
    
    const physVarsOrder:string[] = [ 
      "FR", 
      "SpO2", 
      "EtCO2", 
      "FC", 
      "PAS", 
      "PAD", 
      "HemoCue",
      "T°",
      "douleur",
      "GCS"
    ];
    
    const orderKeys = Object.keys(physVarsGroupings); 
    const getBlockName = (varName:string) => {
      return physVarsGroupings.get(varName) || varName;
    }

  
    const registerInactivityTimeout = () => {
      if(activityTimeoutId.current) clearTimeout(activityTimeoutId.current);
      activityTimeoutId.current = setReactTimeout(() => setIntervenantsList([]),2*60*1000);
    }

    const parseActions = (rowSize = 2, defaultCategory = "Autre") => {


      let actionCartegoryValues:Map<string,number> = new Map(); // Maps category names in keys and their index in values
      let displayCategories:string[][] = [];

      
      actions.forEach((action) => {
        if(!action.categorie) action.categorie = {nom: defaultCategory, documentId: "0", index: 10000}
        actionCartegoryValues.set(action.categorie.nom, action.categorie.index);
      });

      Array.from(actionCartegoryValues)
      .sort((a,b) => a[1]-b[1])
      .forEach((data, index) => {
        const row = Math.floor(index / rowSize) // Quotient
        if(index % rowSize == 0) displayCategories.push([]);
        displayCategories[row].push(data[0]);
      });

      setActionDisplayCategories(displayCategories);
    }

    const getActionEnabled = (action:Action) => {
      return intervenantsList.some((intervenant:IntervenantItem) => {
        const intervenantClass = intervenant.class == "obs" ? "med" : intervenant.class;
        return action[intervenantClass] == true
      })
    }


    // using a ref to get latest value and not the one when the function was defined
    const getCurrentPhysVarValue = (id: string) => {
      return refPlastronPhysEvol.current.find((physVar) => physVar.documentId == id)?.valeur;
    }

    // Compatible with timouts on physVarDisplay
    const setPhysDisplayVarWrapper = (blocName: string, valueFunc:(id:string) => string|number) => {
      // map function doesn't exist on objects so we break it into several lines.
      let displayObject:Record<string, PhysVarDisplaySubItem[]> = {};
      
      // Uses actual physVarsDisplay, not the one that was defined on definition of setTimeout
      Object.entries(refPhysVarsDisplay.current).forEach(([blocNameIter, itemArray]) => {
        displayObject[blocNameIter] = blocName != blocNameIter ? itemArray : itemArray.map((displayItem) => {
          return {
            ...displayItem,
            value: valueFunc(displayItem.id),
          }
        });
      });

      setPhysVarsDisplay(displayObject);
    }

    const clearDisplayBloc = (blocName: string) => {
      blocTimeoutIds.current.delete(blocName);
       setPhysDisplayVarWrapper(blocName, (id) => "-");
    }

    const clearAllDisplayBlocs = () => {
      const clearedDisplayObject: Record<string, PhysVarDisplaySubItem[]> = {};

      Object.entries(refPhysVarsDisplay.current).forEach(([blocName, itemArray]) => {
        clearedDisplayObject[blocName] = itemArray.map(displayItem => ({
          ...displayItem,
          value: "-", // Vide la valeur
        }));

        // Annule les timeouts au passage
        if (blocTimeoutIds.current.has(blocName)) {
          clearTimeout(blocTimeoutIds.current.get(blocName));
          blocTimeoutIds.current.delete(blocName);
        }
      });

      setPhysVarsDisplay(clearedDisplayObject);
    };




    
    const displayVariable = (blocName: string) => {
      
      
      setPhysDisplayVarWrapper(blocName, (id) => {
        const value = getCurrentPhysVarValue(id);
        if(value == undefined) return "err"
        else return value
      });

      const isModeObs = intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs")

      if(blocTimeoutIds.current.has(blocName)){
        clearTimeout(blocTimeoutIds.current.get(blocName));
      }
      

      if (isModeObs) { //Mode Observateur 
        // Using custom timeout implementation
        blocTimeoutIds.current.set(blocName, 
          setReactTimeout(
            //on veut relancer la fonction displayVarible pour toujours afficher les valeurs si on est en mode observateur 
            () => displayVariable(blocName), 
            blocDisplayDuration, 
            blocName
          )
        );
      } else { //Mode joueur
        // Using custom timeout implementation
        blocTimeoutIds.current.set(blocName, 
          setReactTimeout(
            clearDisplayBloc,
            blocDisplayDuration, 
            blocName
          )
        );
      }
      
    };

    const actionValidatedUIFeedback = (nomAction:string, duration = 3000) => {
      setActionValidatedName(nomAction);
      setShowActionValidated(true);
      setReactTimeout(() => {
        setShowActionValidated(false);
      }, duration)
    }




    


    function formatDisplayVars(rowSize: number = 3): PhysVarDisplayItem[][] {
      let result = new Array<Array<PhysVarDisplayItem>>();

      Object.entries(physVarsDisplay).forEach(([name, arrayItem], index) => {
        let finalDisplayItem: PhysVarDisplayItem = {
          name: name,
          color: [],
          id: [],
          value: [],
        };

        arrayItem.forEach(item => {
          finalDisplayItem.id.push(item.id);
          finalDisplayItem.color.push(item.color);
          finalDisplayItem.value.push(item.value);
        });
        const column = Math.floor(index / rowSize) // Quotient
        if(index % rowSize == 0) result.push([]);
        result[column].push(finalDisplayItem);
      });

      return result;
    }

    const addIntervenant = (code:string) => {
      // const data = JSON.parse(code);
      const id = code //on ne met dans le tag NFC que l'id du bracelet
      // Si l'intervenant n'est pas déjà identifié
      if(!intervenantsList.some((med:IntervenantItem) => med.intervenantID == id)){
        let intervenantItem:IntervenantItem = {
          intervenantID: id,
          // nom: data.nom,
          class: "secouriste",
        };
        // The first number of the ID means the type of medclass
        switch (id.charAt(0)) {
          case "0": 
            intervenantItem.class="obs"; 
            break 
          case "1":
            intervenantItem.class= "med";
            break;
          case "2":
            intervenantItem.class= "paramed";
            break;
          case "3":
            intervenantItem.class= "secouriste";
            break;
        }
        setIntervenantsList([...intervenantsList, intervenantItem]);

        clearAllDisplayBlocs();
      
      }
      
      // When someone authenticates, we direct her/him directly to the intervenant view
      setAuthOpened(false); 
    
    }


    
    const warnLongPressReq = () => {
      props.displayNotif("Pour activer, maintenez appuyé le bouton.");
    }


    // Récupérer la dernière action de triage enregistrée dans le stockage local
    useEffect(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {      
          if (authOpened || showTriage || showActions || showingPlastronInfo || intervenantModalOpened) {
            setAuthOpened(false);
            setShowTriage(false);
            setShowActions(false);
            setShowingPlastronInfo(false);
            setIntervenantModalOpened(false);

            return true; // When true is returned the event will not be bubbled up & no other back action will execute
          }
          return false;
        },
      );
      
      getTriageFromStorage();

      registerInactivityTimeout();

      // Unsubscribe the listener on unmount
      return () =>{ subscription.remove(); };
    }, []);

    useEffect(() => {
      console.log('nfc message', props.nfcMessage); 
      if(props.nfcMessage){
        if(authOpened) addIntervenant(props.nfcMessage);
        else props.displayNotif("Veuillez scanner votre bracelet grâce au menu Intervenant")
      }
    }, [props.nfcMessage])



    // Display the correct physVars on the first render
    useEffect(() => {

      //TO DO réussir à afficher les valeurs sans appuyer pour la version obs 
      
      // combine variables for PAS and PAD (arterial pressure).
      let displayVars:Record<string,PhysVarDisplaySubItem[]> = {};

      if(!plastronData?.profil.variablesPhysio){
        throw "Variables Physio were not correctly initialised";
      }

      plastronData?.profil.variablesPhysio
      .sort((a,b) => physVarsOrder.indexOf(a.nom)-physVarsOrder.indexOf(b.nom))
      .forEach(
        (currVar:PlastronPhysVar) => {
          let blockname = getBlockName(currVar.nom);
          if(!(blockname in displayVars)){
            displayVars[blockname] = new Array<PhysVarDisplaySubItem>();
          }

          displayVars[blockname].push({
            name: currVar.nom,
            color: currVar.color,
            id: currVar.documentId,
            value: "-",
          });
        }
      )

      // Reorder display block content according to order specified in physVarsGroupings and therefore orderKeys
      Object.keys(displayVars).forEach(blockName => {
        displayVars[blockName].sort((a,b) => orderKeys.indexOf(a.name) - orderKeys.indexOf(b.name));
      });

      setPhysVarsDisplay(displayVars);      
      
    },[plastronData]);
    
    useEffect(() => {
      if(!intervenantsList.length){
        setIntervenantModalOpened(false);
        setReactTimeout(() => setAuthOpened(true),100);
      }
    }, [intervenantsList, authOpened]);
  

    function getTriageFromStorage() {
      const actionTriage = getLastTriageAction(plastronData?.documentId);
      const palabraDespuesDeEffectue = actionTriage?.attributes.action.match(/Triage effectué (\w+)/) || [];
      if(palabraDespuesDeEffectue?.length > 1){
        setLetters(palabraDespuesDeEffectue[1])
      }
    }

    const {
      register,
      handleSubmit,
      watch,
      control,
      formState: { errors },
    } = useForm<Inputs>()

    useEffect(()=>{
    
      parseActions();
          
 
    },[])



    const triageBackgroundColor = (() => {
      if (!letters) return '#FFFFFF';

      if (letters === 'UR') return '#FFFF00';       // jaune
      if (letters === 'UA') return '#FF0000';       // rouge
      if (letters === 'EU') return '#FF0000';       // rouge
      if (letters === 'D')  return '#000000';       // noir
      if (letters === 'E/I') return 'rgb(37, 115, 54)'; // vert

      return '#FFFFFF'; // couleur par défaut
    })();

    const triageTextColor = (() => {
      if (!letters) return '#000000';

      if (letters === 'UR') return '#000000';       // texte noir
      if (letters === 'UA') return '#FFFFFF';       // texte blanc
      if (letters === 'EU') return '#000000';       // texte noir
      if (letters === 'D')  return '#FFFFFF';       // texte blanc
      if (letters === 'E/I') return '#FFFFFF';      // texte blanc

      return '#000000'; // texte par défaut
    })();


    const triageBorderColor = (() => {
      if (letters === 'UA' || letters === 'E/I') return '#FFFFFF'; // ✅ blanche
      return '#000000'; // sinon noire
    })();




    return ( <>
      {/* Header */}
      <View 
      style={elementStyles.headerContain}
      onLayout={event => {
        setHeaderHeightTracker(event.nativeEvent.layout.height);
      }}>
        <LinearGradient
        colors={['rgba(0,0,0,0)', baseStyles.maincolor.color]}
        start={{ x: 0.0, y: 1.0 }}
        end={{ x: 0.0, y: 0.0 }}
        locations={[0, 2]}
        style={baseStyles.fill}
        />
        <AnimatedButton
        style={{
          width: 60,
          height: 60,
          margin: 10,
          backgroundColor: "white",
          position: 'absolute',
          top: 0, left: 0,
          borderRadius: 100
        }}
        onPress={props.goAdmin}>
          <Image 
           style={{
            width: "100%",
            height: "100%",
          }}
          source={require('../assets/Logos-02.png')}/>
        </AnimatedButton>
        <AnimatedButton 
        onPress={() => {setIntervenantModalOpened(true)}}
        style={{
          padding: 15,
          borderRadius: 4,
          backgroundColor: "white",
          justifyContent: "center",
          ...baseStyles.shadow
        }}>
          <Text
          style={{
            fontSize: 22,
            textTransform: "capitalize",
            ...baseStyles.appFont,
            ...baseStyles.maincolor
          }}
          >
            Intervenants ({intervenantsList.length})
          </Text>
        </AnimatedButton>
      </View>





      {/* Modals */}
      <AnimatedModal
      visibility={intervenantModalOpened} 
      onRequestClose={() => setIntervenantModalOpened(false)}>
        <AnimatedModal.Content>
          <AnimatedModal.Header closeButton>
            <Text style={baseStyles.h2}>Intervenants</Text>
          </AnimatedModal.Header>
          <AnimatedModal.Body>
            <View style={styles.medListContain}>
              {intervenantsList.length > 0 ? // If there are intervenants connected
                intervenantsList.map((interv:IntervenantItem) => {
                  return (
                    <AnimatedView
                    style={styles.medListItem} 
                    key={interv.intervenantID}>
                      <Text style={styles.medListText}>
                        <Text style={[baseStyles.appBoldFont, baseStyles.maincolor]}>{interv.intervenantID} </Text>
                          ({interv.class})
                      </Text>
                      <Pressable
                      hitSlop={5}
                      style={{aspectRatio: "1/1"}}
                      onPress={() => {
                        setIntervenantsList(
                          intervenantsList.filter(
                            (iterInterv:IntervenantItem) => iterInterv.intervenantID != interv.intervenantID
                          )
                        );
                        clearAllDisplayBlocs();
                      }}
                      >
                        <CloseIcon size="5" mt="0.5" color="red.500" />
                      </Pressable>
                    </AnimatedView>
                  );
                })
              : // If no intervenant is connected
                <Text>Aucun intervenant connecté...</Text>
              }
            </View>
            <Button paddingLeft={8} paddingRight={8} marginTop={5} backgroundColor={baseStyles.maincolor.color}
              onPress={() => {
                setIntervenantModalOpened(false);
                setReactTimeout(() => setAuthOpened(true), 100);
              }}>
              Ajouter
            </Button>
          </AnimatedModal.Body>
        </AnimatedModal.Content>
      </AnimatedModal>
      <AnimatedModal visibility={authOpened} onRequestClose={() => setAuthOpened(false)}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Boîte 1 : Scan NFC */}
          <AnimatedModal.Content style={{  width: '100%', marginBottom: 20 }}>
            <AnimatedModal.Header closeButton>
              <Text style={[baseStyles.h2, { fontSize: 25, marginRight : 10}]}>Scanne ton bracelet</Text>
            </AnimatedModal.Header>
            <AnimatedModal.Body style={styles.authContainer}>
              <Ionicons name="watch-outline" color={baseStyles.lightMainColor.color} size={50} />
              <Text style={[baseStyles.h3, { fontSize: 18 }]}>Scan en cours...</Text>
            </AnimatedModal.Body>
          </AnimatedModal.Content>

          <Text style={{
            color: 'white',
            fontSize: 25,
            fontWeight: 'bold', 
            marginVertical: 10,
            textAlign: 'center',
            backgroundColor: 'transparent',
          }}>
            OU
          </Text>

          {/* Boîte 2 : Entrée manuelle */}
          <AnimatedModal.Content style={{  width: '100%', marginTop : 20}}>
            <AnimatedModal.Header closeButton>
              <Text style={[baseStyles.h2, { fontSize: 25 }]}>Entre ton ID</Text>
            </AnimatedModal.Header>
            <AnimatedModal.Body style={styles.authContainer}>
              <TextInput
                placeholder="3000"
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  padding: 10,
                  marginVertical: 10,
                  borderRadius: 5, 
                  width: 150,
                }}
                keyboardType="numeric"
                onChangeText={(text) => setManualId(text)}
                value={manualId}
              />
              <Pressable
                style={styles.devButton}
                onPress={() => {
                  if (manualId.trim() !== '') {
                    addIntervenant(manualId);
                  }
                }}
              >
                <Text style={{ color: 'white' }}>Ajouter l'ID</Text>
              </Pressable>
            </AnimatedModal.Body>
          </AnimatedModal.Content>
          
        </View>
      </AnimatedModal>
      <AnimatedModal visibility={showingPlastronInfo} onRequestClose={() => setShowingPlastronInfo(false)}>
        <AnimatedModal.Content>
          <AnimatedModal.Header closeButton>
            {!intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            <Text style={baseStyles.h2}>Plastron info</Text>}
            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            <Text style={baseStyles.h2}>{plastronData?.modele.titre}</Text>}
          </AnimatedModal.Header>
          <AnimatedModal.Body>
            <Text style={{marginBottom: 20}}>{plastronData?.profil.age} ans</Text>
            {/* <Text style={baseStyles.h3}>Contexte</Text>
            <Text style={{marginBottom: 20}}>{plastronData?.modele.description}</Text> */}

            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            (<Text style={baseStyles.h3}>Description</Text>)}
            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            (<Text style={{ marginBottom: 20 }}>
                {plastronData?.modele.description}
              </Text>
            )}

            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            (<Text style={baseStyles.h3}>Attendus Formation</Text>)}
            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            (<Text style={{ marginBottom: 20 }}>
                {plastronData?.modele.examen}
              </Text>
            )}

            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            (<Text style={baseStyles.h3}>Consignes Plastron</Text>)}
            {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && 
            (<Text style={{ marginBottom: 20 }}>
                {plastronData?.modele.description_cachee}
              </Text>
            )}
          </AnimatedModal.Body>
        </AnimatedModal.Content>
      </AnimatedModal>
      
      <AnimatedModal
        visibility={showActions}
        onRequestClose={() =>{ 
          setShowActions(false);
          setReactTimeout(() => setCategorySelected(""), 200);
        }}
      >
        <AnimatedModal.Content>
          <AnimatedModal.Header closeButton>
            <Text style={baseStyles.h2}>Actions</Text>
          </AnimatedModal.Header>
          <AnimatedModal.Body style={{padding:0}}>
            <ScrollView 
            style={{height: "80%"}}
            contentContainerStyle={{padding: 20, paddingBottom: 30 /*To allow overflows that's not supported on scrollviews */}}
            >
              {/* Row of category buttons and several lists of correponding actions following */}
              {actionDisplayCategories.map((rowCategories, row) =>
                <View key={row}>
                  {/* Row of category buttons */}
                  <View style={styles.categoryContain}>
                    {rowCategories.map((categoryName, column) => 
                      <AnimatedButton
                      key={column}
                      style={[
                        styles.categoryButton, 
                        {backgroundColor: categoryName != categorySelected ? baseStyles.maincolor.color : "black"}
                      ]}
                      onPress={() => {setCategorySelected(categoryName)}}
                      >
                        <Text style={styles.categoryText}>{categoryName}</Text>
                      </AnimatedButton>
                    )}
                  </View>
                  { /* List of (list of actons), one per category */ }
                  {rowCategories.sort().map((categoryName, column) => (
                    <AnimatedView
                    key={column}
                    visibility={categoryName == categorySelected}
                    animateInOut
                    duration={100}
                    outSpeedFactor={3}
                    delay={100/3}
                    startValues={{
                      opacity: 0, scale: 1, trY: 0
                    }}
                    >
                      {actions.filter(action => action.categorie.nom == categoryName)
                        .map(action => {
                          return {action, enabled: getActionEnabled(action)}
                        })
                        .sort((a, b) => a.action.nom.toLocaleLowerCase() > b.action.nom.toLocaleLowerCase() ? 1 : -1)
                        .map(({action, enabled}) => 
                          <AnimatedButton
                          style={[
                            styles.actionItem, 
                            {backgroundColor: enabled ? "#fff" : "#f9f9f9",}
                          ]}
                          key={action.documentId} 
                          disabled={!enabled}
                          onPress={warnLongPressReq}
                          onLongPress={() => {
                            Promise.allSettled([
                              pushExamenRetex(
                                `Faire ${action.nom} (${action.categorie.nom}) ${action.documentId}`,
                                plastronData?.documentId,
                                intervenantsList
                                  .filter(intervenant => {
                                      const intervenantClass = intervenant.class == "obs" ? "med" : intervenant.class;
                                      return action[intervenantClass] == true
                                    }) // Get sublist of connected intervenants that are allowed to do this specific action
                                  .map(intervenant => intervenant.intervenantID)
                              ),
                              pushVariablesRetex()
                            ]).catch(err => {
                              console.log("Could not sync, postponed");
                            });
                          
                            registerInactivityTimeout();
                            
                            setShowActions(false);
                            props.appendAction(action);
                            actionValidatedUIFeedback(action.nom);

                            
                          }}>
                
                            <Text style={
                              {textDecorationLine: enabled ? 'none' : 'line-through'}
                            }>
                              {action.nom}
                            </Text>
                    
                          </AnimatedButton>
                        )
                      }
                    </AnimatedView>
                  ))}
                </View>
              )}
              {intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs") && (
                <>
                  <View style={{ marginTop: 20 }}>
                    <Text style={baseStyles.h3}>Ajouter une action personnalisée</Text>
                    <TextInput
                      placeholder="Décrire l'action manuellement"
                      value={customActionText}
                      onChangeText={setCustomActionText}
                      style={{
                        borderColor: "#ccc",
                        borderWidth: 1,
                        borderRadius: 5,
                        padding: 10,
                        marginTop: 10,
                        backgroundColor: "#fff"
                      }}
                    />
                    <AnimatedButton
                      style={{
                        marginTop: 10,
                        backgroundColor: baseStyles.maincolor.color,
                        padding: 10,
                        borderRadius: 5,
                        alignItems: "center"
                      }}
                      onPress={() => {
                        if (customActionText.trim() == "") return;

                        const newAction = {
                          nom: customActionText,
                          categorie: { nom: "Autre" },
                        };

                        props.appendAction(newAction as Action);
                        pushExamenRetex(
                          `Faire ${newAction.nom} (Autre)`,
                          plastronData?.documentId,
                          intervenantsList.map(i => i.intervenantID)
                        ).catch(() => console.log("Sync échoué (custom action), reporté"));

                        actionValidatedUIFeedback(newAction.nom);
                        setCustomActionText("");
                        setShowActions(false);
                      }}
                    >
                      <Text style={{ color: "#fff" }}>Ajouter cette action</Text>
                    </AnimatedButton>
                  </View>
                </>
              )}

            </ScrollView>
          </AnimatedModal.Body>
          
        </AnimatedModal.Content>
      </AnimatedModal>
    
      <AnimatedModal visibility={showTriage} onRequestClose={() => setShowTriage(false)}>
        <AnimatedModal.Content>
          
          <AnimatedModal.Header closeButton>
            <Text style={baseStyles.h2}>Triage</Text>
          </AnimatedModal.Header>
          <AnimatedModal.Body>
            { triageList.map((triageItem, id) => (
                <AnimatedButton
                style={styles.actionItem}
                key={id}
                onPressIn={()=>{
                  // Using onpressIn to activate whether short or long press
                  // timeout to delay the animation, otherwise the onpressin is too quick

                  setReactTimeout(() => {
                    Promise.allSettled([
                      pushExamenRetex(
                        `Triage effectué ${triageItem}`,
                        plastronData?.documentId,
                        intervenantsList.map(intervenant => intervenant.intervenantID)
                      ),
                      pushVariablesRetex(),
                    ]).catch(err => {
                      console.log("Could not sync, postponed");
                    });
                    
                    registerInactivityTimeout();

                    setLetters(triageItem); // we set the triage made to show it afterwords
                    setShowTriage(false);
                  }, 50);
                }} > 
                  <Text >
                    Trier comme {triageItem}
                  </Text>
                </AnimatedButton>
              ))
            }
          </AnimatedModal.Body>
          
        </AnimatedModal.Content>
      </AnimatedModal>
      
      <AnimatedModal
      visibility={showActionValidated}
      onRequestClose={() => {setShowActionValidated(false);}}
      >
        <AnimatedModal.Content>
          <AnimatedModal.Body>
            <Text style={styles.actionValidateText}>Action effectuée</Text>
            <Text style={styles.actionValidateActionText}>
              {actionValidatedName||"Rien à afficher"}
            </Text>
          </AnimatedModal.Body>
        </AnimatedModal.Content>
      </AnimatedModal>







      
      {/* Main page content */}
      <ScrollView>
        {/* Leave space at the bottom for buttons. Styles that are provided in the props can be overwritten */}
        <AnimatedView
        animateInOut
        startValues={{
          opacity:0,
          scale: 1
        }}
        style={[
          styles.contentContain,
          {
            marginTop: headerHeightTracker,
            marginBottom: bottomButtonsHeight
          }
        ]}
        visibility={intervenantsList.length > 0 && headerHeightTracker > 0}>

          <AnimatedButton
          style={styles.plastronButton}
          onPress={() => {
            setShowingPlastronInfo(true);
          }}>
            <Text style={styles.plastronButtonText}>Info plastron</Text>
            <Ionicons name="arrow-forward-outline" color={baseStyles.maincolor.color} size={30}/>
          </AnimatedButton>

        <View style={styles.varRowContain}>
          {Object.keys(physVarsDisplay).length > 0 &&
            formatDisplayVars(3).map((physVarArray, col) => (
              <View style={styles.varRow} key={col}>
                {physVarArray.map(physVarItem => {
                  // Formater les valeurs ici :
                  const formattedValues = physVarItem.value.map(val => {
                    if (
                      typeof val == "number" &&
                      physVarItem.name != "HemoCue" &&
                      physVarItem.name != "T°"
                    ) {
                      return Math.round(val); // 0 chiffre après la virgule
                    }
                    return val; // garder tel quel sinon (string ou exceptions)
                  });

                  return (
                    <PhysVarButton
                      nom={physVarItem.name}
                      valeurs={formattedValues}
                      varColor={physVarItem.color[0]}
                      key={physVarItem.name}
                      measureFunc={() => {
                        setPileMesures([
                          {
                            id: physVarItem.id,
                            value: physVarItem.value,
                            date: Date.now()
                          },
                          ...pileMesures,
                        ]);

                        displayVariable(physVarItem.name);

                        Promise.allSettled([
                          pushExamenRetex(
                            `Mesurer ${physVarItem.name} ${physVarItem.id}`,
                            plastronData?.documentId,
                            intervenantsList.map(intervenant => intervenant.intervenantID)
                          ),
                          pushVariablesRetex(),
                        ]);

                        registerInactivityTimeout();
                      }}
                    />
                  );
                })}
              </View>
            ))}
        </View>


        </AnimatedView>
  
      </ScrollView>


      <AnimatedView
      visibility={intervenantsList.length > 0}
      animateInOut
      delay={100}
      startValues={{
        opacity: 1,
        trY: 300,
        scale: 1
      }}
      duration={500}
      style={styles.actionAreaContain}
      onLayout={event => {
        setBottomButtonsHeight(event.nativeEvent.layout.height);
      }}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', baseStyles.maincolor.color+"22"]}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, .3]}
          style={baseStyles.fill}
        />
        <View style={styles.actionButtonsContain}>
          <AnimatedButton 
          onPress={() => setShowTriage(true)}
          style={styles.actionButton}>
            <View
              style={[
                styles.triageIconView,
                {
                  backgroundColor: triageBackgroundColor,
                  borderColor: triageBorderColor,
                },
              ]}
            >
              <Text style={[styles.triageIconText, { color: triageTextColor }]}>
                {letters || "-"}
              </Text>
            </View>

            <Text style={styles.actionButtonText}>Triage</Text>
          </AnimatedButton>
          <AnimatedButton 
          onPress={() => setShowActions(true)}
          style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Actions</Text>
          </AnimatedButton>
        </View>
      </AnimatedView>

    </>);
  };
 
const styles = StyleSheet.create({
  // Modals
  authContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  devButton:{
    backgroundColor: mainColor,
    padding:10,
    width: "80%",
    margin:5,
    borderRadius: 8,      
    alignItems: "center",  
  },
  scantext:{
    ...baseStyles.appFont
  },
  plastronButton: {
    flexDirection: "row",
    alignItems:"center",
    justifyContent: "flex-end",
    backgroundColor: "white",
    borderRadius:5,
    width: "80%",
    padding: 10,
  },
  plastronButtonText: {
    position: "absolute",
    top:0, left:0, right:0, bottom:0,
    textAlignVertical:"center",
    ...baseStyles.maincolor,
    fontSize: 25,
    ...baseStyles.appBoldFont,
    textAlign: "center"
  },
  medListContain:{
    padding: 20,
    flexDirection: "column",
    gap: 10,
  },
  medListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    width:"100%",
    alignItems: "center",
    borderLeftWidth: 2,
    borderColor: baseStyles.maincolor.color,
  },
  medListText:{
    paddingLeft: 10,
    marginVertical: 10,
  },
  actionValidateText:{
    textAlign: "center",
    ...baseStyles.appFont,
    fontSize: 20,
    marginBottom: 30,
  },
  actionValidateActionText:{
    ...baseStyles.lightMainColor,
    textAlign: "center",
    textAlignVertical: "center",
    ...baseStyles.appBoldFont,
    fontSize: 25,
  },
  // Main content
  contentContain: {
    paddingVertical: 20,
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  varRowContain: {
    marginVertical: 20,
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: 15,
  },
  varRow: {
    flexDirection: "row",
    gap: 10,
  },
  bottomBanner: {
    flexDirection: 'row',
    position: "absolute",
    bottom: 0, left: 0, right: 0, 
    backgroundColor: "white",
    padding: 10,
    paddingHorizontal: 30
  },
  // Action and triage part
    // Main page
  categoryContain:{
    flexDirection:"row",
    justifyContent: "space-evenly",
    width: "100%",
    gap: 10,
    padding: 5,
  },
  categoryButton:{
    paddingVertical: 15,
    borderRadius: 5,
    flex: 1,
  },
  categoryText:{
    textAlign: "center",
    color: "white",
  },
  actionAreaContain:{
    position: "absolute",
    bottom:0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  actionButtonsContain:{
    position: "absolute",
    bottom:0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  actionButton:{
    backgroundColor: "white",
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 5,
    padding: 15,
  },
  actionButtonText:{
    ...elementStyles.buttonText,
    ...baseStyles.maincolor,
    flex: 3,
  },
  triageText:{
    ...baseStyles.appBoldFont,
    color:'#3078CD',
    paddingRight: 2,
    fontSize:20,
  },
  triageIconView:{
    width: 40,
    height: 40,
    borderRadius: 1,
    borderWidth: 2,
    alignItems:'center',
    justifyContent:'center',
    marginRight: 2,
    flex: 1,
  },
  triageIconText:{
    fontSize:20
  },
    // modal
  actionItem:{
    borderLeftWidth: 2,
    borderColor: baseStyles.maincolor.color,
    margin: 5,
    padding: 10,
  },
  actionItemText: {
    textTransform: "capitalize",
  },
});
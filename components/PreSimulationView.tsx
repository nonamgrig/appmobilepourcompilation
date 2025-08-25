import React, { useState, useEffect, useContext } from 'react';
import {PreSimulationViewProps} from '../types/PreSimulationViewProps';
import { StyleSheet, ActivityIndicator, Text, BackHandler } from 'react-native';
import { PlastronDataContext } from '../providers/plastronContextProvider';
/* import {PlastronPhysEvolutifContext} from '../providers/plastronPhysEvolutifContextProvider';
import { Controller, SubmitHandler, useForm } from 'react-hook-form'; */
import { Box,Select, CheckIcon, View, VStack, HStack,Center, Flex, Image, ScrollView} from "native-base";
import { ModelPlastronContext } from '../providers/modelPlastronContextProvider';
import { PlastronPhysEvolutifContext } from '../providers/plastronPhysEvolutifContextProvider';
import { ActionHistoryContext } from '../providers/actionHistoryContextProvider';
import {BioeventsVarsContext} from '../providers/bioeventsContextProvider';
import { Ionicons } from '@expo/vector-icons'; 
import { SetUpContext } from '../providers/setUpContextProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseStyles, elementStyles, typeStyles } from '../styles/globalstyles';

import AnimatedButton from './animated/Button';
import AnimatedView from './animated/View';

// Types
import { PlastronData, PlastronPhysVar , ScenarioData} from '../types/PlastronData';
import useStrapi from '../api/strapi';
import AnimatedModal from './animated/Modal';
import { ActionsContext } from '../providers/actionsContextProvider';
import { ExamenRetexItem } from '../types/Retex';
import { getStorage, setStorage } from '../tools/Storage';
import { useStateRef } from '../tools/AppHooks';


export default function PreSimulationView(props:PreSimulationViewProps) {
  const { 
    fetchScenarios, 
    getAllActions,
    deletePreviousPlastronData,
    getModelById,
    getAllModels, 
    getActionsPlastron,
    getPlastronsByGroup,
    postPlastronRetex,
    postExerciceRetex,
    getScenarioId,
    connectExercicePlastron,
    putActionPlastron, 
    getPlatronData, 
    pushVariablesRetex, 
    putStatusPlastron, 
    pushExamenRetex
  } = useStrapi();


  const {plastronData, setPlastronData} = useContext(PlastronDataContext);
  const {plastronPhysEvolutif, setPlastronPhysEvolutif} = useContext(PlastronPhysEvolutifContext);
  const {setModelPlastron} = useContext(ModelPlastronContext);
  const {actionHistory, setActionHistory} = useContext(ActionHistoryContext);
  const {setActions} = useContext(ActionsContext);

  const [plastronList, setPlastronList] = useState<PlastronData[]>([]);
  const {setSetUp} = useContext(SetUpContext)
  const [selectedPlastronData, setSelectedPlastronData] = useState<PlastronData>();

  //plastronchargé
  const [downloadPlastron, setDownloadPlastron] = useState<boolean>(false);
  const [createdPlastronId, setCreatedPlastronId] = useState<string>(); 
  const [shouldStartSimulation, setShouldStartSimulation] = useState(false);

  const [recover, setRecover] = useState<boolean>(false);

  // Scenarios
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [selectedScenarioData, setSelectedScenarioData] = useState<ScenarioData>();

  // UI
  const [simulationId, setSimulationId] = useState<string>()
  const [plastronSelectValue, setPlastronSelectValue] = useState<string>();
  const [openAskExists, setOpenAskExists] = useState<boolean>(false);

  const asyncStorageNames = [
    "lastPlastronId",
    "lastPhysVars",
    "actionHistory",
    "lastInfluencePile",
    "frozenModelItems"
  ];

  const warnLongPressReq = () => {
    props.displayNotif("Pour activer, maintenez appuyé sur le bouton.");
  }

  // Fetch plastrons one scenario is selected. Useeffect triggers when simulationId is changed
  useEffect(() => {
    setPlastronSelectValue(undefined);
    setIsPending(true);
    if(simulationId != null){
      getPlastronsByGroup(simulationId, setPlastronList)
      .then(() => {
        setIsPending(false);
      });
    }
  }, [simulationId]);


  useEffect(() => {
    if(plastronSelectValue) getPlatronData(plastronSelectValue).then(setSelectedPlastronData);
    else setSelectedPlastronData(undefined);
  }, [plastronSelectValue])

  useEffect(() => {
    setPlastronSelectValue(undefined);
    setIsPending(true);
    fetchScenarios(setScenarios)
    .then(() => {
      setIsPending(false);
    }).catch(err => {
      props.displayNotif("Pas de réponse du serveur.");
      props.back();
    });

    

    Promise.all(asyncStorageNames.map(str => {
      return AsyncStorage.getItem(str);
    }))
    .then(outputArr => {
      // Recovering if all the required storage variables are present
      const recov = !outputArr.some(el => el == null); // Using a local variable as the state doen't update immediately
      setRecover(recov);
      if(!recov){
        AsyncStorage.clear();
      }
    });


    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => { 
        props.back();
        return true; // When true is returned the event will not be bubbled up & no other back action will execute
      },
    );
    
    // Unsubscribe the listener on unmount
    return () =>{ subscription.remove(); };
  }, []);




  const setUpPlastron = async (
    behaviour:string = 'ask',
    plastronDataPre = selectedPlastronData,
    scenario = simulationId, 
  ) => {
    console.log("setUpPlastron", plastronDataPre); 
    if(!plastronDataPre){
      throw "Emply plastron data";
    }
    let physVars;
    let createdPlastronId; 

    setIsPending(true);
    try{
      try{
        //récupérer l"id du plastron créé
        createdPlastronId = await postPlastronRetex(plastronDataPre);
        setCreatedPlastronId(createdPlastronId)        
           
      } catch (err) {
        if(err == 'exists'){ // Le plastron est déjà dans le Retex
          if(behaviour == 'ask') {
            setOpenAskExists(true);
            throw 'idle';
          } else if (behaviour == 'delete'){
            await deletePreviousPlastronData(plastronDataPre.documentId)
          
            createdPlastronId = await postPlastronRetex(plastronDataPre)
            setCreatedPlastronId(createdPlastronId)   
            setOpenAskExists(false); 
          } else if (behaviour == 'loadBack'){
            // Todo : Switch to localstorage to get previous physvars as server might have been offline
            physVars = await getStorage("lastPhysVars");
            
          }
        } else throw err;
      }
      
      if (behaviour == "loadBack") {
        console.log("behavior", behaviour)
        console.log("loadback", plastronDataPre.groupe.scenario.documentId)
        scenario = plastronDataPre.groupe.scenario.documentId
        setSimulationId(plastronDataPre.groupe.scenario.documentId)
      }
      //on récupère les données de la liste des scénarios 
      let scenarioDocId: string; 
      console.log("scenario", scenario)
    
      const selectedScenario = scenarios.find(
        item => item.documentId.trim() == scenario
      );
      console.log("selected scenario", selectedScenario)
        
      if (!scenario) {
        throw "Emply scenario data";
      }

      //ajouter l'enregistrement du scénario si non existant dans la base de données et le lien au plastron 
      try {
        if (behaviour != "loadBack") {
          if (selectedScenario ) {
            scenarioDocId = await postExerciceRetex(simulationId as string, selectedScenario.titre, selectedScenario.description)
          } else {
            scenarioDocId = await postExerciceRetex(simulationId as string, 'erreur titre', '')
          }
          
          // console.log("Id scénario créé", scenarioDocId); 

          //créer le lien entre le scénario et le plastron
          await connectExercicePlastron(scenarioDocId, createdPlastronId); 

        }

      } catch (err) {
        if(err == 'exists'){ // Le scénario est déjà dans le Retex
          console.log('erreur scenario exist'); 
          //récupérer le dateId du scénario existant 
          if (selectedScenario) {
            //scenario contient le documentId
            const day = new Date(); 
            const dateId = day.toLocaleDateString()+ "-" + scenario; 
            scenarioDocId = await getScenarioId(dateId);
            //créer le lien entre le scénario et le plastron          
            await connectExercicePlastron(scenarioDocId, createdPlastronId); 
          } else throw err;
          
        } else throw err;
      }

      if(behaviour == "loadBack"){
        const actionHistoryArray = await getStorage('actionHistory');
        setActionHistory(new Map(actionHistoryArray.map((item:any) => [item.randomIdentifyer, item])));
      } else {
        // Set the storage of actionHistory to not null in case the app restarts before any action is made
        await setStorage('actionHistory', []);
      }

      if(!physVars){

        if(plastronDataPre.profil.variablesPhysio){
          physVars = plastronDataPre.profil.variablesPhysio.map((physVar) => {
            physVar.valeur = physVar.valeur_defaut; // Starting value is default value
            return physVar;
          })
        }
        else throw 'No physiological variables in plastron';
      }

      await setStorage('lastPlastronId', plastronDataPre.documentId);
      setPlastronPhysEvolutif(physVars);

      // console.log("plastron", plastronDataPre)
     
      const [actions, actionsPlastron, model] = await Promise.all([
        getAllActions(),
        getActionsPlastron(plastronDataPre.modele.documentId),
        getAllModels(plastronDataPre.modele.documentId),
      ]);

      // console.log('action', actionsPlastron)
      console.log('modele', model)
      //TO DO voir pourquoi alors que dans le modèle on a l'action vers la tendance dans le symptome ça ne fonctionne pas 
      
      setActions(actions);

      const seen = new Set();

      const actionsPlastronModif = actionsPlastron
        .filter(item => item.type == 'action' && item.action) // filtre les actions valides
        .map(item => ({
          documentId: item.action.documentId,
          nom: item.action.nom
        }))
        .filter(item => {
          if (!item.documentId || seen.has(item.documentId)) {
            return false;
          }
          seen.add(item.documentId);
          return true;
        });


      const resultat = actionsPlastronModif.map(item => {
        const correspondance = actions.find((obj: { documentId: string; }) => obj.documentId == item.documentId);
        return {
          ...item,
          categorie: correspondance ? correspondance.categorie.nom : null
        };
      }); 
      //stocker les actions modélisées dans le plastron 
      if (behaviour != "loadBack") {
        await putActionPlastron(createdPlastronId, JSON.stringify(resultat));
      }
      

      setModelPlastron(model);
   

      // console.log("Starting simulation");
      // setPlastronData(plastronDataPre);

      // props.forwards();
      // setSetUp(true);
      

      setDownloadPlastron(true); 
      console.log("Chargé ", downloadPlastron); 
    
    } catch (err) {
      if(err != 'idle'){
        console.error("Could not load : "+ err);
        
        if(typeof err == "string") props.displayNotif(err, "error");
      }
    }
    setIsPending(false);

  };

  const startSimulation = async (
    behaviour:string = 'ask',
    plastronDataPre = selectedPlastronData, 
    plastronId = createdPlastronId
  ) => {
    console.log("start simulation")
    if(!plastronDataPre){
      throw "Empty plastron data";
    }
    
    setIsPending(true);
    setPlastronData(plastronDataPre);
    setShouldStartSimulation(true);
  }; 

  useEffect(() => {
  const runAfterSet = async () => {
    if (!shouldStartSimulation || !plastronData) return;

    try {
      console.log("Starting simulation");
      console.log("plastron à lancer", plastronData.documentId);

      await putStatusPlastron(createdPlastronId as string, "Lancé").catch(err => {
        console.log("Could not sync, postponed");
      });

      await Promise.all([
        pushExamenRetex("Start", plastronData.documentId, ['0000']),
        pushVariablesRetex()
      ]).catch(err => {
        console.log("Could not sync, postponed");
      });

      props.forwards();
      setSetUp(true);
    } catch (err) {
      if (err !== 'idle') {
        console.error("Could not load: " + err);
        if (typeof err == "string") props.displayNotif(err, "error");
      }
    } finally {
      setIsPending(false);
      setShouldStartSimulation(false); // reset
    }
  };

  runAfterSet();
}, [shouldStartSimulation, plastronData]);


   
  
  return (
    <>
      <AnimatedModal visibility={openAskExists&&!isPending} onRequestClose={() => {setOpenAskExists(false);}}>
        <AnimatedModal.Content>
          <AnimatedModal.Header closeButton>
            <Text style={baseStyles.h2}>Plastron utilisé</Text>
          </AnimatedModal.Header>
          <AnimatedModal.Body style={{padding: 5}}>
            <Text style={{textAlign: 'center', margin: 10, fontSize: 16}}>Plastron déjà utilisé. Appui long pour confirmer.</Text>
            <View style={[baseStyles.row, {gap: 10, margin: 10}]}>
              <AnimatedButton
              style={[styles.buttonAskExists,styles.buttonDeletePrevious]}
              onPress={warnLongPressReq}
              onLongPress={() => setUpPlastron('delete')}
              >
                <Text style={styles.askExistsButtonText}>Effacer</Text>
              </AnimatedButton>
            </View>
          </AnimatedModal.Body>
        </AnimatedModal.Content>
      </AnimatedModal>

      <AnimatedModal visibility={recover&&!isPending}>
        <AnimatedModal.Content>
          <AnimatedModal.Header>
            <Text style={baseStyles.h2}>Plastron précédent</Text>
          </AnimatedModal.Header>
          <AnimatedModal.Body style={{padding: 5}}>
            <Text style={{textAlign: 'center', margin: 10}}>Un plastron est déjà utilisé sur cet appareil. Continuer avec ce plastron ?</Text>
            <View style={[baseStyles.row, {gap: 10, margin: 10}]}>
              <AnimatedButton
              style={[styles.buttonAskExists,styles.buttonDeletePrevious]}
              onPress={() => {
                setIsPending(true);
                AsyncStorage.clear()
                .then(() => setRecover(false))
                .finally(() => setIsPending(false));
              }}
              >
                <Text style={styles.askExistsButtonText}>Non</Text>
              </AnimatedButton>
                <AnimatedButton
                  style={[styles.buttonAskExists, styles.buttonLoadPrevious]}
                  onPress={() => {
                    setIsPending(true);

                    getStorage('lastPlastronId')
                      .then(getPlatronData)
                      .then(plastronData => {
                        return setUpPlastron('loadBack', plastronData).then(() => plastronData);
                      })
                      .then(plastronData => startSimulation('loadBack', plastronData))
                      .then(() => {
                        props.forwards();
                        setSetUp(true);
                      })
                      .catch(err => {
                        console.error("Erreur pendant le chargement du plastron :", err);
                        props.displayNotif("Erreur de chargement", "error");
                      })
                      .finally(() => {
                        setIsPending(false);
                      });
                  }}
                >
                  <Text style={styles.askExistsButtonText}>Oui</Text>
                </AnimatedButton>

            </View>
          </AnimatedModal.Body>
        </AnimatedModal.Content>
      </AnimatedModal>


      <AnimatedModal visibility={isPending}>
        <AnimatedModal.Content style={{width: 100, height: 100}}>
              <ActivityIndicator style={{margin:10}} size={80} />
        </AnimatedModal.Content>
      </AnimatedModal>
      {/* Header */}
      <View style={elementStyles.headerContain}>
        <AnimatedButton
        style={elementStyles.headerIcon}
        onPress={()=>{props.back()}} 
        >
          <Ionicons name="arrow-back-outline" size={30} color="darkred" />
        </AnimatedButton>
        <View style={{flex: 1}}></View>
      </View>
      
      <Flex h="100%" w="100%" alignItems={'center'} zIndex={3}>
        <HStack>
          { props.orientationHorizontal &&
            <Center w="50%" h="100%" bg="#ffffff" >
              <Image m={4} alt='SIMSSE Logo' source={require('../assets/Logos-01.png')} boxSize={"md"}/>
            </Center>
          }
          <VStack w={props.orientationHorizontal? "50%":"100%"}  h={"100%"} alignItems="center" >
            <ScrollView w="100%" >
              <VStack w="100%" p={8} pt={"30%"} alignItems="center" space={6}>
                <Text style={styles.title}>
                  Mise en place
                </Text>

                { scenarios.length > 0 && 
                  <AnimatedView 
                  animateInOut
                  style={styles.formView} >
                    <Text style={styles.textForm}>Choix de scénario</Text>
                    <Box style={styles.selectContainer} >
                      <Select 
                      padding={3}
                      paddingRight={15}
                      selectedValue={simulationId}
                      placeholder="..."
                      _selectedItem={{
                        endIcon: <CheckIcon color="#2A78CD" size="7"/>
                      }}
                      style={styles.select}
                      borderWidth={0}
                      onValueChange={itemValue => setSimulationId(itemValue)}>
                        {
                        scenarios.map((scenario:any) => (
                          <Select.Item 
                          key={scenario.documentId}
                          label={scenario.titre} 
                          value={scenario.documentId} 
                          fontFamily="Gantari_200ExtraLight"
                          style={styles.selectItem}/>
                        ))}
                      </Select>
                    </Box>
                  </AnimatedView>
                }
                {simulationId && plastronList &&
                  <AnimatedView
                  animateInOut
                  style={styles.formView}>
                    <Text style={styles.textForm}>Choix de plastron</Text>
                    <Box style={styles.selectContainer}>
                      <Select 
                      padding={3}
                      paddingRight={15}
                      borderWidth={0}
                      style={styles.select}
                      color={'#2A78CD'}
                      placeholder="..."
                      selectedValue={selectedPlastronData?.documentId}
                      _selectedItem={{
                        endIcon: <CheckIcon color="#2A78CD" size="5" />
                      }} 
                      onValueChange={itemValue => {
                        setPlastronSelectValue(itemValue);
                      }}>
                        {
                          plastronList.map((plastron) => (
                            <Select.Item
                            key={plastron.documentId}
                            fontFamily="Gantari_200ExtraLight"
                            label={plastron.index != null ?
                              `${plastron.modele.titre}, ${plastron.profil.age} ans (${plastron.index})`
                              :
                              `${plastron.modele.titre}, ${plastron.profil.age} ans`
                            }
                            value={plastron.documentId}
                            style={styles.selectItem}/>
                          ))
                        }
                      </Select>
                    </Box>
                  </AnimatedView>
                }
              </VStack>
              {selectedPlastronData && <>
                <AnimatedView 
                animateInOut
                startValues={{scale: 1, trY: -40}}
                style={styles.cardView}>
                  <View style={typeStyles.cardPlastron}>
                  <Text style={[baseStyles.h2, {textAlign: 'center'}]}>{selectedPlastronData.modele.titre}</Text>
                  <Text style={{marginBottom: 20, textAlign: 'center'}}>{selectedPlastronData.profil.age} ans</Text>
                    <Text style={baseStyles.h3}>Description</Text>
                    <Text style={{marginBottom: 20}}>{selectedPlastronData.modele.description || "Rien à afficher"}</Text>
                    
                    <Text style={baseStyles.h3}>Attendus Formation</Text>
                    <Text>{selectedPlastronData.modele.examen || "Rien à afficher"}</Text>

                    <Text style={baseStyles.h3}>Consignes Plastron</Text>
                    <Text style={{marginBottom: 20}}>{selectedPlastronData.modele.description_cachee || "Rien à afficher"}</Text>
                    
                  </View>
                </AnimatedView>
                {!downloadPlastron ? (
                  <AnimatedButton 
                  animateIn
                  startValues={{scale: 1, trY: -40}}
                  style={[styles.button, {marginBottom: 100}]} 
                  onPress={() => setUpPlastron()}>
                    <Text style={elementStyles.buttonText}>Charger</Text>         
                  </AnimatedButton>
                ) : (
                  <AnimatedButton
                  animateIn
                  startValues={{ scale: 1, trY: -40 }}
                  style={[styles.button, { marginBottom: 100, 
                                            borderWidth: 2, 
                                            borderColor: 'red', // contour rouge
                                            backgroundColor: 'white' // optionnel : fond transparent
                                              }]}
                  onPress={() => startSimulation()}
                >
                  <Text style={[elementStyles.buttonText, { color: 'red' }]}>Lancer</Text>
                </AnimatedButton>
                )}
              </>}
            </ScrollView>
          </VStack>
        </HStack>
      </Flex>
    </>
  );
};

  const styles = StyleSheet.create({
    regularText: {
      flex: 1,
      paddingVertical:12,
      display: 'flex',
      color:"#ffffff",
    },
    title: {
      textAlign:'center',
      paddingVertical: 12,
      marginBottom: 16,
      ...baseStyles.h1,
    },   
    textForm: {
      flex: 1,
      fontSize: 20,
      color: '#fff',
      fontFamily: "Gantari_700Bold",
      textTransform: 'uppercase',
      padding: 3,
    },
    formView:{
      flex: 1,
      width: '100%'
    },
    selectContainer:{
      flex: 1,
      alignItems: 'stretch',
      ...baseStyles.box,
      ...baseStyles.shadow,
    },
    select: {
      flex: 1,
      
      fontFamily:"Gantari_700Bold",
      fontSize: 20,
      marginTop: 1,
      alignItems: 'center',
      ...baseStyles.maincolor,
    },
    selectItem:{
      alignItems: 'center'
    },
    button: {
      paddingHorizontal: 30,
      alignSelf: "center",
      backgroundColor: "white",
      ...elementStyles.button,
    },
    cardView: {
      padding: 20,
    },
    buttonAskExists:{
      maxWidth: 100,
      flex : 1,
      padding: 8,
      borderRadius: 5,
    },
    buttonDeletePrevious:{
      backgroundColor: 'red',
    },
    buttonLoadPrevious:{
      backgroundColor: baseStyles.maincolor.color,
    },
    askExistsButtonText:{
      color: 'white',
      textAlign: 'center',
      ...baseStyles.appBoldFont,
      fontSize: 20,
    }

  });


  
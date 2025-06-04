import axios from "axios";
{/*Package for saving data locally in the device*/} 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlastronData, PlastronPhysVar } from "../types/PlastronData";
import { PlastronModelItem } from "../types/Model";
import { ExamenRetexItem, PhysVarsRetexItem } from "../types/Retex";
import { useEffect, useContext, useRef } from "react";
import { ServerContext } from "../providers/serverContextProvider";
import { PlastronPhysEvolutifContext } from "../providers/plastronPhysEvolutifContextProvider";
import { PlastronDataContext } from "../providers/plastronContextProvider";
import { ActionHistoryContext } from "../providers/actionHistoryContextProvider";
import { Action } from "../types/Actions";
import { setStorage } from "../tools/Storage";
import { useUpdateRef } from "../tools/AppHooks";


const useStrapi = () => {

  const {serverIP} = useContext(ServerContext);
  const {actionHistory, setActionHistory} = useContext(ActionHistoryContext);
  const refActionHistory = useUpdateRef(actionHistory);
    
  {/* Constants to the path of the CHU base and the Strapi Base*/} 
  const apiURLEditor = useRef<string>("");
  const apiURLRetex = useRef<string>("");

  
  const {plastronPhysEvolutif} = useContext(PlastronPhysEvolutifContext);
  const {plastronData} = useContext(PlastronDataContext);
  

  useEffect(() => {
    let usedIp = serverIP || process.env.EXPO_PUBLIC_NETWORK_PATH;
    apiURLEditor.current = `http://${usedIp}:1338`; //pour éviter pictounr
    apiURLRetex.current = `http://${usedIp}:1339`;
  }, [serverIP]);


  const fetchScenarios = async (setScenarios:React.Dispatch<any>) => {
      
    const url = `${apiURLEditor.current}/api/scenarios?fields[0]=documentId&fields[1]=titre&fields[2]=description`;

    const res = await axios.get(url, {
      timeout: 10000,
    });
    setScenarios(res.data.data);

  }


  // Here we access all the data from de CHU DB of a given simulation and save in a variable, so we don't need to have a network through the SIMSSE 
  const getPlastronsByGroup = async (
    scenarioID:string, 
    setPlastronList: React.Dispatch<React.SetStateAction<PlastronData[]>>
  ) => {
    console.log("getPlastronsByGroup");
    try{
      //const url = `${apiURLEditor.current}/query/simsse/sql/SELECT groups as id, groups.EU as eu, groups.psy as psy, groups.UA as ua, groups.implique as implique, groups.UR as ur, groups.scene as scene, groups.x as x, groups.y as y, groups.t0 as t, plastrons AS plastronsId, profiles.age AS age, plastrons.out('aModele').@rid as modelId, plastrons.out('aModele').description as modelDescription,plastrons.out('aModele').title as modelTitle, plastrons.out('aModele').template as template, plastrons.out('aModele').examen as examen, plastrons.out('aModele').triage as triage FROM (MATCH {class: scenario, as: scenario, where: (@rid='${scenarioID}')}.out('seComposeDe'){as: groups}.out('seComposeDe'){as: plastrons}.out('aProfil'){as: profiles} RETURN groups,scenario,plastrons,profiles)`;
      const url = `${apiURLEditor.current}/api/plastrons?
        &populate[modele][fields][0]=documentId
        &populate[modele][fields][1]=titre
        &populate[profil][fields][1]=age
        &fields[0]=documentId
        &fields[1]=index
        &filters[groupe][scenario][documentId][$eq]=${scenarioID}`;
      
      const res = await axios.get(url, {
        timeout: 10000,
      });
      setPlastronList(res.data.data.sort((a:PlastronData,b:PlastronData) => a.index-b.index));
    } catch (error: any) {
      console.error('Error fetching:', error);
    }
  }

  const getPlatronData = async (plastronId: string) => {
    console.log("getPlatronData");
    try{
      const url = `${apiURLEditor.current}/api/plastrons?
      populate[groupe][fields][0]=documentId
      &populate[groupe][fields][1]=t0
      &populate[groupe][fields][2]=EU
      &populate[groupe][fields][3]=UA
      &populate[groupe][fields][4]=UR
      &populate[groupe][fields][5]=psy
      &populate[groupe][fields][6]=implique
      &populate[groupe][fields][7]=scene
      &populate[groupe][populate][scenario][fields][0]=documentId
      &populate[groupe][populate][scenario][fields][1]=titre
      &populate[modele][fields][0]=documentId
      &populate[modele][fields][1]=titre
      &populate[modele][fields][2]=triage
      &populate[modele][fields][3]=description_cachee
      &populate[modele][fields][4]=description
      &populate[modele][fields][5]=titre
      &populate[modele][fields][6]=examen
      &populate[profil][fields][0]=documentId
      &populate[profil][fields][1]=age
      &populate[profil][populate][variablephysio_profils][fields][0]=valeur_defaut
      &populate[profil][populate][variablephysio_profils][fields][1]=min
      &populate[profil][populate][variablephysio_profils][fields][2]=max
      &populate[profil][populate][variablephysio_profils][populate][variablephysio][fields][0]=documentId
      &populate[profil][populate][variablephysio_profils][populate][variablephysio][fields][1]=nom
      &populate[profil][populate][variablephysio_profils][populate][variablephysio][fields][2]=color
      &fields[0]=documentId
      &fields[1]=description
      &fields[2]=index
      &filters[documentId][$eq]=${plastronId}`;
      const res = await axios.get(url, {
        timeout: 10000,
      });
      // Destructure to change organisation
      const { profil: {
        variablephysio_profils,
        ...restProfil
      }, ...restData} = res.data.data[0]

      const physVars = variablephysio_profils.map(({variablephysio, ...physVarObj}:any) => {
        return {
          ...physVarObj,
          // override variablephysio_profils properties with variables property directly
          ...variablephysio
        }
      });

      restData.modele.description = decodeURIComponent(restData.modele.description);
      restData.modele.description_cachee = decodeURIComponent(restData.modele.description_cachee);
      restData.modele.examen = decodeURIComponent(restData.modele.examen);

      return {
        profil:{
          variablesPhysio: physVars,
          ...restProfil
        },
        ...restData
      };;

    } catch (error: any) {
      console.error('Error fetching:', error);
    }
  }


  

  // Here we access all the data from a plastron model (given its id) and save in a variable, so we don't need to have a network through the SIMSSE
  const getModelById = async (modelID:string) => {
    console.log("getModelById");

    const url = `${apiURLEditor.current}/api/event-trend-liens?
      populate[event][fields][0]=documentId
      &populate[event][fields][1]=type
      &populate[event][populate][modele][fields][0]=documentId
      &populate[event][populate][action][fields][0]=documentId
      &populate[event][populate][action][fields][1]=nom
      &populate[trend][fields][0]=documentId
      &populate[trend][fields][1]=valeur
      &populate[trend][fields][2]=cible
      &populate[trend][populate][variablephysio][fields][0]=documentId
      &populate[trend][populate][variablephysio][fields][1]=nom
      &fields[0]=documentId&fields[1]=type&fields[2]=timer
      &filters[event][modele][documentId][$eq]=${modelID}`;
    const res = await axios.get(url, {
      timeout: 10000,
    });
    
    return res.data.data as PlastronModelItem[];
    
      
  }
  {/*Here we access all the possibles actions over a plastron*/} 
  const getAllActions = async () => {
      console.log("getAllActions");
  
      const url = `${apiURLEditor.current}/api/actions?
      populate[categorie][fields][0]=documentId
      &populate[categorie][fields][1]=nom
      &populate[categorie][fields][2]=index
      &fields[0]=documentId
      &fields[1]=nom
      &fields[2]=med
      &fields[3]=paramed
      &fields[4]=secouriste`;
      
      const res = await axios.get(url);
      
      return res.data.data as Action[];


  }
  // Here we save locally the listed data of an intervention to save via strappi API when then simulation ends
  // The function is designed to be runnable from inside of setTimeouts (using refs storing states),
  //   fired in quick succession (avoids the overlapping issue where some actions would nnot be saved)
  // Usecontext could prevent this
  const pushExamenRetex = async (
    content:string|null = null, 
    plastronId:string|null = null, 
    intervenantIds:Array<string>|null = null,
  ) => {
    console.log("plastronId", plastronId)
    const day = new Date();
    
    let addActionsHistory:ExamenRetexItem[] = [];
    if(intervenantIds && plastronId && content){
      intervenantIds.forEach(intervenantId => {
        addActionsHistory.push({
          id: "0",
          attributes: {
            plastronID: plastronId,
            action: content,
            dateMiseAJour: day.toLocaleString(), // string
            intervenantID: intervenantId,
          },
          dateExamen: day,
          randomIdentifyer: Math.floor(Math.random()*10000)
        });
      });
    }
    

    let endWiththrow = false;
    const prePushHistory = refActionHistory.current;
    addActionsHistory.forEach(item => {
      prePushHistory.set(item.randomIdentifyer, item);
    });

    setStorage('actionHistory', Array.from(prePushHistory.values()));

    // Push to retex
    const resultsToSave = Array.from(prePushHistory.values()).filter((item) => item.id == "0");
    
    try{

      await Promise.all(resultsToSave.map(async (item:any,index:any) => {
        const post = await axios.post(
          `${apiURLRetex.current}/api/actions-sur-plastrons`,
          { data: item.attributes }
        );
        resultsToSave[index].id = post.data.data.id; // Will modify the id in the actionStorageArray because points to the same address
       
      }));
    } catch (err) {
      endWiththrow = true;
      console.error("Push error retex : ", err);
    } finally {
      let postPushHistory = refActionHistory.current;
      resultsToSave.forEach(item => postPushHistory.set(item.randomIdentifyer, item));
      
      setActionHistory(postPushHistory);
      
      setStorage('actionHistory',  Array.from(postPushHistory.values()));
      
    }

    if(endWiththrow) throw "Some measurements and actions could not be sent to Retex";

  }



    {/*     
    Same function but with different variables (vital signs of the plastron):
    - pushVariablesRetex
    - varsInPlastron
    - varsInPlastronAsy
    - varArray
    - plastronPhysEvolutif (to access the variables) 

    Less complex as will not be triggered in quick succession and therefore will not show overlapping issues.
    */}
  const pushVariablesRetex = async () => {
    const day = new Date();
    const physVarsString = JSON.stringify(plastronPhysEvolutif);

    const varsHistoryStored = await AsyncStorage.getItem("plastronVarsHistory");
    let varsStorageArray:PhysVarsRetexItem[] = varsHistoryStored != null ?  JSON.parse(varsHistoryStored) : [];

    if(plastronData?.documentId && plastronPhysEvolutif){
      varsStorageArray.push({
        id: "0",
        attributes:{
          plastronID: plastronData?.documentId,
          physVars: physVarsString,
          dateMiseAJour: day.toLocaleString(),
        },
        randomIdentifyer: Math.floor(Math.random()*10000)
      });
    }



    let endWiththrow = false;
    const resultsNotSaved = varsStorageArray.filter((item:any) => item.id == "0");
    try{

      // Here we update the strappi DB with unsaved data
      await Promise.all(resultsNotSaved.map(async (item:any,index:any)=>{
        const post = await axios.post(`${apiURLRetex.current}/api/evolutions-phys-vars`, 
          { data: item.attributes } 
        );
        resultsNotSaved[index].id = post.data.data.id; // Will modify the id in the varsStorageArray because points to the same address
      }))

    } catch (err) {
      endWiththrow = true;
    } finally {
      await AsyncStorage.setItem("plastronVarsHistory", JSON.stringify(varsStorageArray));
    }

    if(endWiththrow) throw "Some physiological variables could not be sent to Retex";
  } 


  const deletePreviousPlastronData = async (plastronId: string) => {
    if(!plastronId){
      throw "Unexpected problem with inner variables of the app";
    }
    const tables = [
      "actions-sur-plastrons",
      "evolutions-phys-vars",
      "plastrons",
    ];
    const deleteRequests = tables.map(async (table) => {
      const url = `${apiURLRetex.current}/api/${table}?filters[plastronID][$eq]=${plastronId}`
      const resultToDelete = await axios.get(url);
      await Promise.all(resultToDelete.data.data.map((item:any) => {

        if(item.id){
          const url = `${apiURLRetex.current}/api/${table}/${item.id}`
          return axios.delete(url);
        } else {
          console.warn("Unexpected : No document ID got for deleting items.");
          return Promise.resolve();
        }
      }));
    });
    
    try{
      await Promise.all(deleteRequests);
    } catch (err) {
      throw "Could not delete : " + err;
    }
  }

  // Pour enregistrer un plastron dans la base de données Retex sans les actions modélisées
  const postPlastronRetex = async (plastron : any ) => {
    console.log("plastron to register", plastron);
    const day = new Date(); 
    const dateId = day.toLocaleDateString()+ "-" + plastron.documentId; 
    try{
      const post = await axios.post(
        `${apiURLRetex.current}/api/plastrons`,
        { 
          data: {
            plastronID: plastron.documentId,
            status : "Chargé",
            dateId : dateId, 
            description : plastron.modele.description, 
            attendues : plastron.modele.examen, 
            descriptionPlastron : plastron.modele.description_cachee, 
            examen : plastron.modele.examen, 
            triage : plastron.modele.triage, 
            titre : plastron.modele.titre + " - " + plastron.index,
            //TO DO à ajouter en changeant la base de données 
            //index : plastron.index
          },
          filters: {
            plastronID: {
              $eq: plastron.documentId
            }
          }
        }
      );

      // Récupérer l'ID du document créé
      const createdId = post.data.data.id;
      return createdId;

    }catch(error: any){
      if(error.response.data.error.message == "This attribute must be unique")
        throw 'exists';
      else {
        console.error(error.response.data);
        throw error
      };
    }
  }
  
  

  const postExerciceRetex = async (scenarioId: string, titre : string, description : string) => {
    const day = new Date(); 
    const dateId = day.toLocaleDateString()+ "-" + scenarioId; 
    try{
      const post = await axios.post(
        `${apiURLRetex.current}/api/exercices`,
        { 
          data: {
            scenarioId: scenarioId,
            titre: titre, 
            description: description, 
            dateId : dateId, 
          },
          filters: {
            scenarioId: {
              $eq: scenarioId
            }
          }
        }
      );

      // Récupérer l'ID du document créé
      const createdId = post.data.data.id;
      return createdId;

    } catch(error: any){
      if(error.response.data.error.message == "This attribute must be unique") 
        throw 'exists';
      else {
        console.error(error.response.data);
        throw error
      };
    }
  }

  const getScenarioId = async (scenariodateId: string) => {
    console.log("getScenarioId");
    //on doit récupérer le dateId et pas l'id 
    try{
      //const url = `${apiURLEditor.current}/query/simsse/sql/SELECT groups as id, groups.EU as eu, groups.psy as psy, groups.UA as ua, groups.implique as implique, groups.UR as ur, groups.scene as scene, groups.x as x, groups.y as y, groups.t0 as t, plastrons AS plastronsId, profiles.age AS age, plastrons.out('aModele').@rid as modelId, plastrons.out('aModele').description as modelDescription,plastrons.out('aModele').title as modelTitle, plastrons.out('aModele').template as template, plastrons.out('aModele').examen as examen, plastrons.out('aModele').triage as triage FROM (MATCH {class: scenario, as: scenario, where: (@rid='${scenarioID}')}.out('seComposeDe'){as: groups}.out('seComposeDe'){as: plastrons}.out('aProfil'){as: profiles} RETURN groups,scenario,plastrons,profiles)`;
      const url = `${apiURLRetex.current}/api/exercices?
        &filters[dateId][$eq]=${scenariodateId}`;
      
      const res = await axios.get(url, {
        timeout: 10000,
      });

      // Récupérer l'ID du document créé
      const createdId = res.data.data[0].id;
      console.log("scenario", res.data.data[0].id); 
      return createdId;
      
    } catch (error: any) {
      console.error('Error fetching scenario:', error);
    }
  }


  const connectExercicePlastron = async (scenarioId: string, plastronId : string) => {
    try{
      const put = await axios.put(
        `${apiURLRetex.current}/api/plastrons/${plastronId}`,
        { 
          data: {
            exercice: {
              id: scenarioId
            }
          },
        }
      );
    } catch(error: any){
      if(error.response.data.error.message == "This attribute must be unique")
        throw 'exists';
      else {
        console.error("erreur dans connect", error.response.data);
        throw error
      };
    }
  }

  //Pour ajouter les actions modélisées dans le plastron dans la bd
  const putActionPlastron = async (plastronId : string, actions : string) => {
    try{
      const put = await axios.put(
        `${apiURLRetex.current}/api/plastrons/${plastronId}`,
        { 
          data: {
            actions: actions
          },
        }
      );
    } catch(error: any){
      if(error.response.data.error.message == "This attribute must be unique")
        throw 'exists';
      else {
        console.error("erreur dans connect", error.response.data);
        throw error
      };
    }
  }

  //pour modifier le statut du plastron 
  const putLancePlastron = async (plastronId : string) => {
    try{
      const put = await axios.put(
        `${apiURLRetex.current}/api/plastrons/${plastronId}`,
        { 
          data: {
            status : "Lancé"
          },
        }
      );
    } catch(error: any){
      if(error.response.data.error.message == "This attribute must be unique")
        throw 'exists';
      else {
        console.error("erreur dans connect", error.response.data);
        throw error
      };
    }
  }


  // TODO : Remmove if CHU rejects bioevent fucntionnality
  /*Here we save the list of all the bioevents from the CHU DB */
  /* const getBioevents = async (bioevents:any, setBioevents: React.Dispatch<any>) =>{
    //const url = `${apiURLEditor.current}/query/simsse/sql/SELECT from bioevent`;
    const url = `${apiURLEditor.current}/api/bioevents?populate[variablephysio][fields][0]=documentId&populate[variablephysio][fields][1]=nom&fields[0]=documentId&fields[1]=nom&fields[2]=valeur&fields[3]=comparaison`;
    try{ 
      console.log("getBioevents");
      const res = await axios.get(url, {
      timeout: 10000,});
      setBioevents(res.data.result);
    } catch (error: any) {
      console.error('Error fetching:', error.response.data);
    }
  } */

  // TODO : Remmove if CHU rejects bioevent fucntionnality
  /*Here we get the bioevents from the strappi base (because there we add a description of its symptomes */
  /* const getBioeventsDesc = async (bioeventsdesc:any, setBioeventsDesc: React.Dispatch<any>) =>{

    const apiUrl = `${apiURLRetex.current}/api/bio-events-plural`;

    axios.get(apiUrl, {
    })
      .then(response => {
        setBioeventsDesc(response.data.data)
      })
      .catch(error => {
        console.error('Error al hacer la solicitud:', error);
      });
  } */

  // Here we manage the triage information of a plastron. If its already attributed by someone it should be showned afterwords */}
  const getLastTriageAction = (plastronID:any) => {
    if (actionHistory) {
      // Filter only actions of triage for a given plastronID
      const accionesDeTriage = Array.from(actionHistory.values()).filter((acc:any) => 
        acc.attributes.action.startsWith('Triage effectué') &&
        acc.attributes.plastronID === plastronID
      );
      // we order the actions chronologically 
      
      accionesDeTriage.sort((a:any, b:any) => new Date(a.attributes.dateMiseAJour).getTime() - new Date(b.attributes.dateMiseAJour).getTime());
      // we get the most recent action
      const ultimaAccionDeTriage = accionesDeTriage[accionesDeTriage.length - 1];
      return ultimaAccionDeTriage;
    }

  };

  return { 
    pushExamenRetex, 
    pushVariablesRetex, 
    getLastTriageAction,
    fetchScenarios, 
    getAllActions,
    getModelById,
    getPlastronsByGroup,
    postPlastronRetex,
    postExerciceRetex,
    getScenarioId,
    connectExercicePlastron, 
    putActionPlastron,
    getPlatronData,
    deletePreviousPlastronData,
    putLancePlastron
  };

};

export default useStrapi;
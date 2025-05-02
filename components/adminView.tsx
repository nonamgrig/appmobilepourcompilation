import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, BackHandler, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { Image } from "native-base";
import { AdminViewProps } from '../types/AdminViewProps';

import {PlastronDataContext} from '../providers/plastronContextProvider';
import { IntervenantsListContext } from '../providers/intervenantsContextProvider';
import { PlastronPhysEvolutifContext } from '../providers/plastronPhysEvolutifContextProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseStyles, elementStyles, typeStyles } from '../styles/globalstyles';
import AnimatedButton from './animated/Button';
import { Ionicons } from '@expo/vector-icons';
import { ExamenRetexItem } from '../types/Retex';
import useStrapi from '../api/strapi';
import { ModelPlastronContext } from '../providers/modelPlastronContextProvider';
import { SetUpContext } from '../providers/setUpContextProvider';
import AnimatedModal from './animated/Modal';
import { ActionHistoryContext } from '../providers/actionHistoryContextProvider';
import { LinearGradient } from 'expo-linear-gradient';
import useResetApp from '../tools/ResetAppHook';
import AnimatedView from './animated/View';



export default function AdminView({ orientationHorizontal, ...props }: AdminViewProps) {
  const adminSemiSecretCode = 6936;
  const secureAdminMode = true; // BUILD : Set to true
  const [locked, setLocked] = useState<boolean>(true);
  const [codeInput, setCodeInput] = useState<number>();

  const { pushExamenRetex, pushVariablesRetex } = useStrapi();

  const {plastronData} = useContext(PlastronDataContext);
  const {intervenantsList} = useContext(IntervenantsListContext);
  const {actionHistory} = useContext(ActionHistoryContext);

  const resetApp = useResetApp();

  

  // UI
  const [isPending, setIsPending] = useState(false);

  const handlePressRetex = async () => {
    if(isPending) return;
    setIsPending(true);
    try{
      await Promise.all([
        pushExamenRetex(
          `Fin de la Simulation`,
          plastronData?.documentId,
          [intervenantsList[0].intervenantID]
        ),
        pushVariablesRetex()
      ]);

      await resetApp();
      props.forwards();
      setIsPending(false);

    } catch(err){
      console.log(err);
      props.displayNotif("Could not sync with Retex, try again.", "error");
    };
  };

  useEffect(() => {


    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        props.back();
        return true; // When true is returned the event will not be bubbled up & no other back action will execute
      },
    );

    
    // Unsubscribe the listener on unmount
    return () =>{ subscription.remove(); };

  }, [])

  useEffect(() => {
    if(codeInput == adminSemiSecretCode){
      setLocked(false);
    }
  }, [codeInput])

  return (
    <>
    <AnimatedModal 
    style={{backgroundColor: baseStyles.lightMainColor.color}} 
    visibility={locked&&secureAdminMode}
    onRequestClose={props.back}
    >  
      <AnimatedModal.Content>
        <AnimatedModal.Header closeButton>
          <Text style={baseStyles.h2}>Code secret</Text>
        </AnimatedModal.Header>
        <AnimatedModal.Body>
          <Text>Veuillez entrer le code secret pour accéder au mode admin.</Text>
          <TextInput
          secureTextEntry={true}
          inputMode="numeric"
          style={[baseStyles.shadowlight, {padding: 5, fontSize: 20}]}
          textAlign='center'
          onChangeText={codestr => setCodeInput(parseInt(codestr))}
          placeholder="Code administrateur"
          onBlur={() => Keyboard.dismiss()}
          />
        </AnimatedModal.Body>
      </AnimatedModal.Content>
    </AnimatedModal>

    <AnimatedModal visibility={isPending}>
      <AnimatedModal.Content style={{width: 100, height: 100}}>
            <ActivityIndicator style={{margin:10}} size={80} />
      </AnimatedModal.Content>
    </AnimatedModal>
    <View style={elementStyles.headerContain}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', baseStyles.maincolor.color]}
        start={{ x: 0.0, y: 1.0 }}
        end={{ x: 0.0, y: 0.0 }}
        locations={[0, 0.3]}
        style={baseStyles.fill}
        />
      <AnimatedButton
      style={elementStyles.headerIcon}
      onPress={()=>{props.back()}} 
      >
        <Ionicons name="arrow-back-outline" size={30} color="darkred" />
      </AnimatedButton>
      <Text style={[
        baseStyles.h1,
        {
          fontSize: 20,
          paddingLeft: 20,
          textAlignVertical: 'center',
          flex: 1,
          textTransform: 'uppercase',
        }
      ]}> 
        Menu Administrateur
      </Text>
    
    </View>
    <View style={styles.background}>
      <Image alt='SIMSSE Logo' source={require('../assets/Logos-02.png')} boxSize={"lg"} opacity={30} />
    </View>
    <ScrollView style={styles.scrollViewHistory}>
      <View style={styles.mainContain}>
        <AnimatedButton 
        style={styles.endButton}
        onPress={handlePressRetex}
        >
          <Text style={styles.endText}>Synchroniser et terminer</Text>
        </AnimatedButton>
        <View style={[typeStyles.cardPlastron, {margin: 20}]}>
          <Text style={[baseStyles.h2, {textAlign: 'center'}]}>{plastronData?.modele.titre}</Text>
          <Text style={{marginBottom: 20, textAlign: 'center'}}>{plastronData?.profil.age} ans</Text>
          <Text style={baseStyles.h3}>Description</Text>
          <Text style={{marginBottom: 20}}>{plastronData?.modele.description || "Rien à afficher"}</Text>
          
          <Text style={baseStyles.h3}>Description cachée</Text>
          <Text>{plastronData?.modele.description_cachee || "Rien à afficher"}</Text>
                          
        </View>
        <Text style={[baseStyles.h3,styles.historyTitle]}>Historique des actions</Text>
        <View style={styles.actionContain}>
          {Array.from(actionHistory.values())?.sort((a, b) => a.dateExamen > b.dateExamen ? -1 : 1)
            .map((actionRetexItem, index) => 
            <View style={styles.actionItem} key={index}>
              { actionRetexItem.id == "0" 
                ? <Ionicons style={styles.cloudIcon} name="cloud-offline-outline" size={30} color={"#a00000"}></Ionicons>
                : <Ionicons style={styles.cloudIcon} name="cloud-done-outline" size={30} color={"#00a000"}></Ionicons>
              }
              <View style={styles.actionInfoContain}>
                <Text>{actionRetexItem.attributes.action.split(" ").slice(0,-1).join(' ')}</Text>
                <Text>{actionRetexItem.attributes.dateMiseAJour}</Text>
                <Text>Intervenant : {actionRetexItem.attributes.intervenantID}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  </>
  );
};

const styles = StyleSheet.create({
  background:{
    ...baseStyles.fill,
    alignItems:'center',
    justifyContent: 'center',
    zIndex:0,
  },
  mainContain:{
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 3,
    paddingBottom: 50,
    paddingTop: elementStyles.headerContain.height,
  },
  endButton:{
    maxWidth: 300,
    padding: 10,
    paddingVertical: 20,
    margin: 2, 
    borderRadius: 10,
    backgroundColor:"white",
    borderWidth: 5,  
    borderColor: "#4CA66B",
    alignItems:"center", 
    justifyContent:"center"
  },
  endText:{
    ...baseStyles.appBoldFont,
    fontSize: 21, 
    color: "#4CA66B",
    textAlign: 'center',
  },
  scrollViewHistory: {
    width: "100%",
    padding: 0,
    flex:1,
  },
  historyTitle:{
    ...baseStyles.lightColor,
    padding: 10,
    paddingTop: 30,
    textAlign: 'center',
  },
  actionContain:{
    padding: 20,
    gap: 10,
    flexDirection: 'column',
    alignItems: 'center',
    width: "100%",
  },
  actionItem: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    gap: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems:'center',
  },
  actionInfoContain:{
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cloudIcon:{
  }
});
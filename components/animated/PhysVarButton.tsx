import { useContext, useState  } from "react";

import AnimatedButton, { AnimatedButtonProps } from "./Button";
import AnimatedView from './View';
import {  Text, ActivityIndicator, Vibration, View } from "react-native";
import { StyleSheet } from 'react-native';
import { baseStyles } from "../../styles/globalstyles";

import { useSetTimeoutManager } from '../../tools/AppHooks';
import { IntervenantsListContext } from "../../providers/intervenantsContextProvider";
import { IntervenantItem } from "../../types/IntervenantsList";

export interface PhysVarButtonProps extends AnimatedButtonProps {
  nom: string,
  valeurs: (string|number)[],
  varColor: string,
  measureFunc: () => void,
};

export default ({nom, valeurs, measureFunc, style, varColor, ...rest}:PhysVarButtonProps) => {
  const activationDelay = 1.5*1000;
  const [loading, setLoading] = useState<boolean>(false);
  
  const {clearAllTimeouts} = useSetTimeoutManager();

  const {intervenantsList, setIntervenantsList} = useContext(IntervenantsListContext);

  const styles = StyleSheet.create({ // Inside of the export because changes depending on the color
    button: {
      flex: 1,
      aspectRatio: "1/1",
      backgroundColor: "white",
      margin: 1,
      borderRadius: 10,
      alignItems: 'center', 
      justifyContent: 'center',
    },
    textVar: {
      ...baseStyles.appFont,
      color: varColor,
      position: "absolute",
      top: 0,
      left: 0,
      margin: 10,
      fontSize: 18,
    },
    textVal: {
      ...baseStyles.appBoldFont,
      color: varColor,
      fontSize: valeurs.length == 1 ? 50 : 30,
    },
    spinnerContain:{
      backgroundColor: "white",
      borderRadius: 100,
      width: 60, height: 60,
      position: 'absolute',
      top: -20,
      elevation: 10,
      shadowColor:"#0005"
    }
  });

  if (intervenantsList.some((intervenant: IntervenantItem) => intervenant.class == "obs")) { //Mode observateur 
      return(
      <AnimatedButton style={styles.button} 
      onPressIn={(event) => {measureFunc()}}>
        <Text key="nom" style={styles.textVar} >
          {nom}: 
        </Text>
    
        { valeurs.length == 2 ?
          (<View style={{
              flexDirection: 'row', 
              alignItems:'center', 
              justifyContent:'center',
              width: '100%',
              paddingTop: 10}}>
            <Text key="val1" style={[styles.textVal, {transform:[{translateY: -7},{translateX: 3}]}]}>
              {valeurs[0]}
            </Text>
            <Text style={styles.textVal}>/</Text>
            <Text key="val2" style={[styles.textVal, {transform:[{translateY: 7},{translateX: -3}]}]}>
              {valeurs[1]}
            </Text>
          </View>)
          :
          (
            <Text key="val" style={styles.textVal}>
              {valeurs.join(" / ")}
            </Text>
          )
        }
          
      </AnimatedButton>
    )

  } else { //Mode joueur 
      return(
      <AnimatedButton 
      style={styles.button} 
      onPressIn={(event) => {
        clearAllTimeouts();
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setTimeout(() => {
            measureFunc();
            Vibration.vibrate(60);
          }, 50);
      }, activationDelay);
      }}
      {...rest}
      >
        <Text key="nom" style={styles.textVar} >
          {nom}:
        </Text>
    
        <AnimatedView 
        animateInOut
        duration={200}
        startValues={{
          opacity: 1,
          trY: 30,
          scale: 0,
        }}
        visibility={loading}
        style={styles.spinnerContain}>
          <ActivityIndicator style={{margin:0}} size={60} color={varColor} />
        </AnimatedView>
        { valeurs.length == 2 ?
          (<View style={{
              flexDirection: 'row', 
              alignItems:'center', 
              justifyContent:'center',
              width: '100%',
              paddingTop: 10}}>
            <Text key="val1" style={[styles.textVal, {transform:[{translateY: -7},{translateX: 3}]}]}>
              {valeurs[0]}
            </Text>
            <Text style={styles.textVal}>/</Text>
            <Text key="val2" style={[styles.textVal, {transform:[{translateY: 7},{translateX: -3}]}]}>
              {valeurs[1]}
            </Text>
          </View>)
          :
          (
            <Text key="val" style={styles.textVal}>
              {valeurs.join(" / ")}
            </Text>
          )
        }
          
      </AnimatedButton>
    )
  }

}


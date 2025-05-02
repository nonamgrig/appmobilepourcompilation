import React, { useContext, useEffect,useState } from 'react';
import { StyleSheet, View, TextInput, Text, Keyboard, TouchableWithoutFeedback} from 'react-native';
import { Image } from "native-base";
import {WelcomeViewProps} from '../types/WelcomeViewProps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlastronPhysEvolutifContext } from '../providers/plastronPhysEvolutifContextProvider';
import { PlastronDataContext } from '../providers/plastronContextProvider';
import { ModelPlastronContext } from '../providers/modelPlastronContextProvider';
import { SetUpContext } from '../providers/setUpContextProvider';
import { PlastronData, PlastronPhysVar } from '../types/PlastronData';
import { ServerContext } from '../providers/serverContextProvider';
import AnimatedButton from './animated/Button';
import { baseStyles } from '../styles/globalstyles';
import useStrapi from '../api/strapi';
import AnimatedView from './animated/View';
import { getStorage, setStorage } from '../tools/Storage';


export default function WelcomeView(props: WelcomeViewProps) {
    
    const {serverIP, setServerIP} = useContext(ServerContext);

    
    const [focusedInput, setFocusedInput] = useState<boolean>(false);


      
    const handlePress = () => {
        props.goSelecting();
    };
   
    
    useEffect(() => {
      getStorage("ip")
      .then(startIp => {
        if(startIp){
          setServerIP(startIp);
        }
      });
    },[]);

    
    // RENDER
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} 
      accessible={false}>
        <AnimatedView
        animateInOut
        style={{paddingTop: 20, paddingBottom: 150 ,flex: 1, backgroundColor: colors.blue, alignItems:'center', justifyContent:'center'}}>
          
            {!focusedInput && <View style={{ position: 'absolute', bottom: 0, width: '100%' ,alignItems: 'center' }}>
              <View style={{flexDirection: 'row'}}>
                    <View style={styles.logoBox}>
                        <Image 
                            source={require("../assets/ECN_logo.png")} 
                            alt="CENTRALE NANTES" 
                            style={{ width: 130, height: 100 }} 
                            resizeMode="contain"
                        />
                    </View>
                    <View style={styles.logoBox}>
                        <Image 
                            source={require("../assets/LogoCHUNew.webp")} 
                            alt="CENTRE HOSPITALIER UNIVERSITAIRE DE NANTES" 
                            style={{ width: 130, height: 100 }} 
                            resizeMode="contain"
                        />
                    </View>
                </View>
                <Text style={[styles.regularText, {marginHorizontal: 20}]}>
                    Produit développé par les étudiants PERFPROJ, PERFECT et INGSANTE de l’Ecole Centrale de Nantes
                </Text>
            </View>}
        
            <Text style={styles.title}>APPUYEZ SUR LE LOGO POUR DÉMARRER</Text>
            <View style={styles.bigButtonContain}>
              <View style={styles.innerBorder}>
                <View style={styles.innermostBorder}>
                  <AnimatedButton style={styles.bigButton} onPress={handlePress} >
                    <Image 
                        source={require("../assets/Logos-02.png")} 
                        alt="SimSSE" 
                        style={{ width: "100%", height: "100%"}} 
                    />
                  </AnimatedButton>
                </View>
              </View>
            </View>
            
            <TextInput
            style={[
              styles.ipInput,
              {
                backgroundColor: focusedInput ? 'white' : "#fff2",
                color: focusedInput ? 'black' : "white",
              }
            ]}
            onChangeText={text => setServerIP(text)}
            placeholder={process.env.EXPO_PUBLIC_NETWORK_PATH}
            placeholderTextColor='#ddd'
            value={serverIP}
            onFocus = {() => {
              setFocusedInput(true);
            }}
            onBlur={() => {
              setStorage("ip", serverIP);
              setFocusedInput(false);
            }}
            />
        </AnimatedView>
      </TouchableWithoutFeedback>
    );
};

// COLORS
const colors = {
  white:      "#FFFFFF",
  blue:       "#3078CD",
  lightBlue:  "#C9E0EE",
  gold:       "#AAD576",
  green :     "#4CA66B",
  pink:       "#EDEEC9",
};

const styles = StyleSheet.create({
  regularText: {
    fontSize: 15,
    paddingVertical:10,
    color: colors.white,
    textAlign:'center',
  },
  title: {
    textAlign:'center',
    fontSize: 24,
    fontWeight: 'bold',
    color:colors.pink,
    marginVertical: 30,
  }, 
  innerBorder: {
    borderRadius: 1000, 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
    borderColor: colors.white,
  },
  innermostBorder: {
      width: '100%',
      height: '100%',
      borderRadius: 1000, 
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 10,
      borderColor: colors.blue,
  },
  bigButtonContain: {
    backgroundColor: 'white',
    borderRadius: 1000,
    width: '90%',
    aspectRatio: '1/1',
  },
  bigButton: {
    backgroundColor: 'white',
    borderRadius: 1000,
    borderWidth: 10,
    borderColor: colors.lightBlue,
    width: '100%',
    aspectRatio: '1/1',
  },
  logoBox: {
      backgroundColor: 'white',
      marginHorizontal: 20,
      padding: 0,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#C9E0EE',
      alignItems: 'center',   
  },
  ipInput:{
    width: "80%",
    ...baseStyles.appBoldFont,
    textAlign: 'center',
    margin: 30,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  jumpInButtons:{
    width: 200,
    margin: 20,
    borderRadius: 5,
    padding: 10,
  },
  jumpInText:{
    textAlign: 'center',
    fontSize: 30,
    ...baseStyles.appBoldFont,
  }
});
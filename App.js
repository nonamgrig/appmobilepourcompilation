import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TextInput, View, Alert } from 'react-native';
import Pages from './components/Pages';
import React, { useState, useEffect, createContext,useContext } from 'react';
import {decode, encode} from 'base-64'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import IntervenantsListContextProvider from './providers/intervenantsContextProvider';
import PlastronDataContextProvider from './providers/plastronContextProvider';
import SetUpContextProvider from './providers/setUpContextProvider';
import ServerContextProvider from './providers/serverContextProvider';
import ActionHistoryContextProvider from './providers/actionHistoryContextProvider';
import ActionsContextProvider from './providers/actionsContextProvider';
import PlastronPhysEvolutifContextProvider from './providers/plastronPhysEvolutifContextProvider';
import { NativeBaseProvider, Box,IconButton, HStack, Text, Icon, Button, Center, ScrollView} from "native-base";
import AppLoading from 'expo-app-loading';
import { useFonts, Gantari_400Regular, Gantari_700Bold, Gantari_900Black, Gantari_200ExtraLight} from '@expo-google-fonts/gantari'; 
import { LogBox } from 'react-native';
import ModelPlastronContextProvider from './providers/modelPlastronContextProvider';
import BioeventsContextProvider from './providers/bioeventsContextProvider';
import { Dimensions, Platform, PixelRatio } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();//Ignore all log notifications

if (!global.btoa) {
    global.btoa = encode;
}

if (!global.atob) {
    global.atob = decode;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Gantari_400Regular,
    Gantari_700Bold,
    Gantari_200ExtraLight,
    Gantari_900Black,
  
  });
  // Ce useEffect se déclenche une fois les polices chargées
  useEffect(() => {
    if (fontsLoaded) {
      console.log("✅ Les polices sont chargées et l'app est affichée !");
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    
    return <AppLoading />;
  }
  return (
    <SafeAreaProvider>
      <ServerContextProvider>
        <SetUpContextProvider>
          <ActionsContextProvider>
            <PlastronDataContextProvider>
              <BioeventsContextProvider>
                  <PlastronPhysEvolutifContextProvider>
                    <ModelPlastronContextProvider>
                      <ActionHistoryContextProvider> 
                        <IntervenantsListContextProvider>
                          <NativeBaseProvider>
                            <>
                            <Box bg='#ffffff' flex={1}>
                              <Pages/>
                            </Box>
                          </>
                          </NativeBaseProvider>
                        </IntervenantsListContextProvider>
                      </ActionHistoryContextProvider>
                    </ModelPlastronContextProvider>
                    </PlastronPhysEvolutifContextProvider>
                </BioeventsContextProvider>
            </PlastronDataContextProvider>
          </ActionsContextProvider>
        </SetUpContextProvider>
      </ServerContextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTopTop:30,
    backgroundColor:'#3078CD',
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

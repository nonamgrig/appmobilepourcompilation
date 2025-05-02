import { createContext, useContext } from 'react';

import { StyleSheet, View, ViewProps, Pressable, StyleProp, ViewStyle } from 'react-native';

import AnimatedView, { AnimatedViewProps } from './View';

import { baseStyles } from '../../styles/globalstyles';
import { CloseIcon } from 'native-base';

type ModalContextType = {
  onRequestClose: ((...args: any) => any)
  visibility: boolean,
};

// Put requestclose in a context to access it from the header subcomponent
export const ModalContext = createContext<ModalContextType>({} as ModalContextType);

interface ModalContextTypeProvider extends ModalContextType {
  children: React.ReactNode
};

// Create a separate provider component, otherwise expo removes the contect after hot reloading for some reason
const ModalContextProvider = ({ children, onRequestClose, visibility }: ModalContextTypeProvider) => {
  return (
    <ModalContext.Provider value={{ onRequestClose, visibility }}>
      {children}
    </ModalContext.Provider>
  );
};


export interface AppModalProps extends AnimatedViewProps{
  style?: StyleProp<ViewStyle>,
  children: React.ReactNode,
  visibility: boolean,
  onRequestClose?: (...args:any) => any,
}

const AnimatedModal = ({children, style, visibility, onRequestClose=() => {}}: AppModalProps) => {
  return (
    <ModalContextProvider onRequestClose={onRequestClose} visibility={visibility}>
      <AnimatedView
      visibility={visibility}
      animateInOut
      startValues={{
        scale: 1,
        opacity: 0,
      }}
      style={[
        modalStyle.container,
        style,
      ]}>
        <Pressable
        onPress={onRequestClose}
        style={[baseStyles.fill, {zIndex: 3}]}
        />
        {children}
      </AnimatedView>
    </ModalContextProvider>
  );
};

AnimatedModal.Content = ({duration=300, style,...rest}:AnimatedViewProps) => {
  const { visibility } = useContext(ModalContext);
  return (
    <AnimatedView
      visibility={visibility}
      animateInOut
      startValues={{
        opacity: 1,
        scale: .8,
      }}
      duration={duration}
      style={[
        {
          backgroundColor: "white",
          borderRadius: 10,
          maxWidth: 400,
          width: "90%",
          maxHeight: "90%"
        },
        style,
        {zIndex: 4} // After everythig = ovveride previous values in case passed
      ]}
      {...rest}
    />
  )
}

interface Headerprops extends ViewProps{
  closeButton?: boolean,
}

AnimatedModal.Header = ({closeButton=false, children, style, ...rest}:Headerprops) => {
  const { onRequestClose } = useContext(ModalContext);

  return <View style={[modalStyle.header, style]} {...rest}>
    {children}
    {closeButton && onRequestClose &&
      <Pressable
      hitSlop={20}
      onPress={onRequestClose}>
        <CloseIcon size="5" mt="0.5"/>
      </Pressable>}
  </View>
};

AnimatedModal.Body = ({style, ...rest}:ViewProps) => {
  return <View style={[modalStyle.body, style]} {...rest}/>
};



const modalStyle = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: 'center', justifyContent: 'center',
    flexDirection: "row",
    padding: 20,
    zIndex: 100,
    ...baseStyles.fill,
  },
  header:{
    padding: 20,
    borderBottomWidth: 2,
    borderColor: "#eee",
    flexDirection:"row",
    justifyContent: "space-between", alignItems: "center"
  },
  body: {
    padding: 20,
  }
});



export default AnimatedModal;
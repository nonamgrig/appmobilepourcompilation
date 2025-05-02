import React, { useEffect, useState, useRef } from 'react';
import { 
  Animated, 
  Pressable, 
  PressableProps, 
  useAnimatedValue,
  StyleProp,
  ViewStyle,
  Easing
} from 'react-native';

export interface AnimatedButtonProps extends PressableProps {
  style?: StyleProp<ViewStyle>,
  animateIn?: boolean,
  startValues?: any,
}


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedButton = ({children, onPressIn, onPressOut, style, ...rest}: AnimatedButtonProps) => {
  const [pressed, setPressed] = useState<boolean>(false);
  const startValues = rest.animateIn ? {
    opacity: rest.startValues?.opacity ? rest.startValues.opacity : 0,
    trY: rest.startValues?.trY ? rest.startValues.trY : 0,
    scale: rest.startValues?.scale ? rest.startValues.scale : .5,
  } : {
    opacity: 1,
    trY: 0,
    scale: 1,
  };
  // const fadeAnimAttr = {
  //   opacity: useRef(useAnimatedValue(startValues.opacity)).current,
  //   trY: useRef(useAnimatedValue(startValues.trY)).current,
  //   scale: useRef(useAnimatedValue(startValues.scale)).current,
  // };

  const fadeAnimAttr = {
    opacity: useRef(new Animated.Value(startValues.opacity)).current, // Utilisation de Animated.Value dans React Native standard
    trY: useRef(new Animated.Value(startValues.trY)).current, // Même chose pour la translation
    scale: useRef(new Animated.Value(startValues.scale)).current, // Et pour l'échelle
  };
  
  const goNormal = (duration: number) => {
    const animations = [
      Animated.timing(fadeAnimAttr.opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true, // Not blocking the JS thread
      }),
      Animated.timing(fadeAnimAttr.trY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimAttr.scale, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ];

    // Run animations in parallel
    Animated.parallel(animations).start();

  };

  const hover = (duration: number) => {
    const animations = [
      Animated.timing(fadeAnimAttr.scale, {
        toValue: 1.04,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ];

    // Run animations in parallel
    Animated.parallel(animations).start();

  };


  // animate when mounted
  useEffect(() => {
    if(rest.animateIn) goNormal(100);
  }, []);

  useEffect(() => {
    if(pressed){
      hover(100);
    } else {
      goNormal(50);
    } 
  }, [pressed])

  return(
    <AnimatedPressable 
      style={[
        {
          backgroundColor: pressed ? "white" : "", // To avoid opacity issues on animations but keep a clean shadow
        },
        style,
        {
          opacity: fadeAnimAttr.opacity,
          transform: [{ translateY: fadeAnimAttr.trY}, {scale: fadeAnimAttr.scale }],
          shadowOffset: {width: 0, height:0},
          elevation: pressed ? 20 : 0,
          shadowColor: '#3393',
        }
      ]}
      onPressIn={event => {
        if(onPressIn) onPressIn(event);
        setPressed(true);
      }}
      onPressOut={event => {
        if(onPressOut) onPressOut(event);
        setPressed(false);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

export default AnimatedButton;
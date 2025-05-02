import React, { useEffect, useState, useRef } from 'react';
import { 
  Animated, 
  View, 
  ViewProps, 
  //useAnimatedValue,
  StyleProp,
  ViewStyle,
  Easing
} from 'react-native';


import { useSetTimeoutManager } from '../../tools/AppHooks';


export type AnimatedFieldsView = {
  opacity?: number,
  trY?: number,
  scale?: number,
}


export interface AnimatedViewProps extends Animated.AnimatedProps<ViewProps> {
  animateInOut?: boolean,
  startValues?: AnimatedFieldsView,
  duration?: number,
  delay?: number,
  outSpeedFactor?: number,
  visibility?: boolean
}

const AnimatedView = ({
  visibility = true, 
  animateInOut, 
  startValues, 
  children, 
  duration=100,
  outSpeedFactor=1.2,
  delay=0, 
  style,
  ...rest
}: AnimatedViewProps) => {
  const [innerVisibility, setInnerVisibility] = useState<boolean>(visibility);
  
  const {setReactTimeout, clearAllTimeouts} = useSetTimeoutManager();

  const fieldsAnimateStart:AnimatedFieldsView = { opacity: 0, trY: 0, scale: 0.8 };
  const fieldstNoAnimation:AnimatedFieldsView = { opacity: 1, trY: 0, scale: 1 };
  startValues = animateInOut ? { ...fieldsAnimateStart, ...startValues } : fieldstNoAnimation;



  // const animAttr = {
  //   opacity: useAnimatedValue(startValues.opacity!),
  //   trY: useAnimatedValue(startValues.trY!),
  //   scale: useAnimatedValue(startValues.scale!),
  // };

  const animAttr = {
    opacity: useRef(new Animated.Value(startValues.opacity!)).current,
    trY: useRef(new Animated.Value(startValues.trY!)).current,
    scale: useRef(new Animated.Value(startValues.scale!)).current,
  };
  

  const setInitalvalues = () => {
    if (startValues) {
      animAttr.opacity.setValue(startValues.opacity!);
      animAttr.trY.setValue(startValues.trY!);
      animAttr.scale.setValue(startValues.scale!);
    } else {
      console.error("startValues is undefined");
    }
  }

  const comeIn = (duration: number) => {
    setInitalvalues();
    const animations = [
      Animated.timing(animAttr.opacity, {
        toValue: 1,
        duration: duration*1.2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true, // Not blocking the JS thread
      }),
      Animated.timing(animAttr.trY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animAttr.scale, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    // Run animations in parallel
    Animated.sequence([
      Animated.delay(delay),  // Pure delay
      Animated.parallel(animations)
    ]).start();


  };

  const dismiss = (duration: number) => {
    const animations = startValues ? [
  Animated.timing(animAttr.opacity, {
    toValue: startValues.opacity!,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true, // Not blocking the JS thread
  }),
  Animated.timing(animAttr.trY, {
    toValue: startValues.trY!,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }),
  Animated.timing(animAttr.scale, {
    toValue: startValues.scale!,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }),
] : [];

    // Run animations in parallel
    Animated.sequence([
      Animated.parallel(animations)
    ]).start();

  };

  useEffect(() => {
    if(visibility) {
      clearAllTimeouts();
      setReactTimeout(() => setInnerVisibility(true), delay);
      if (animateInOut) comeIn(duration);
    }
    else {
      if(animateInOut) dismiss(duration/outSpeedFactor);
      clearAllTimeouts();
      setReactTimeout(() => setInnerVisibility(false), duration/outSpeedFactor+.2);
    }
  }, [visibility])

  // return innerVisibility && (
  //   <Animated.View 
  //     style={[style,
  //       {
  //         overflow: 'visible',
  //         opacity: animAttr.opacity,
  //         transform: [{ translateY: animAttr.trY }, {scale: animAttr.scale}]
  //       }
  //     ]}
  //     {...rest}
  //   >
  //     {children}
  //   </Animated.View>
  // );

  return innerVisibility ? (
    <Animated.View
      style={[
        style,
        {
          overflow: 'visible',
          opacity: animAttr.opacity,
          transform: [{ translateY: animAttr.trY }, { scale: animAttr.scale }],
        },
      ]}
      {...rest}
    >
      {children}
    </Animated.View>
  ) : null; // Utilise null pour ne rien afficher
  
}


export default AnimatedView;
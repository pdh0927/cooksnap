import { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
}

export default function AnimatedPressable({ style, scaleValue = 0.97, children, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = (e: any) => {
    Animated.timing(scale, {
      toValue: scaleValue,
      duration: 80,
      useNativeDriver: true,
    }).start();
    rest.onPressIn?.(e);
  };

  const onPressOut = (e: any) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    rest.onPressOut?.(e);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable style={style} {...rest} onPressIn={onPressIn} onPressOut={onPressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

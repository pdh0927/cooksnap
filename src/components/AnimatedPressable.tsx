import { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle, StyleSheet, GestureResponderEvent } from "react-native";

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
}

export default function AnimatedPressable({ style, scaleValue = 0.97, children, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = (e: GestureResponderEvent) => {
    Animated.timing(scale, {
      toValue: scaleValue,
      duration: 80,
      useNativeDriver: true,
    }).start();
    rest.onPressIn?.(e);
  };

  const onPressOut = (e: GestureResponderEvent) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    rest.onPressOut?.(e);
  };

  // Extract layout-related styles for the outer Animated.View
  // so that width/height/flex/margin work correctly with parent layout
  const flatStyle = StyleSheet.flatten(style) || {};
  const {
    // Dimensions
    width, height, minWidth, minHeight, maxWidth, maxHeight,
    // Flex layout
    flex, flexGrow, flexShrink, flexBasis, alignSelf,
    // Margins
    margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical,
    // Positioning
    position, zIndex, top, bottom, left, right,
    // Overflow
    overflow,
    ...innerStyle
  } = flatStyle as any;

  const layoutKeys = {
    width, height, minWidth, minHeight, maxWidth, maxHeight,
    flex, flexGrow, flexShrink, flexBasis, alignSelf,
    margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical,
    position, zIndex, top, bottom, left, right,
    overflow,
  };

  const outerStyle: any = { transform: [{ scale }] };
  for (const [k, v] of Object.entries(layoutKeys)) {
    if (v !== undefined) outerStyle[k] = v;
  }

  return (
    <Animated.View style={outerStyle}>
      <Pressable style={innerStyle} {...rest} onPressIn={onPressIn} onPressOut={onPressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

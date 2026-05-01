import { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle, StyleSheet } from "react-native";

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

  // Extract layout-related styles for the outer Animated.View
  // so that width/height/flex/margin work correctly with parent layout
  const flatStyle = StyleSheet.flatten(style) || {};
  const { width, height, flex, flexGrow, flexShrink, flexBasis, alignSelf, margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, ...innerStyle } = flatStyle as any;

  const outerStyle: any = { transform: [{ scale }] };
  if (width !== undefined) outerStyle.width = width;
  if (height !== undefined) outerStyle.height = height;
  if (flex !== undefined) outerStyle.flex = flex;
  if (flexGrow !== undefined) outerStyle.flexGrow = flexGrow;
  if (flexShrink !== undefined) outerStyle.flexShrink = flexShrink;
  if (flexBasis !== undefined) outerStyle.flexBasis = flexBasis;
  if (alignSelf !== undefined) outerStyle.alignSelf = alignSelf;
  if (margin !== undefined) outerStyle.margin = margin;
  if (marginTop !== undefined) outerStyle.marginTop = marginTop;
  if (marginBottom !== undefined) outerStyle.marginBottom = marginBottom;
  if (marginLeft !== undefined) outerStyle.marginLeft = marginLeft;
  if (marginRight !== undefined) outerStyle.marginRight = marginRight;
  if (marginHorizontal !== undefined) outerStyle.marginHorizontal = marginHorizontal;
  if (marginVertical !== undefined) outerStyle.marginVertical = marginVertical;

  return (
    <Animated.View style={outerStyle}>
      <Pressable style={innerStyle} {...rest} onPressIn={onPressIn} onPressOut={onPressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

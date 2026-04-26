import { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";
import { colors } from "../theme";

interface Props {
  size?: number;
  color?: string;
}

export default function Spinner({ size = 48, color = colors.accent }: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2.5,
        borderColor: colors.gray200,
        borderTopColor: color,
        transform: [{ rotate: spin }],
      }}
    />
  );
}

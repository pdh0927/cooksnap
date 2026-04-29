import { View, Image, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, size } from "../theme";

interface Props {
  thumbnailUrl?: string | null;
  gradientColors: [string, string];
  emoji: string;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export default function RecipeThumb({
  thumbnailUrl,
  gradientColors,
  emoji,
  width = size.thumb,
  height = size.thumb,
  borderRadius = radius.xl,
}: Props) {
  const sizeStyle = width ? { width, height } : { height, width: "100%" as const };

  if (thumbnailUrl) {
    return (
      <View style={[s.container, sizeStyle, { borderRadius }]}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={[s.image, sizeStyle, { borderRadius }]}
          resizeMode="cover"
        />
        <View style={s.playBadge}>
          <Ionicons name="play" size={8} color={colors.white} />
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[sizeStyle, { borderRadius, alignItems: "center", justifyContent: "center" }]}
    >
      <Text style={{ fontSize: Math.round((width || 100) * 0.4) }}>{emoji}</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  image: {
    backgroundColor: colors.gray100,
  },
  playBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

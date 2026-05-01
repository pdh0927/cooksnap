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
  fullWidth?: boolean;
  borderRadius?: number;
  sourceType?: string | null;
}

export default function RecipeThumb({
  thumbnailUrl,
  gradientColors,
  emoji,
  width,
  height,
  fullWidth = false,
  borderRadius = radius.xl,
  sourceType,
}: Props) {
  const w = fullWidth ? undefined : (width ?? size.thumb);
  const h = height ?? size.thumb;
  const containerStyle = fullWidth
    ? { width: "100%" as const, height: h, borderRadius }
    : { width: w!, height: h, borderRadius };

  if (thumbnailUrl) {
    return (
      <View style={[s.container, containerStyle]}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={[s.image, { width: "100%" as const, height: h, borderRadius }]}
          resizeMode="cover"
        />
        {sourceType === "youtube" && (
          <View style={s.playBadge}>
            <Ionicons name="play" size={8} color={colors.white} />
          </View>
        )}
      </View>
    );
  }

  const emojiSize = Math.round(h * 0.3);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[containerStyle, { alignItems: "center", justifyContent: "center" }]}
    >
      <View style={[s.emojiWrap, { width: h * 0.45, height: h * 0.45, borderRadius: h * 0.225 }]}>
        <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
      </View>
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
  emojiWrap: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

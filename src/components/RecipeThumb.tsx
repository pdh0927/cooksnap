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
  sourceType?: string | null;
}

export default function RecipeThumb({
  thumbnailUrl,
  gradientColors,
  emoji,
  width = size.thumb,
  height = size.thumb,
  borderRadius = radius.xl,
  sourceType,
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
        {sourceType === "youtube" && (
          <View style={s.playBadge}>
            <Ionicons name="play" size={8} color={colors.white} />
          </View>
        )}
      </View>
    );
  }

  const refDim = Math.min(width || height || 100, height || width || 100);
  const emojiSize = Math.round(refDim * 0.28);
  const wrapSize = Math.round(refDim * 0.48);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[sizeStyle, { borderRadius, alignItems: "center", justifyContent: "center" }]}
    >
      <View style={[s.emojiWrap, { width: wrapSize, height: wrapSize, borderRadius: wrapSize / 2 }]}>
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

import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useShoppingList, ShoppingItem } from "../../src/store/shoppingStore";
import { colors, typo, space, radius } from "../../src/theme";

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { items, toggleItem, clearChecked, clearAll } = useShoppingList();

  const checkedCount = items.filter((i) => i.checked).length;

  // Group by recipeTitle
  const grouped: Record<string, ShoppingItem[]> = {};
  for (const item of items) {
    const key = item.recipeTitle;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  const groupKeys = Object.keys(grouped);

  function handleClearChecked() {
    if (checkedCount === 0) return;
    Alert.alert(
      "체크된 항목 삭제",
      `${checkedCount}개 항목을 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: clearChecked },
      ]
    );
  }

  function handleClearAll() {
    if (items.length === 0) return;
    Alert.alert(
      "전체 삭제",
      "장보기 목록을 모두 삭제할까요?",
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: clearAll },
      ]
    );
  }

  function formatAmount(amount: number, unit: string): string {
    if (amount === 0) return unit;
    const display = amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
    return `${display}${unit}`;
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[typo.screenTitle, { color: colors.textPrimary }]}>장보기</Text>
        {items.length > 0 && (
          <Pressable onPress={handleClearAll} hitSlop={8}>
            <Text style={[typo.body2, { color: colors.textTertiary }]}>전체 삭제</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 44, marginBottom: space.xl }}>🛒</Text>
            <Text style={[typo.heading3, { color: colors.textPrimary, marginBottom: space.md }]}>
              장보기 목록이 비어있어요
            </Text>
            <Text style={[typo.body2, { color: colors.textTertiary, textAlign: "center", lineHeight: 22 }]}>
              레시피에서 재료를 추가해보세요
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {groupKeys.map((title) => (
            <View key={title} style={s.card}>
              <Text style={[typo.caption2, { color: colors.textTertiary, marginBottom: space.lg }]}>
                {title}
              </Text>
              {grouped[title].map((item, i) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={[
                    s.itemRow,
                    i === grouped[title].length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Ionicons
                    name={item.checked ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={item.checked ? colors.green : colors.gray300}
                  />
                  <Text
                    style={[
                      typo.body1,
                      { flex: 1, color: item.checked ? colors.textDisabled : colors.textPrimary },
                      item.checked && s.strikethrough,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      typo.body2Bold,
                      { color: item.checked ? colors.textDisabled : colors.textTertiary },
                      item.checked && s.strikethrough,
                    ]}
                  >
                    {formatAmount(item.amount, item.unit)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}

          {checkedCount > 0 && (
            <Pressable onPress={handleClearChecked} style={s.clearBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.red} />
              <Text style={[typo.body2Bold, { color: colors.red }]}>
                체크된 항목 삭제 ({checkedCount})
              </Text>
            </Pressable>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyWrap: { padding: space.gutter },
  emptyCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.x4,
    alignItems: "center",
  },
  scroll: { padding: space.gutter, gap: space.cardGap },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    padding: space.cardPad,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xxl,
    paddingVertical: space.xl,
  },
});

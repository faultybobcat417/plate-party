import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

export type FeedTab = "stake" | "myFeed";

export interface FeedTopTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const TABS: { key: FeedTab; label: string }[] = [
  { key: "stake", label: "🥩 STEAK" },
  { key: "myFeed", label: "🌱 GROW" },
];

export function FeedTopTabs({ activeTab, onTabChange }: FeedTopTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            testID={`feed-tab-${tab.key}`}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabChange(tab.key)}
            style={styles.tabPressable}
          >
            <View style={styles.tabInner}>
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.activeText : styles.inactiveText,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 44,
    backgroundColor: colors.linen[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.ash[200],
  },
  tabPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  activeText: {
    color: colors.ink[900],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  inactiveText: {
    color: colors.ash[500],
    fontWeight: typography.weights.medium,
  },
  indicator: {
    marginTop: spacing[1],
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.glaze[600],
  },
});

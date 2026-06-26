import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors, typography, spacing } from "../../theme";

export default function EnterStakeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { stakeId, title, creator } = route.params as any;

  const [proof, setProof] = useState("");
  const [plates, setPlates] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!proof.trim()) {
      Alert.alert("Missing proof", "Describe how you completed this stake.");
      return;
    }
    setSubmitting(true);
    // TODO: wire to actual API
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert("Submitted!", "Your entry is pending review.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }, 800);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral[0] }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing[4] }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing[4] }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ fontSize: typography.sizes.xl, color: colors.neutral[500] }}>←</Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.semibold,
                color: colors.neutral[900],
                marginLeft: spacing[3],
              }}
            >
              Submit Entry
            </Text>
          </View>

          {/* Stake Info Card */}
          <View
            style={{
              backgroundColor: colors.primary.light,
              borderRadius: 12,
              padding: spacing[4],
              marginBottom: spacing[5],
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.semibold,
                color: colors.primary.dark,
                marginBottom: spacing[1],
              }}
            >
              {title}
            </Text>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.neutral[500] }}>
              Created by {creator}
            </Text>
          </View>

          {/* Proof Input */}
          <Text
            style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.neutral[900],
              marginBottom: spacing[2],
            }}
          >
            How did you complete this? *
          </Text>
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="e.g. I ran 5K in 28 minutes and attached a screenshot from Strava..."
            placeholderTextColor={colors.neutral[400]}
            value={proof}
            onChangeText={setProof}
            style={{
              backgroundColor: colors.neutral[50],
              borderRadius: 12,
              padding: spacing[3],
              fontSize: typography.sizes.base,
              color: colors.neutral[900],
              textAlignVertical: "top",
              minHeight: 100,
              marginBottom: spacing[4],
            }}
          />

          {/* Plates Wagered */}
          <Text
            style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.neutral[900],
              marginBottom: spacing[2],
            }}
          >
            Plates to stake (optional)
          </Text>
          <TextInput
            placeholder="0"
            placeholderTextColor={colors.neutral[400]}
            keyboardType="number-pad"
            value={plates}
            onChangeText={setPlates}
            style={{
              backgroundColor: colors.neutral[50],
              borderRadius: 12,
              padding: spacing[3],
              fontSize: typography.sizes.base,
              color: colors.neutral[900],
              marginBottom: spacing[5],
            }}
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: submitting ? colors.neutral[300] : colors.primary.base,
              borderRadius: 12,
              paddingVertical: spacing[3],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.bold,
                color: colors.neutral[0],
              }}
            >
              {submitting ? "Submitting..." : "Submit Entry"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

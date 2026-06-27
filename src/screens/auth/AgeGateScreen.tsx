import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";

interface AgeGateScreenProps {
  onPassed: () => void;
}

export function AgeGateScreen({ onPassed }: AgeGateScreenProps) {
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const { signInAnonymously } = useAuth();

  const calculateAge = (birth: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleConfirm = async () => {
    const age = calculateAge(birthDate);
    if (age < 13) {
      Alert.alert(
        "Age Restriction",
        "You must be at least 13 years old to use Plate Party."
      );
      return;
    }
    try {
      await signInAnonymously();
      onPassed();
    } catch (error) {
      Alert.alert("Error", "Failed to create session. Please try again.");
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Plate Party</Text>
      <Text style={styles.subtitle}>Please confirm your age to continue</Text>

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateButtonText}>
          {birthDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>I am 13 or older</Text>
      </TouchableOpacity>

      <Text style={styles.legalText}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Plate Party is intended for entertainment purposes only.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
  },
  dateButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 24,
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  confirmButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontWeight: "bold",
  },
  legalText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AgeGateScreenProps {
  onAgeVerified: () => void;
}

export function AgeGateScreen({ onAgeVerified }: AgeGateScreenProps) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleVerify = () => {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      Alert.alert('Age Restriction', 'You must be at least 13 years old to use Plate Party.');
      return;
    }
    
    onAgeVerified();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Plate Party</Text>
      <Text style={styles.subtitle}>Please confirm your age</Text>
      
      <Button title="Select Birth Date" onPress={() => setShowPicker(true)} />
      
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
      
      <Text style={styles.dateText}>
        Selected: {date.toLocaleDateString()}
      </Text>
      
      <Button title="Continue" onPress={handleVerify} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    marginVertical: 10,
  },
});

export default AgeGateScreen;

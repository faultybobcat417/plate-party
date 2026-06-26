import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../stores/useUserStore';
import { colors, spacing, typography } from '../../theme';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      Alert.alert('Saved', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen[50], padding: spacing[3] }}>
      <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.ink[900], marginBottom: spacing[3] }}>Edit Profile</Text>
      
      <Text style={{ fontSize: typography.sizes.sm, color: colors.ink[400], marginBottom: spacing[1] }}>Display Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ backgroundColor: colors.linen[100], padding: spacing[2], borderRadius: 8, fontSize: typography.sizes.base, color: colors.ink[900], marginBottom: spacing[3] }}
      />

      <Text style={{ fontSize: typography.sizes.sm, color: colors.ink[400], marginBottom: spacing[1] }}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={{ backgroundColor: colors.linen[100], padding: spacing[2], borderRadius: 8, fontSize: typography.sizes.base, color: colors.ink[900], marginBottom: spacing[3] }}
      />

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{ backgroundColor: colors.gold, padding: spacing[3], borderRadius: 8, alignItems: 'center', marginTop: spacing[2] }}
      >
        <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', color: '#FFFFFF' }}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../stores/useUserStore';
import { colors, spacing, typography } from '../../theme';

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, fetchUserProfile, logout } = useUserStore();
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      await fetchUserProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditProfile' as any);
  }, [navigation]);

  const handleLeaderboard = useCallback(() => {
    navigation.navigate('GiverLeaderboard' as any);
  }, [navigation]);

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings' as any);
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'Failed to logout.');
          }
        },
      },
    ]);
  }, [logout]);

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.linen[50] }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen[50] }}>
      {/* Header */}
      <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gold, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>{user.avatar || '👤'}</Text>
        </View>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900], marginTop: spacing[2] }}>
          {user.name || 'Guest'}
        </Text>
        <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginTop: spacing[1] }}>
          @{user.username || 'user'}
        </Text>
        <TouchableOpacity onPress={handleEdit} style={{ marginTop: spacing[2] }}>
          <Text style={{ color: colors.gold, fontSize: typography.sizes.base, fontWeight: typography.weights.medium }}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.linen[100], borderRadius: 12, padding: spacing[3], marginHorizontal: spacing[3], marginBottom: spacing[3] }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.ink[900] }}>{user.plates ?? 0}</Text>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, color: colors.ink[400], marginTop: spacing[1] }}>Plates</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.ink[900] }}>{user.betsPlaced ?? 0}</Text>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, color: colors.ink[400], marginTop: spacing[1] }}>Bets</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.ink[900] }}>{user.wins ?? 0}</Text>
          <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, color: colors.ink[400], marginTop: spacing[1] }}>Wins</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={{ paddingHorizontal: spacing[3], marginBottom: spacing[3] }}>
        <TouchableOpacity
          onPress={handleLeaderboard}
          style={{
            backgroundColor: colors.linen[100],
            padding: spacing[3],
            borderRadius: 8,
            marginVertical: spacing[1],
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, color: colors.ink[900] }}>🏆 Top Givers</Text>
          <Text style={{ color: colors.gold, fontSize: typography.sizes.base }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSettings}
          style={{
            backgroundColor: colors.linen[100],
            padding: spacing[3],
            borderRadius: 8,
            marginVertical: spacing[1],
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, color: colors.ink[900] }}>⚙️ Settings</Text>
          <Text style={{ color: colors.gold, fontSize: typography.sizes.base }}>›</Text>
        </TouchableOpacity>
      </View>


      {/* Organizations */}
      <View style={{ paddingHorizontal: spacing[3], marginBottom: spacing[3] }}>
        <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.ink[900], marginBottom: spacing[2] }}>🌍 Our Partners</Text>
        {[
          { name: "Red Cross", plates: 12450, color: "#E74C3C" },
          { name: "UNICEF", plates: 8930, color: "#00AEEF" },
          { name: "WWF", plates: 5670, color: "#000" },
          { name: "Salvation Army", plates: 3210, color: "#0072CE" },
        ].map((org) => (
          <View key={org.name} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.linen[100], padding: spacing[2], borderRadius: 8, marginVertical: spacing[1] }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: org.color + '20', justifyContent: 'center', alignItems: 'center', marginRight: spacing[2] }}>
              <Text style={{ fontSize: 16 }}>🏛️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.ink[900] }}>{org.name}</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.ink[400] }}>{org.plates.toLocaleString()} plates donated</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Submit Plates */}
      <View style={{ paddingHorizontal: spacing[3], marginBottom: spacing[3] }}>
        <TouchableOpacity
          onPress={() => Alert.alert('Submit Plates', 'Choose how many plates to donate:', [
            { text: '10 plates', onPress: () => Alert.alert('Thanks!', 'You submitted 10 plates.') },
            { text: '50 plates', onPress: () => Alert.alert('Thanks!', 'You submitted 50 plates.') },
            { text: '100 plates', onPress: () => Alert.alert('Thanks!', 'You submitted 100 plates.') },
            { text: 'Cancel', style: 'cancel' },
          ])}
          style={{ backgroundColor: colors.gold, padding: spacing[3], borderRadius: 8, alignItems: 'center' }}
        >
          <Text style={{ fontSize: typography.sizes.base, fontWeight: 'bold', color: '#FFFFFF' }}>🍽️ Submit Plates</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={{ paddingHorizontal: spacing[3], marginBottom: spacing[4] }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: colors.lose + '15',
            paddingVertical: spacing[3],
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.lose, fontSize: typography.sizes.base, fontWeight: typography.weights.medium }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

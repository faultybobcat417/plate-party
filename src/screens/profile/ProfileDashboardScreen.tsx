import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useStreakStore } from '../../stores/useStreakStore';
import { ImpactVault } from '../../components/profile/ImpactVault';

export const ProfileDashboardScreen = () => {
  const { platesEarned, firstGoal } = useOnboardingStore();
  const streaks = useStreakStore((state) => state.streaks);
  const totalStreak = Object.values(streaks).reduce(
    (acc, s) => acc + s.currentStreak,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>🍽️ Balance</Text>
          <Text style={styles.balance}>{platesEarned}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Win Rate" value="67%" />
          <Stat label="Total Bets" value="12" />
          <Stat label="Active" value="3" />
          <Stat label="Streak" value={totalStreak.toString()} />
        </View>

        <ImpactVault totalPlates={platesEarned} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.empty}>No recent activity</Text>
        </View>

        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={styles.settingsText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { padding: 20 },
  balanceBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 16, color: '#888' },
  balance: { fontSize: 48, fontWeight: '800', color: '#34C759' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888' },
  section: { marginVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  empty: { color: '#888', textAlign: 'center', paddingVertical: 20 },
  settingsBtn: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsText: { fontWeight: '600' },
});

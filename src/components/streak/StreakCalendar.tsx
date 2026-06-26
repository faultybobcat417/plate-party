import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStreakStore } from '../../stores/useStreakStore';

interface Props {
  challengeId: string;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const StreakCalendar: React.FC<Props> = ({ challengeId }) => {
  const data = useStreakStore((state) => state.getCalendarData(challengeId));
  // group into weeks
  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      <View style={styles.daysHeader}>
        {DAYS.map((d) => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            let bg = '#E0E0E0';
            if (day.status === 'check') bg = '#34C759';
            else if (day.status === 'today') bg = '#FFD700';
            else if (day.status === 'freeze') bg = '#4A90D9';
            return (
              <View key={di} style={[styles.cell, { backgroundColor: bg }]} />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#FFF', borderRadius: 12 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayLabel: { fontSize: 12, fontWeight: '600', color: '#888' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 2 },
  cell: { width: 28, height: 28, borderRadius: 4 },
});

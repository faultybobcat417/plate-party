import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  available: number;
  onUse: () => void;
  onClose: () => void;
}

export const StreakFreezeModal: React.FC<Props> = ({
  visible,
  available,
  onUse,
  onClose,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Use Streak Freeze?</Text>
          <Text style={styles.body}>
            Spend 200 plates to save your streak for 1 day. You have {available}{' '}
            freezes left.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onClose}
            >
              <Text style={styles.btnSecondaryText}>Let it break</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={onUse}
              disabled={available <= 0}
            >
              <Text style={styles.btnPrimaryText}>Use Freeze (200 plates)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 16, color: '#555', marginBottom: 24 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#34C759', marginLeft: 8 },
  btnSecondary: { backgroundColor: '#F0F0F0' },
  btnPrimaryText: { color: '#FFF', fontWeight: '700' },
  btnSecondaryText: { color: '#1A1A1A', fontWeight: '600' },
});

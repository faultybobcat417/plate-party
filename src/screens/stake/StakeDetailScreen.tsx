import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../stores/useUserStore';
import { useStakeStore } from '../../stores/useStakeStore';
import { postLedgerTransaction } from '../../api/ledger';
import { colors, spacing, typography } from '../../theme';
import { StakeCompetition } from '../../types/stake';
import { SaveForLaterButton } from '../../components/SaveForLaterButton';
import { EnterCompetitionButton } from '../../components/EnterCompetitionButton';
import { CreatorPickWinner } from '../../components/CreatorPickWinner';

export function StakeDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { stakeId } = route.params as { stakeId: string };
  const { user } = useUserStore();
  const { competitions, fetchCompetitionById, enterCompetition, pickWinner } = useStakeStore();
  const [competition, setCompetition] = useState<StakeCompetition | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);

  const loadCompetition = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompetitionById(stakeId);
      setCompetition(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load competition details.');
    } finally {
      setLoading(false);
    }
  }, [stakeId, fetchCompetitionById]);

  useEffect(() => {
    let mounted = true;
    loadCompetition();
    return () => { mounted = false; };
  }, [loadCompetition]);

  const handleEnter = useCallback(async () => {
    if (!competition) return;
    setIsEntering(true);
    try {
      await enterCompetition(competition.id);
      Alert.alert('Success', 'You have entered the competition!');
      await loadCompetition();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enter competition.');
    } finally {
      setIsEntering(false);
    }
  }, [competition, enterCompetition, loadCompetition]);

  const handlePickWinner = useCallback(async (entryId: string) => {
    if (!competition) return;
    try {
      await pickWinner(competition.id, entryId);
      Alert.alert('Success', 'Winner picked!');
      await loadCompetition();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick winner.');
    }
  }, [competition, pickWinner, loadCompetition]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!competition) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Competition not found</Text>
      </View>
    );
  }

  const isCreator = user?.id === competition.creatorId;
  const hasEntered = competition.entries.some(e => e.userId === user?.id);
  const isClosed = competition.status === 'closed';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen[50], padding: spacing[3] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, color: colors.ink[900] }}>{competition.title}</Text>
        <SaveForLaterButton competitionId={competition.id} />
      </View>
      <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400], marginVertical: spacing[2] }}>
        {competition.description}
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>
        Entry Fee: {competition.entryFee} plates • Prize: {competition.prize} plates
      </Text>
      <Text style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[400] }}>
        Entries: {competition.entries.length} • Status: {competition.status}
      </Text>

      {!isClosed && !hasEntered && (
        <EnterCompetitionButton
          onPress={handleEnter}
          loading={isEntering}
          disabled={(user?.plates ?? 0) < competition.entryFee}
          fee={competition.entryFee}
        />
      )}

      {hasEntered && !isClosed && (
        <View style={{ backgroundColor: colors.win + '15', padding: spacing[2], borderRadius: 8, marginVertical: spacing[2] }}>
          <Text style={{ color: colors.win }}>You have entered this competition!</Text>
        </View>
      )}

      {isClosed && (
        <View style={{ backgroundColor: colors.linen[100], padding: spacing[2], borderRadius: 8, marginVertical: spacing[2] }}>
          <Text style={{ color: colors.ink[400] }}>This competition is closed.</Text>
        </View>
      )}

      {isCreator && !isClosed && (
        <CreatorPickWinner entries={competition.entries} onPickWinner={handlePickWinner} />
      )}

      <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug, marginTop: spacing[3], marginBottom: spacing[2] }}>Entries</Text>
      <FlatList
        data={competition.entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.ash[200] }}>
            <Text style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, color: colors.ink[900] }}>{item.userName}</Text>
          </View>
        )}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}
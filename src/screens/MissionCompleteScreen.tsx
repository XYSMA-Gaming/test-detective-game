import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/game';
import { getMissionById } from '../data/missions';

type Props = NativeStackScreenProps<RootStackParamList, 'MissionComplete'>;

export default function MissionCompleteScreen({ route, navigation }: Props) {
  const { missionId } = route.params;
  const mission = getMissionById(missionId);

  const handleBackToMenu = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.completeText}>Mission Complete</Text>
      {mission && (
        <Text style={styles.missionTitle}>{mission.title}</Text>
      )}
      <Text style={styles.message}>
        You have reached the end of this investigation.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleBackToMenu}>
        <Text style={styles.buttonText}>Back to Main Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 12,
    textAlign: 'center',
  },
  missionTitle: {
    fontSize: 20,
    color: '#e0e0e0',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0f3460',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 250,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

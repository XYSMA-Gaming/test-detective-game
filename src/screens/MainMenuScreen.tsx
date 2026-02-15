import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/game';
import { loadGameState } from '../utils/storage';
import { missions } from '../data/missions';

type Props = NativeStackScreenProps<RootStackParamList, 'MainMenu'>;

export default function MainMenuScreen({ navigation }: Props) {
  const [hasSave, setHasSave] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGameState().then((state) => {
        setHasSave(state !== null);
      });
    }, [])
  );

  const handleNewGame = () => {
    const firstMission = missions[0];
    navigation.navigate('Game', {
      missionId: firstMission.id,
      continueGame: false,
    });
  };

  const handleContinue = () => {
    loadGameState().then((state) => {
      if (state) {
        navigation.navigate('Game', {
          missionId: state.missionId,
          continueGame: true,
        });
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Detective Game</Text>
        <Text style={styles.subtitle}>Choose your path. Solve the mystery.</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNewGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </TouchableOpacity>

          {hasSave && (
            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueButton: {
    backgroundColor: '#0f3460',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
});

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
import {
  loadGameState,
  loadAccessibilityMode,
  saveAccessibilityMode,
} from '../utils/storage';
import { missions } from '../data/missions';

type Props = NativeStackScreenProps<RootStackParamList, 'MainMenu'>;

export default function MainMenuScreen({ navigation }: Props) {
  const [hasSave, setHasSave] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGameState().then((state) => {
        setHasSave(state !== null);
      });
      loadAccessibilityMode().then(setAccessibilityMode);
    }, [])
  );

  const toggleAccessibility = async () => {
    const newValue = !accessibilityMode;
    setAccessibilityMode(newValue);
    await saveAccessibilityMode(newValue);
  };

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

        <TouchableOpacity
          style={[
            styles.accessibilityButton,
            accessibilityMode && styles.accessibilityButtonActive,
          ]}
          onPress={toggleAccessibility}
          accessibilityRole="switch"
          accessibilityState={{ checked: accessibilityMode }}
          accessibilityLabel="Audio narration for visually impaired users"
        >
          <Text style={styles.accessibilityButtonText}>
            Audio Narration: {accessibilityMode ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
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
  accessibilityButton: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#533483',
    backgroundColor: 'transparent',
  },
  accessibilityButtonActive: {
    backgroundColor: '#533483',
    borderColor: '#7b4fb5',
  },
  accessibilityButtonText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

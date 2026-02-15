import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameState, RootStackParamList, Scene } from '../types/game';
import { getMissionById, getStartScene } from '../data/missions';
import { clearGameState, loadGameState, saveGameState } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route, navigation }: Props) {
  const { missionId, continueGame } = route.params;
  const mission = getMissionById(missionId);

  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (!mission) return;

    const init = async () => {
      let state: GameState | null = null;

      if (continueGame) {
        state = await loadGameState();
      }

      if (!state) {
        const startId = getStartScene(mission);
        state = {
          missionId: mission.id,
          currentSceneId: startId,
          history: [startId],
        };
      }

      setGameState(state);
      const scene = mission.data.boxes.find(
        (b) => b.id === state!.currentSceneId
      );
      setCurrentScene(scene ?? null);
      await saveGameState(state);
    };

    init();
  }, [mission, continueGame]);

  const handleOptionSelect = async (optionId: number) => {
    if (!mission || !currentScene || !gameState) return;

    setSelectedOption(optionId);

    // Find the connection for this option
    const connection = mission.data.connections.find(
      (c) => c.fromBoxId === currentScene.id && c.fromOptionId === optionId
    );

    // Small delay for visual feedback
    setTimeout(async () => {
      if (connection) {
        // Navigate to the next scene
        const nextScene = mission.data.boxes.find(
          (b) => b.id === connection.toBoxId
        );

        if (nextScene) {
          const newState: GameState = {
            ...gameState,
            currentSceneId: nextScene.id,
            history: [...gameState.history, nextScene.id],
          };
          setGameState(newState);
          setCurrentScene(nextScene);
          setSelectedOption(null);
          await saveGameState(newState);
        }
      } else {
        // No connection means this is a terminal scene choice - mission complete
        await clearGameState();
        navigation.replace('MissionComplete', { missionId: mission.id });
      }
    }, 300);
  };

  if (!mission || !currentScene) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>{currentScene.image}</Text>
          <Text style={styles.sceneLabel}>{currentScene.label}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.question}>{currentScene.question}</Text>

        <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer}>
          {currentScene.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const hasConnection = mission.data.connections.some(
              (c) =>
                c.fromBoxId === currentScene.id &&
                c.fromOptionId === option.id
            );

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => handleOptionSelect(option.id)}
                disabled={selectedOption !== null}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e0e0e0',
    fontSize: 18,
  },
  imageContainer: {
    flex: 1,
    minHeight: 250,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#a0a0b0',
    fontSize: 14,
    marginBottom: 8,
  },
  sceneLabel: {
    color: '#e0e0e0',
    fontSize: 22,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsScroll: {
    maxHeight: 300,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#533483',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  optionText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

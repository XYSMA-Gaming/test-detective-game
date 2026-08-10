import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Audio } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameState, RootStackParamList, Scene } from '../types/game';
import {
  getBackgroundMusicTracks,
  getMissionById,
  getStartScene,
  resolveImage,
} from '../data/missions';
import {
  clearGameState,
  loadAccessibilityMode,
  loadGameState,
  saveGameState,
} from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route, navigation }: Props) {
  const { missionId, continueGame } = route.params;
  const mission = getMissionById(missionId);

  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [activeBgMusic, setActiveBgMusic] = useState<string | null>(null);
  const [bgMusicPickerVisible, setBgMusicPickerVisible] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const bgSoundRef = useRef<Audio.Sound | null>(null);

  const stopCurrentAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Sound may already be unloaded
      }
      soundRef.current = null;
    }
  }, []);

  const stopBackgroundAudio = useCallback(async () => {
    if (bgSoundRef.current) {
      try {
        await bgSoundRef.current.stopAsync();
        await bgSoundRef.current.unloadAsync();
      } catch {
        // Sound may already be unloaded
      }
      bgSoundRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!mission) return;

    const init = async () => {
      const isAccessible = await loadAccessibilityMode();
      setAccessibilityMode(isAccessible);

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
      setActiveBgMusic(mission.data.backgroundAudio ?? null);
      const scene = mission.data.boxes.find(
        (b) => b.id === state!.currentSceneId
      );
      setCurrentScene(scene ?? null);
      await saveGameState(state);
    };

    init();
  }, [mission, continueGame]);

  // Play mission background audio in a loop (separate from scene audio)
  useEffect(() => {
    if (!mission || !activeBgMusic) {
      stopBackgroundAudio();
      return;
    }

    const audioSource = mission.audio[activeBgMusic];
    if (!audioSource) return;

    const playBgAudio = async () => {
      await stopBackgroundAudio();
      try {
        const { sound } = await Audio.Sound.createAsync(audioSource, {
          isLooping: true,
        });
        bgSoundRef.current = sound;
        await sound.playAsync();
      } catch (e) {
        console.warn('Failed to play background audio:', e);
      }
    };

    playBgAudio();

    return () => {
      stopBackgroundAudio();
    };
  }, [mission, activeBgMusic, stopBackgroundAudio]);

  // Play audio when scene changes
  // Always plays audio; accessibility mode prioritises extendedAudio
  useEffect(() => {
    if (!currentScene || !mission) return;

    const playSceneAudio = async () => {
      await stopCurrentAudio();

      // Accessibility ON  → prefer extendedAudio, fall back to audio
      // Accessibility OFF → use audio only
      const audioPath = accessibilityMode
        ? currentScene.extendedAudio || currentScene.audio
        : currentScene.audio;
      if (!audioPath) return;

      const audioSource = mission.audio[audioPath];
      if (!audioSource) return;

      try {
        const { sound } = await Audio.Sound.createAsync(audioSource);
        soundRef.current = sound;
        await sound.playAsync();
      } catch (e) {
        console.warn('Failed to play audio:', e);
      }
    };

    playSceneAudio();

    return () => {
      stopCurrentAudio();
    };
  }, [currentScene, accessibilityMode, mission, stopCurrentAudio]);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      stopBackgroundAudio();
    };
  }, [stopCurrentAudio, stopBackgroundAudio]);

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

  const imageSource = resolveImage(mission, currentScene.image);
  const bgMusicTracks = getBackgroundMusicTracks(mission);

  const getTrackDisplayName = (path: string) => {
    // "audio/abc123.mp3" → "abc123.mp3"
    const filename = path.split('/').pop() ?? path;
    return filename;
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.sceneImage} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{currentScene.image}</Text>
          </View>
        )}
        <View style={styles.sceneLabelOverlay}>
          <Text style={styles.sceneLabel}>{currentScene.label}</Text>
        </View>
        {bgMusicTracks.length > 0 && (
          <TouchableOpacity
            style={styles.musicButton}
            onPress={() => setBgMusicPickerVisible(true)}
          >
            <Text style={styles.musicButtonText}>
              {activeBgMusic ? '\u266B' : '\u266A'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={bgMusicPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBgMusicPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBgMusicPickerVisible(false)}
        >
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Background Music</Text>
            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={[
                  styles.musicTrackItem,
                  !activeBgMusic && styles.musicTrackActive,
                ]}
                onPress={() => {
                  setActiveBgMusic(null);
                  setBgMusicPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.musicTrackText,
                    !activeBgMusic && styles.musicTrackTextActive,
                  ]}
                >
                  None (Off)
                </Text>
              </TouchableOpacity>
              {bgMusicTracks.map((track) => (
                <TouchableOpacity
                  key={track}
                  style={[
                    styles.musicTrackItem,
                    activeBgMusic === track && styles.musicTrackActive,
                  ]}
                  onPress={() => {
                    setActiveBgMusic(track);
                    setBgMusicPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.musicTrackText,
                      activeBgMusic === track && styles.musicTrackTextActive,
                    ]}
                  >
                    {getTrackDisplayName(track)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.contentContainer}>
        <Text style={styles.question}>{currentScene.question}</Text>

        <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContainer}>
          {currentScene.options.map((option) => {
            const isSelected = selectedOption === option.id;

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
    position: 'relative',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
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
  },
  sceneLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sceneLabel: {
    color: '#e0e0e0',
    fontSize: 18,
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
  musicButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicButtonText: {
    color: '#e0e0e0',
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#533483',
  },
  modalTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  musicTrackItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#16213e',
  },
  musicTrackActive: {
    backgroundColor: '#533483',
  },
  musicTrackText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  musicTrackTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

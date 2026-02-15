import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types/game';

const SAVE_KEY = 'detective_game_save';

export async function saveGameState(state: GameState): Promise<void> {
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export async function loadGameState(): Promise<GameState | null> {
  const data = await AsyncStorage.getItem(SAVE_KEY);
  if (!data) return null;
  return JSON.parse(data) as GameState;
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(SAVE_KEY);
}

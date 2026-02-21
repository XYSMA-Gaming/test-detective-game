import { ImageSourcePropType } from 'react-native';

export interface Option {
  id: number;
  text: string;
}

export interface Scene {
  id: number;
  label: string;
  image: string;
  question: string;
  options: Option[];
  audio?: string | null;
  audioName?: string | null;
  extendedAudio?: string | null;
  extendedAudioName?: string | null;
}

export interface Connection {
  id: number;
  fromBoxId: number;
  fromOptionId: number;
  toBoxId: number;
}

export interface MissionJson {
  id: string;
  title: string;
  description: string;
  boxes: Scene[];
  connections: Connection[];
}

export interface MissionData {
  boxes: Scene[];
  connections: Connection[];
}

/** Map of image filename (e.g. "OIG1.jpg") to a require() source */
export type ImageMap = Record<string, ImageSourcePropType>;

/** Map of audio path (e.g. "audio/file.mp3") to a require() source */
export type AudioMap = Record<string, any>;

export interface Mission {
  id: string;
  title: string;
  description: string;
  data: MissionData;
  images: ImageMap;
  audio: AudioMap;
}

export interface GameState {
  missionId: string;
  currentSceneId: number;
  history: number[]; // scene IDs visited
}

export type RootStackParamList = {
  MainMenu: undefined;
  Game: { missionId: string; continueGame?: boolean };
  MissionComplete: { missionId: string };
};

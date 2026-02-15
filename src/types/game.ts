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
  // Derived at runtime: ignored JSON fields (x, y, width, height)
}

export interface Connection {
  id: number;
  fromBoxId: number;
  fromOptionId: number;
  toBoxId: number;
}

export interface MissionData {
  boxes: Scene[];
  connections: Connection[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  data: MissionData;
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

import { Mission, MissionJson } from '../types/game';

// ─── Mission JSON imports ───────────────────────────────────────────
// Each mission lives in assets/missions/<id>/mission.json
import mission1Json from '../../assets/missions/mission-1/mission.json';

// ─── Image registries ───────────────────────────────────────────────
// React Native requires static require() calls for bundled images.
// For each mission, map every image filename used in the JSON to its require().
// When you add a new mission, add its JSON import above and its image map below.

const mission1Images: Record<string, any> = {
  'OIG1.jpg': require('../../assets/missions/mission-1/OIG1.jpg'),
  'OIG5.jpg': require('../../assets/missions/mission-1/OIG5.jpg'),
  'OIG4.jpg': require('../../assets/missions/mission-1/OIG4.jpg'),
};

// ─── Build mission list ─────────────────────────────────────────────

function buildMission(json: MissionJson, images: Record<string, any>): Mission {
  return {
    id: json.id,
    title: json.title,
    description: json.description,
    data: {
      boxes: json.boxes,
      connections: json.connections,
    },
    images,
  };
}

export const missions: Mission[] = [
  buildMission(mission1Json as MissionJson, mission1Images),
  // To add more missions:
  // buildMission(mission2Json as MissionJson, mission2Images),
];

export function getMissionById(id: string): Mission | undefined {
  return missions.find((m) => m.id === id);
}

export function getStartScene(mission: Mission): number {
  // The start scene is the first box that is never a target of any connection
  const targetIds = new Set(mission.data.connections.map((c) => c.toBoxId));
  const startScene = mission.data.boxes.find((b) => !targetIds.has(b.id));
  return startScene ? startScene.id : mission.data.boxes[0].id;
}

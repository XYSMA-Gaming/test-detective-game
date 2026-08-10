import { Mission, MissionJson } from '../types/game';

// ─── Mission JSON imports ───────────────────────────────────────────
// Each mission lives in assets/missions/<id>/mission.json
import mission1Json from '../../assets/missions/mission-1/mission.json';

// ─── Image auto-discovery ───────────────────────────────────────────
// require.context auto-imports all matching files from a directory.
// Drop images into the mission folder and they're available instantly.
// When you add a new mission, add its JSON import above and a context below.

const mission1Ctx = require.context(
  '../../assets/missions/mission-1',
  true,
  /\.(jpg|jpeg|png|webp)$/
);

// ─── Audio auto-discovery ───────────────────────────────────────────
// Recursively searches the mission folder for audio files.
// Audio paths in JSON (e.g. "audio/file.mp3") match the discovered keys.

const mission1AudioCtx = require.context(
  '../../assets/missions/mission-1',
  true,
  /\.(mp3|wav|ogg|m4a)$/
);

function buildImageMap(ctx: RequireContext): Record<string, any> {
  const images: Record<string, any> = {};
  for (const key of ctx.keys()) {
    // key looks like "./OIG1.jpg" — strip the "./"
    images[key.replace('./', '')] = ctx(key);
  }
  return images;
}

function buildAudioMap(ctx: RequireContext): Record<string, any> {
  const audio: Record<string, any> = {};
  for (const key of ctx.keys()) {
    // key looks like "./audio/file.mp3" — strip the "./"
    audio[key.replace('./', '')] = ctx(key);
  }
  return audio;
}

// ─── Build mission list ─────────────────────────────────────────────

function buildMission(
  json: MissionJson,
  images: Record<string, any>,
  audio: Record<string, any>
): Mission {
  // Support both old format (top-level boxes/connections)
  // and new format (nested under data)
  const boxes = json.data?.boxes ?? json.boxes ?? [];
  const connections = json.data?.connections ?? json.connections ?? [];
  const backgroundAudio = json.data?.backgroundAudio ?? null;
  const startingSceneId = json.data?.startingSceneId ?? null;

  return {
    id: String(json.id),
    title: json.title,
    description: json.description,
    data: { boxes, connections, backgroundAudio, startingSceneId },
    images,
    audio,
  };
}

export const missions: Mission[] = [
  buildMission(
    mission1Json as MissionJson,
    buildImageMap(mission1Ctx),
    buildAudioMap(mission1AudioCtx)
  ),
  // To add more missions:
  // const mission2Ctx = require.context('../../assets/missions/mission-2', false, /\.(jpg|jpeg|png|webp)$/);
  // const mission2AudioCtx = require.context('../../assets/missions/mission-2', true, /\.(mp3|wav|ogg|m4a)$/);
  // buildMission(mission2Json as MissionJson, buildImageMap(mission2Ctx), buildAudioMap(mission2AudioCtx)),
];

export function getMissionById(id: string): Mission | undefined {
  return missions.find((m) => m.id === id);
}

/**
 * Resolve an image reference to an ImageSourcePropType.
 * Priority: bundled asset (require.context) → full URL
 */
export function resolveImage(
  mission: Mission,
  imageName: string | undefined
) {
  if (!imageName) return undefined;
  const local = mission.images[imageName];
  if (local) return local;
  if (/^https?:\/\//.test(imageName)) return { uri: imageName };
  return undefined;
}

/**
 * Returns audio paths that are NOT used by any scene (i.e. background music tracks).
 */
export function getBackgroundMusicTracks(mission: Mission): string[] {
  const sceneAudioPaths = new Set<string>();
  for (const box of mission.data.boxes) {
    if (box.audio) sceneAudioPaths.add(box.audio);
    if (box.extendedAudio) sceneAudioPaths.add(box.extendedAudio);
  }

  return Object.keys(mission.audio).filter(
    (path) => !sceneAudioPaths.has(path)
  );
}

export function getStartScene(mission: Mission): number {
  // Use explicit startingSceneId if provided
  if (mission.data.startingSceneId) {
    const explicit = mission.data.boxes.find(
      (b) => b.id === mission.data.startingSceneId
    );
    if (explicit) return explicit.id;
  }

  // Fallback: the first box that is never a target of any connection
  const targetIds = new Set(mission.data.connections.map((c) => c.toBoxId));
  const startScene = mission.data.boxes.find((b) => !targetIds.has(b.id));
  return startScene ? startScene.id : mission.data.boxes[0].id;
}

import { Mission } from '../types/game';

export const missions: Mission[] = [
  {
    id: 'mission-1',
    title: 'The First Case',
    description: 'Investigate the mysterious events and make your choices wisely.',
    data: {
      boxes: [
        {
          id: 1771194709306,
          label: 'Screen 1',
          image: 'OIG1.jpg',
          question: 'asfafsafasfa',
          options: [
            { id: 1771194709307, text: 'Option 1' },
            { id: 1771194709308, text: 'Option 2' },
          ],
        },
        {
          id: 1771194711777,
          label: 'Screen 2',
          image: 'OIG5.jpg',
          question: 'asdasdasdasd',
          options: [
            { id: 1771194711778, text: 'Option 1' },
            { id: 1771194711779, text: 'Option 2' },
          ],
        },
        {
          id: 1771194718685,
          label: 'Screen 3',
          image: 'OIG4.jpg',
          question: 'asdasdasdasdasad',
          options: [
            { id: 1771194718686, text: 'Option 1' },
            { id: 1771194718687, text: 'Option 2' },
          ],
        },
      ],
      connections: [
        {
          id: 1771194716166,
          fromBoxId: 1771194709306,
          fromOptionId: 1771194709307,
          toBoxId: 1771194711777,
        },
        {
          id: 1771194725077,
          fromBoxId: 1771194709306,
          fromOptionId: 1771194709308,
          toBoxId: 1771194718685,
        },
      ],
    },
  },
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

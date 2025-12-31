export interface TrainingNode {
  id: string;
  name: string;
  color: string;
  value?: number; // Volume or progress
  children?: TrainingNode[];
  description?: string;
  level: number; // 0=Why, 1=How, 2=What
}

export interface WorkoutLog {
  id: string;
  nodeId: string;
  nodeName: string;
  date: string;
  value: number;
  unit: string;
  notes?: string;
}

export const TRAINING_COLORS = {
  PUSH_SKILL: '#FF3D77', // Pink
  PUSH_STRENGTH: '#FF0000', // Red
  MOBILITY: '#FFA500', // Orange
  ACTIVITY: '#7CFC00', // Green
  PULL: '#3D99FF', // Blue
  LEGS: '#ADD8E6', // Light Blue
};


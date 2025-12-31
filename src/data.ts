import { TrainingNode, WorkoutLog, TRAINING_COLORS } from './types';

export const initialTrainingData: TrainingNode = {
  id: 'root',
  name: 'Training Universe',
  color: '#FFFFFF',
  level: 0,
  children: [
    {
      id: 'why-balanced',
      name: 'BE BALANCED',
      color: '#e2e8f0',
      level: 1,
      children: [
        {
          id: 'how-skill',
          name: 'Hand Balancing',
          color: TRAINING_COLORS.PUSH_SKILL,
          level: 2,
          children: [
            { id: 'what-handstand', name: 'Handstand (3min Acc)', color: TRAINING_COLORS.PUSH_SKILL, value: 540, level: 3 },
            { id: 'what-balancing', name: 'Hand Balancing Skill', color: TRAINING_COLORS.PUSH_SKILL, value: 3, level: 3 }
          ]
        },
        {
          id: 'how-mobility',
          name: 'Flexibility',
          color: TRAINING_COLORS.MOBILITY,
          level: 2,
          children: [
            { id: 'what-pancake', name: 'Pancake', color: TRAINING_COLORS.MOBILITY, value: 1, level: 3 },
            { id: 'what-pike-h2t', name: 'Pike H2T', color: TRAINING_COLORS.MOBILITY, value: 1, level: 3 }
          ]
        }
      ]
    },
    {
      id: 'why-strong',
      name: 'BE STRONG',
      color: '#cbd5e1',
      level: 1,
      children: [
        {
          id: 'how-push',
          name: 'Pushing Strength',
          color: TRAINING_COLORS.PUSH_STRENGTH,
          level: 2,
          children: [
            { id: 'what-hspu', name: 'HSPU', color: TRAINING_COLORS.PUSH_STRENGTH, value: 10, level: 3 },
            { id: 'what-pike-pu', name: 'Pike PU', color: TRAINING_COLORS.PUSH_STRENGTH, value: 45, level: 3 },
            { id: 'what-pushups', name: 'Pushups & Dips', color: TRAINING_COLORS.PUSH_STRENGTH, value: 72, level: 3 }
          ]
        },
        {
          id: 'how-pull',
          name: 'Pulling Strength',
          color: TRAINING_COLORS.PULL,
          level: 2,
          children: [
            { id: 'what-muscleups', name: 'Muscle Ups', color: TRAINING_COLORS.PULL, value: 0, level: 3 },
            { id: 'what-pullups', name: 'Pullups', color: TRAINING_COLORS.PULL, value: 192, level: 3 },
            { id: 'what-deadhang', name: 'Dead Hang', color: TRAINING_COLORS.PULL, value: 150, level: 3 }
          ]
        }
      ]
    },
    {
      id: 'why-athletic',
      name: 'BE ATHLETIC',
      color: '#94a3b8',
      level: 1,
      children: [
        {
          id: 'how-legs',
          name: 'Leg Power',
          color: TRAINING_COLORS.LEGS,
          level: 2,
          children: [
            { id: 'what-pistol', name: 'Leg Strength (Pistol)', color: TRAINING_COLORS.LEGS, value: 109, level: 3 },
            { id: 'what-squat-mob', name: 'Squat Mobility (ATG)', color: TRAINING_COLORS.LEGS, value: 1, level: 3 }
          ]
        },
        {
          id: 'how-activity',
          name: 'Daily Activity',
          color: TRAINING_COLORS.ACTIVITY,
          level: 2,
          children: [
            { id: 'what-running', name: 'Running', color: TRAINING_COLORS.ACTIVITY, value: 8.5, level: 3 },
            { id: 'what-sport', name: 'Sport/Activity', color: TRAINING_COLORS.ACTIVITY, value: 2, level: 3 }
          ]
        }
      ]
    }
  ]
};

export const initialWorkoutLogs: WorkoutLog[] = [
  // Dec 23rd
  { id: 'log-23-1', nodeId: 'what-balancing', nodeName: 'Hand Balancing Skill', date: '2025-12-23T10:00:00Z', value: 1, unit: 'sessions', notes: 'Hand balancing: 1 session' },
  { id: 'log-23-2', nodeId: 'what-handstand', nodeName: 'Handstand (3min Acc)', date: '2025-12-23T10:15:00Z', value: 180, unit: 'seconds', notes: 'Sets: 60, 60, 40, 20' },
  { id: 'log-23-3', nodeId: 'what-pike-pu', nodeName: 'Pike PU', date: '2025-12-23T10:30:00Z', value: 15, unit: 'reps', notes: 'Sets: 5, 5, 5' },
  { id: 'log-23-4', nodeId: 'what-pancake', nodeName: 'Pancake', date: '2025-12-23T11:00:00Z', value: 1, unit: 'sessions', notes: 'Pancake: 1 session' },
  { id: 'log-23-5', nodeId: 'what-pike-h2t', nodeName: 'Pike H2T', date: '2025-12-23T11:10:00Z', value: 1, unit: 'sessions', notes: 'Pike h2t: 1 session' },
  
  // Dec 22nd
  { id: 'log-22-1', nodeId: 'what-pullups', nodeName: 'Pullups', date: '2025-12-22T09:00:00Z', value: 18, unit: 'reps', notes: 'Sets: 6, 6, 6' },
  
  // Dec 21st
  { id: 'log-21-1', nodeId: 'what-balancing', nodeName: 'Hand Balancing Skill', date: '2025-12-21T08:00:00Z', value: 1, unit: 'sessions', notes: 'Hand balancing: 1 session' },
  { id: 'log-21-2', nodeId: 'what-handstand', nodeName: 'Handstand (3min Acc)', date: '2025-12-21T08:15:00Z', value: 180, unit: 'seconds', notes: 'Sets: 60, 50, 30, 40' },
  { id: 'log-21-3', nodeId: 'what-pistol', nodeName: 'Leg Strength (Pistol)', date: '2025-12-21T08:45:00Z', value: 9, unit: 'reps', notes: 'Sets: 3, 3, 3' },
  { id: 'log-21-4', nodeId: 'what-pike-pu', nodeName: 'Pike PU', date: '2025-12-21T09:00:00Z', value: 15, unit: 'reps', notes: 'Sets: 5, 5, 5' },
  { id: 'log-21-5', nodeId: 'what-deadhang', nodeName: 'Dead Hang', date: '2025-12-21T09:30:00Z', value: 65, unit: 'seconds', notes: 'Dead hang 65 seconds' },
  
  // Dec 20th
  { id: 'log-20-1', nodeId: 'what-pistol', nodeName: 'Leg Strength (Pistol)', date: '2025-12-20T17:00:00Z', value: 100, unit: 'reps', notes: '100 air squats (leg power)' },
  { id: 'log-20-2', nodeId: 'what-pullups', nodeName: 'Pullups', date: '2025-12-20T17:30:00Z', value: 64, unit: 'reps', notes: 'Sets: 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4' },
  
  // Dec 19th
  { id: 'log-19-1', nodeId: 'what-balancing', nodeName: 'Hand Balancing Skill', date: '2025-12-19T10:00:00Z', value: 1, unit: 'sessions', notes: 'Hand balancing: 1 session' },
  { id: 'log-19-2', nodeId: 'what-handstand', nodeName: 'Handstand (3min Acc)', date: '2025-12-19T10:15:00Z', value: 180, unit: 'seconds', notes: 'Sets: 47, 45, 43, 41, 4' },
  { id: 'log-19-3', nodeId: 'what-pike-pu', nodeName: 'Pike PU', date: '2025-12-19T10:45:00Z', value: 15, unit: 'reps', notes: 'Sets: 5, 5, 5' },
  { id: 'log-19-4', nodeId: 'what-hspu', nodeName: 'HSPU', date: '2025-12-19T11:00:00Z', value: 10, unit: 'reps', notes: '3x max depth wall hand stand pushups' },
  
  // Dec 18th
  { id: 'log-18-1', nodeId: 'what-running', nodeName: 'Running', date: '2025-12-18T07:00:00Z', value: 0.75, unit: 'miles', notes: 'Morning run' },
  { id: 'log-18-2', nodeId: 'what-pullups', nodeName: 'Pullups', date: '2025-12-18T12:00:00Z', value: 50, unit: 'reps', notes: 'Sets: 5, 5, 5, 5, 5, 5, 5, 5, 5, 5' },
  { id: 'log-18-3', nodeId: 'what-running', nodeName: 'Running', date: '2025-12-18T17:00:00Z', value: 0.75, unit: 'miles', notes: 'Evening run' },
  { id: 'log-18-4', nodeId: 'what-sport', nodeName: 'Sport/Activity', date: '2025-12-18T18:00:00Z', value: 1, unit: 'sessions', notes: 'Sport session' },
  
  // Dec 17th
  { id: 'log-17-1', nodeId: 'what-running', nodeName: 'Running', date: '2025-12-17T08:00:00Z', value: 4.7, unit: 'miles', notes: 'Run 1' },
  { id: 'log-17-2', nodeId: 'what-running', nodeName: 'Running', date: '2025-12-17T17:00:00Z', value: 2.3, unit: 'miles', notes: 'Run 2' },
  { id: 'log-17-3', nodeId: 'what-sport', nodeName: 'Sport/Activity', date: '2025-12-17T18:30:00Z', value: 1, unit: 'sessions', notes: 'Sport session' },
  
  // Dec 16th
  { id: 'log-16-1', nodeId: 'what-deadhang', nodeName: 'Dead Hang', date: '2025-12-16T10:00:00Z', value: 85, unit: 'seconds', notes: 'Dead hang: 85 seconds' },
  { id: 'log-16-2', nodeId: 'what-pushups', nodeName: 'Pushups & Dips', date: '2025-12-16T10:15:00Z', value: 72, unit: 'seconds', notes: 'Sally up challenge: 72 seconds' },
  
  // Dec 15th
  { id: 'log-15-1', nodeId: 'what-pullups', nodeName: 'Pullups', date: '2025-12-15T09:00:00Z', value: 60, unit: 'reps', notes: 'Sets: 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3' },
  { id: 'log-15-2', nodeId: 'what-squat-mob', nodeName: 'Squat Mobility (ATG)', date: '2025-12-15T09:45:00Z', value: 1, unit: 'sessions', notes: 'Squat mobility session' }
];


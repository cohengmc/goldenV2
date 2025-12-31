import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { WorkoutLog } from '../types';
import { databaseService } from '../database/DatabaseService';

const { WatchConnectivityModule } = NativeModules;

class WatchConnectivityService {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: Array<() => void> = [];

  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.warn('WatchConnectivity is only available on iOS');
      return;
    }

    if (!WatchConnectivityModule) {
      console.warn('WatchConnectivityModule is not available. Make sure the native module is properly linked.');
      return;
    }

    try {
      await WatchConnectivityModule.initializeWatchConnectivity();
      this.eventEmitter = new NativeEventEmitter(WatchConnectivityModule);
      
      const subscription = this.eventEmitter.addListener(
        'WatchMessageReceived',
        this.handleWatchMessage.bind(this)
      );
      
      this.listeners.push(() => subscription.remove());
    } catch (error) {
      console.error('Error initializing WatchConnectivity:', error);
    }
  }

  private async handleWatchMessage(message: any): Promise<void> {
    try {
      // Expect message format: { type: 'workoutLog', data: WorkoutLog }
      if (message.type === 'workoutLog' && message.data) {
        const log: WorkoutLog = message.data;
        
        // Save to database
        await databaseService.saveWorkoutLog(log);
        await databaseService.updateNodeValue(log.nodeId, log.value);
        
        // Emit event for App component to update state
        this.onWorkoutLogReceived?.(log);
      }
    } catch (error) {
      console.error('Error handling watch message:', error);
    }
  }

  onWorkoutLogReceived?: (log: WorkoutLog) => void;

  async sendMessageToWatch(message: Record<string, any>): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (!WatchConnectivityModule) {
      console.warn('WatchConnectivityModule is not available');
      return;
    }

    try {
      await WatchConnectivityModule.sendMessageToWatch(message);
    } catch (error) {
      console.error('Error sending message to watch:', error);
    }
  }

  cleanup(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
  }
}

export const watchConnectivityService = new WatchConnectivityService();


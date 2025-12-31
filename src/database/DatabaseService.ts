import SQLite from 'react-native-sqlite-storage';
import { TrainingNode, WorkoutLog } from '../types';
import { initialTrainingData, initialWorkoutLogs } from '../data';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'GoldenCircle.db';
const database_version = '1.0';
const database_displayname = 'Golden Circle SQLite Database';
const database_size = 200000;

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: database_name,
        location: 'default',
      });

      await this.createTables();
      await this.initializeData();
    } catch (error) {
      console.error('Database initialization error:', error);
      // Retry with basic configuration
      try {
        this.db = await SQLite.openDatabase({
          name: database_name,
          location: 'default',
        });
        await this.createTables();
        await this.initializeData();
      } catch (retryError) {
        console.error('Database retry initialization error:', retryError);
        throw retryError;
      }
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // Create training_nodes table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS training_nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        value REAL DEFAULT 0,
        level INTEGER NOT NULL,
        parent_id TEXT,
        children_json TEXT,
        description TEXT
      )
    `);

    // Create workout_logs table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        node_name TEXT NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT
      )
    `);
  }

  private async initializeData(): Promise<void> {
    if (!this.db) return;

    // Check if data already exists
    const [result] = await this.db.executeSql('SELECT COUNT(*) as count FROM training_nodes');
    const count = result.rows.item(0).count;

    if (count === 0) {
      // Insert initial training data
      await this.saveTrainingData(initialTrainingData);
      // Insert initial workout logs
      for (const log of initialWorkoutLogs) {
        await this.saveWorkoutLog(log);
      }
    }
  }

  // Convert TrainingNode tree to flat structure for storage
  private nodeToFlat(node: TrainingNode, parentId: string | null = null): Array<{
    id: string;
    name: string;
    color: string;
    value: number;
    level: number;
    parent_id: string | null;
    children_json: string;
    description?: string;
  }> {
    const flat: Array<{
      id: string;
      name: string;
      color: string;
      value: number;
      level: number;
      parent_id: string | null;
      children_json: string;
      description?: string;
    }> = [];

    const children = node.children || [];
    const childrenJson = JSON.stringify(children);

    flat.push({
      id: node.id,
      name: node.name,
      color: node.color,
      value: node.value || 0,
      level: node.level,
      parent_id: parentId,
      children_json: childrenJson,
      description: node.description,
    });

    // Recursively process children
    for (const child of children) {
      flat.push(...this.nodeToFlat(child, node.id));
    }

    return flat;
  }

  // Convert flat structure back to TrainingNode tree
  private flatToTree(flat: Array<{
    id: string;
    name: string;
    color: string;
    value: number;
    level: number;
    parent_id: string | null;
    children_json: string;
    description?: string;
  }>): TrainingNode | null {
    if (flat.length === 0) return null;

    // Find root node
    const rootData = flat.find(n => n.parent_id === null);
    if (!rootData) return null;

    const buildNode = (data: typeof rootData): TrainingNode => {
      let children: TrainingNode[] | undefined;
      
      try {
        const childrenData = JSON.parse(data.children_json);
        if (Array.isArray(childrenData) && childrenData.length > 0) {
          children = childrenData.map((childData: any) => {
            const childFlat = flat.find(f => f.id === childData.id);
            if (childFlat) {
              return buildNode(childFlat);
            }
            // Fallback to childData if not in flat
            return {
              id: childData.id,
              name: childData.name,
              color: childData.color,
              value: childData.value || 0,
              level: childData.level,
              children: childData.children,
            };
          });
        }
      } catch (e) {
        console.error('Error parsing children_json:', e);
      }

      return {
        id: data.id,
        name: data.name,
        color: data.color,
        value: data.value || 0,
        level: data.level,
        children,
        description: data.description,
      };
    };

    return buildNode(rootData);
  }

  async loadTrainingData(): Promise<TrainingNode> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) {
      return initialTrainingData;
    }

    try {
      const [result] = await this.db.executeSql('SELECT * FROM training_nodes');
      const rows = [];
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i));
      }

      const tree = this.flatToTree(rows);
      return tree || initialTrainingData;
    } catch (error) {
      console.error('Error loading training data:', error);
      return initialTrainingData;
    }
  }

  async saveTrainingData(data: TrainingNode): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      // Delete all existing nodes
      await this.db.executeSql('DELETE FROM training_nodes');

      // Insert all nodes
      const flat = this.nodeToFlat(data);
      for (const node of flat) {
        await this.db.executeSql(
          `INSERT OR REPLACE INTO training_nodes 
           (id, name, color, value, level, parent_id, children_json, description) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            node.id,
            node.name,
            node.color,
            node.value,
            node.level,
            node.parent_id,
            node.children_json,
            node.description || null,
          ]
        );
      }
    } catch (error) {
      console.error('Error saving training data:', error);
      throw error;
    }
  }

  async loadWorkoutLogs(): Promise<WorkoutLog[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) {
      return initialWorkoutLogs;
    }

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM workout_logs ORDER BY date DESC'
      );
      const logs: WorkoutLog[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        logs.push({
          id: row.id,
          nodeId: row.node_id,
          nodeName: row.node_name,
          date: row.date,
          value: row.value,
          unit: row.unit,
          notes: row.notes || undefined,
        });
      }
      return logs;
    } catch (error) {
      console.error('Error loading workout logs:', error);
      return initialWorkoutLogs;
    }
  }

  async saveWorkoutLog(log: WorkoutLog): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO workout_logs 
         (id, node_id, node_name, date, value, unit, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.nodeId,
          log.nodeName,
          log.date,
          log.value,
          log.unit,
          log.notes || null,
        ]
      );
    } catch (error) {
      console.error('Error saving workout log:', error);
      throw error;
    }
  }

  async deleteWorkoutLog(logId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      await this.db.executeSql('DELETE FROM workout_logs WHERE id = ?', [logId]);
    } catch (error) {
      console.error('Error deleting workout log:', error);
      throw error;
    }
  }

  async updateNodeValue(nodeId: string, delta: number): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      await this.db.executeSql(
        'UPDATE training_nodes SET value = COALESCE(value, 0) + ? WHERE id = ?',
        [delta, nodeId]
      );
    } catch (error) {
      console.error('Error updating node value:', error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();


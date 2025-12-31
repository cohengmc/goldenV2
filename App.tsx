import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { SunburstChart } from './src/components/SunburstChart';
import { CalendarView } from './src/components/CalendarView';
import { TrendsView } from './src/components/TrendsView';
import { LogModal } from './src/components/LogModal';
import { EditNodeModal } from './src/components/EditNodeModal';
import { TrainingNode, WorkoutLog } from './src/types';
import { databaseService } from './src/database/DatabaseService';
import { initialTrainingData, initialWorkoutLogs } from './src/data';
import { watchConnectivityService } from './src/services/WatchConnectivityService';

type ViewMode = 'wheel' | 'calendar' | 'trends';

const App: React.FC = () => {
  const [data, setData] = useState<TrainingNode>(initialTrainingData);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('wheel');
  const [selectedNode, setSelectedNode] = useState<TrainingNode | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await databaseService.initDatabase();
        const trainingData = await databaseService.loadTrainingData();
        const workoutLogs = await databaseService.loadWorkoutLogs();
        setData(trainingData);
        setLogs(workoutLogs);
      } catch (error) {
        console.error('Error initializing data:', error);
        setData(initialTrainingData);
        setLogs(initialWorkoutLogs);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
    
    // Initialize WatchConnectivity
    watchConnectivityService.initialize();
    watchConnectivityService.onWorkoutLogReceived = async (log: WorkoutLog) => {
      // Update logs state
      setLogs((prev) => [log, ...prev]);
      
      // Update node value
      const updateNodeValue = (root: TrainingNode): TrainingNode => {
        if (root.id === log.nodeId) {
          return { ...root, value: (root.value || 0) + log.value };
        }
        if (root.children) {
          return { ...root, children: root.children.map(updateNodeValue) };
        }
        return root;
      };
      
      setData((prev) => updateNodeValue(prev));
    };
    
    return () => {
      watchConnectivityService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      databaseService.saveTrainingData(data).catch(console.error);
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      // Save logs individually when they change
      // This is handled in the log functions
    }
  }, [logs, isLoading]);

  const nodeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const traverse = (node: TrainingNode) => {
      map[node.id] = node.color;
      if (node.children) node.children.forEach(traverse);
    };
    traverse(data);
    return map;
  }, [data]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const nodeData = node.data as TrainingNode;
      setSelectedNode(nodeData);
      setPreSelectedDate(undefined);
      if (!nodeData.children || nodeData.children.length === 0) {
        setIsLogModalOpen(true);
      }
    },
    []
  );

  const handleLogFromCalendar = useCallback(
    (node: TrainingNode, date: string) => {
      setSelectedNode(node);
      setPreSelectedDate(date);
      setIsLogModalOpen(true);
    },
    []
  );

  const handleEditNode = useCallback((node: any) => {
    const nodeData = node.data as TrainingNode;
    setSelectedNode(nodeData);
    setIsEditModalOpen(true);
  }, []);

  const handleLogWorkout = useCallback(
    async (
      nodeId: string,
      value: number,
      notes: string,
      date?: string
    ) => {
      const findNodeName = (root: TrainingNode, id: string): string => {
        if (root.id === id) return root.name;
        if (root.children) {
          for (const child of root.children) {
            const name = findNodeName(child, id);
            if (name !== 'Unknown') return name;
          }
        }
        return 'Unknown';
      };

      const nodeName =
        selectedNode?.name || findNodeName(data, nodeId);

      const newLog: WorkoutLog = {
        id: Math.random().toString(36).substr(2, 9),
        nodeId,
        nodeName,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        value,
        unit: 'reps/sets',
        notes,
      };

      try {
        await databaseService.saveWorkoutLog(newLog);
        await databaseService.updateNodeValue(nodeId, value);
        setLogs((prev) => [newLog, ...prev]);

        const updateNodeValue = (root: TrainingNode): TrainingNode => {
          if (root.id === nodeId) {
            return { ...root, value: (root.value || 0) + value };
          }
          if (root.children) {
            return { ...root, children: root.children.map(updateNodeValue) };
          }
          return root;
        };

        setData((prev) => updateNodeValue(prev));
        setIsLogModalOpen(false);
      } catch (error) {
        console.error('Error saving workout log:', error);
        Alert.alert('Error', 'Failed to save workout log');
      }
    },
    [data, selectedNode]
  );

  const handleSaveNode = async (
    nodeId: string,
    updates: Partial<TrainingNode>
  ) => {
    const updateRecursive = (node: TrainingNode): TrainingNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateRecursive) };
      }
      return node;
    };
    setData((prev) => updateRecursive(prev));
  };

  const handleAddChild = useCallback(
    (parentId: string) => {
      const addChildRecursive = (node: TrainingNode): TrainingNode => {
        if (node.id === parentId) {
          const newChild: TrainingNode = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Activity',
            color:
              node.color === '#FFFFFF'
                ? '#FF3D77'
                : node.color,
            level: node.level + 1,
            value: 0,
            children: node.level < 2 ? [] : undefined,
          };
          return {
            ...node,
            children: [...(node.children || []), newChild],
          };
        }
        if (node.children) {
          return { ...node, children: node.children.map(addChildRecursive) };
        }
        return node;
      };
      setData((prev) => addChildRecursive(prev));
    },
    []
  );

  const handleDeleteNode = (nodeId: string) => {
    const deleteRecursive = (node: TrainingNode): TrainingNode | null => {
      if (node.id === nodeId) return null;
      if (node.children) {
        return {
          ...node,
          children: node.children
            .map(deleteRecursive)
            .filter((n) => n !== null) as TrainingNode[],
        };
      }
      return node;
    };
    setData((prev) => deleteRecursive(prev) as TrainingNode);
    setLogs((prev) => prev.filter((l) => l.nodeId !== nodeId));
  };

  const deleteLog = async (logId: string) => {
    const logToDelete = logs.find((l) => l.id === logId);
    if (!logToDelete) return;

    Alert.alert(
      'Delete Log',
      'Delete this log? Your progress wheel will reflect the change.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteWorkoutLog(logId);
              await databaseService.updateNodeValue(
                logToDelete.nodeId,
                -logToDelete.value
              );
              setLogs((prev) => prev.filter((l) => l.id !== logId));

              const updateNodeValue = (root: TrainingNode): TrainingNode => {
                if (root.id === logToDelete.nodeId) {
                  return {
                    ...root,
                    value: Math.max(0, (root.value || 0) - logToDelete.value),
                  };
                }
                if (root.children) {
                  return {
                    ...root,
                    children: root.children.map(updateNodeValue),
                  };
                }
                return root;
              };
              setData((prev) => updateNodeValue(prev));
            } catch (error) {
              console.error('Error deleting log:', error);
              Alert.alert('Error', 'Failed to delete log');
            }
          },
        },
      ]
    );
  };

  const resetAll = () => {
    Alert.alert(
      'Reset Everything',
      'Reset everything? This will clear all logs and return the wheel to its original state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setData(initialTrainingData);
              setLogs([]);
              await databaseService.saveTrainingData(initialTrainingData);
              // Clear logs from database
              const allLogs = await databaseService.loadWorkoutLogs();
              for (const log of allLogs) {
                await databaseService.deleteWorkoutLog(log.id);
              }
            } catch (error) {
              console.error('Error resetting data:', error);
            }
          },
        },
      ]
    );
  };

  const totalSessions = logs.length;
  const sessionsToday = logs.filter(
    (l) =>
      new Date(l.date).toDateString() === new Date().toDateString()
  ).length;
  const recentLogs = logs.slice(0, 10);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🏋️</Text>
            </View>
            <View>
              <Text style={styles.title}>
                The <Text style={styles.titleAccent}>Golden</Text> Circle
              </Text>
              <Text style={styles.subtitle}>
                Mapping the intent behind every movement.
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statLabel}>Total Logs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueToday]}>
                  {sessionsToday}
                </Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            </View>
            <TouchableOpacity onPress={resetAll} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.chartSection}>
            <View style={styles.viewModeSelector}>
              <TouchableOpacity
                onPress={() => setViewMode('wheel')}
                style={[
                  styles.viewModeButton,
                  viewMode === 'wheel' && styles.viewModeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.viewModeButtonText,
                    viewMode === 'wheel' && styles.viewModeButtonTextActive,
                  ]}
                >
                  WHEEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('calendar')}
                style={[
                  styles.viewModeButton,
                  viewMode === 'calendar' && styles.viewModeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.viewModeButtonText,
                    viewMode === 'calendar' && styles.viewModeButtonTextActive,
                  ]}
                >
                  CALENDAR
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('trends')}
                style={[
                  styles.viewModeButton,
                  viewMode === 'trends' && styles.viewModeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.viewModeButtonText,
                    viewMode === 'trends' && styles.viewModeButtonTextActive,
                  ]}
                >
                  TRENDS
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              {viewMode === 'wheel' ? (
                <SunburstChart
                  data={data}
                  onNodeClick={handleNodeClick}
                  onNodeEdit={handleEditNode}
                  onAddChild={handleAddChild}
                />
              ) : viewMode === 'calendar' ? (
                <CalendarView
                  logs={logs}
                  data={data}
                  colorMap={nodeColorMap}
                  onLogRequest={handleLogFromCalendar}
                  onDeleteLog={deleteLog}
                />
              ) : (
                <TrendsView
                  logs={logs}
                  data={data}
                  colorMap={nodeColorMap}
                />
              )}
            </View>

            {viewMode === 'wheel' && (
              <View style={styles.infoText}>
                <Text style={styles.infoTextContent}>
                  Tap segments to log or zoom. Tap ✏️ to edit or ➕ to add.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sidebar}>
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>History Log</Text>
              </View>
              <ScrollView style={styles.historyList}>
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <View key={log.id} style={styles.historyItem}>
                      <View style={styles.historyItemHeader}>
                        <View>
                          <Text style={styles.historyItemName}>
                            {log.nodeName}
                          </Text>
                          <Text style={styles.historyItemDate}>
                            {new Date(log.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteLog(log.id)}
                          style={styles.historyDeleteButton}
                        >
                          <Text style={styles.historyDeleteButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.historyItemValue}>
                        <Text style={styles.historyItemValueText}>
                          +{log.value} volume
                        </Text>
                      </View>
                      {log.notes && log.notes !== 'Logged from Watch' && (
                        <Text style={styles.historyItemNotes} numberOfLines={2}>
                          "{log.notes}"
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyHistory}>
                    <Text style={styles.emptyHistoryText}>
                      Start your journey.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {selectedNode && (
        <>
          <LogModal
            isOpen={isLogModalOpen}
            onClose={() => setIsLogModalOpen(false)}
            onLog={handleLogWorkout}
            node={selectedNode}
            defaultDate={preSelectedDate}
          />
          <EditNodeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            node={selectedNode}
            onSave={handleSaveNode}
            onAddChild={handleAddChild}
            onDelete={handleDeleteNode}
            isRoot={selectedNode.id === 'root'}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: '#ef4444',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
  },
  statValueToday: {
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f1f5f9',
  },
  resetButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  resetButtonText: {
    fontSize: 20,
    color: '#94a3b8',
  },
  mainContent: {
    gap: 16,
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 8,
    borderColor: '#1e293b',
    padding: 16,
    minHeight: 700,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#1e293b',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  viewModeButtonTextActive: {
    color: 'white',
  },
  chartContainer: {
    flex: 1,
    minHeight: 600,
  },
  infoText: {
    marginTop: 16,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTextContent: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sidebar: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: '#fef3c7',
    padding: 24,
    borderRadius: 8,
    borderBottomWidth: 8,
    borderBottomColor: '#fde047',
    minHeight: 450,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#fde047',
    paddingBottom: 12,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  historyItemDate: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  historyDeleteButton: {
    padding: 4,
  },
  historyDeleteButtonText: {
    fontSize: 18,
    color: '#ef4444',
  },
  historyItemValue: {
    marginTop: 4,
  },
  historyItemValueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    backgroundColor: '#fde047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyItemNotes: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
});

export default App;

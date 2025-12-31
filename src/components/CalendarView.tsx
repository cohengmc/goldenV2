import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { TrainingNode, WorkoutLog } from '../types';

interface CalendarViewProps {
  logs: WorkoutLog[];
  data: TrainingNode;
  colorMap: Record<string, string>;
  onLogRequest: (node: TrainingNode, date: string) => void;
  onDeleteLog: (logId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  logs,
  data,
  colorMap,
  onLogRequest,
  onDeleteLog,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    new Date().toDateString()
  );
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Flatten leaf nodes for exercise picker
  const exercises = useMemo(() => {
    const list: TrainingNode[] = [];
    const traverse = (node: TrainingNode) => {
      if (!node.children || node.children.length === 0) {
        if (node.id !== 'root' && !node.id.startsWith('add-')) {
          list.push(node);
        }
      } else {
        node.children.forEach(traverse);
      }
    };
    traverse(data);
    return list;
  }, [data]);

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group logs by date
  const logsByDate: Record<string, WorkoutLog[]> = {};
  logs.forEach((log) => {
    const d = new Date(log.date).toDateString();
    if (!logsByDate[d]) logsByDate[d] = [];
    logsByDate[d].push(log);
  });

  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const selectedLogs = selectedDateStr ? logsByDate[selectedDateStr] || [] : [];

  const renderCalendarDay = (day: number | null, index: number) => {
    if (day === null) {
      return <View key={`empty-${index}`} style={styles.emptyDay} />;
    }

    const date = new Date(year, month, day);
    const dateStr = date.toDateString();
    const dayLogs = logsByDate[dateStr] || [];
    const isToday = new Date().toDateString() === dateStr;
    const isSelected = selectedDateStr === dateStr;

    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDay,
          isToday && !isSelected && styles.todayDay,
        ]}
        onPress={() => setSelectedDateStr(dateStr)}
      >
        <View style={styles.dayHeader}>
          <Text
            style={[
              styles.dayNumber,
              isToday && styles.todayNumber,
            ]}
          >
            {day}
          </Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Now</Text>
            </View>
          )}
        </View>
        <View style={styles.logsContainer}>
          {dayLogs.slice(0, 8).map((log, idx) => (
            <View
              key={idx}
              style={[
                styles.logDot,
                { backgroundColor: colorMap[log.nodeId] || '#cbd5e1' },
              ]}
            />
          ))}
          {dayLogs.length > 8 && (
            <Text style={styles.moreLogsText}>+{dayLogs.length - 8}</Text>
          )}
        </View>
        {dayLogs.length > 0 && (
          <Text style={styles.logCount}>{dayLogs.length}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {monthName} <Text style={styles.yearText}>{year}</Text>
        </Text>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.dayHeaderText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar days */}
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => renderCalendarDay(day, index))}
        </View>
      </View>

      {/* Selected day sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <View>
            <Text style={styles.sidebarLabel}>Workout Details</Text>
            <Text style={styles.sidebarTitle}>
              {selectedDateStr === new Date().toDateString()
                ? 'Today'
                : selectedDateStr?.split(' ').slice(0, 3).join(' ')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowExercisePicker(true)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.logsList}>
          {selectedLogs.length > 0 ? (
            selectedLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logItemHeader}>
                  <View style={styles.logItemTitle}>
                    <View
                      style={[
                        styles.logColorDot,
                        { backgroundColor: colorMap[log.nodeId] },
                      ]}
                    />
                    <Text style={styles.logItemName}>{log.nodeName}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDeleteLog(log.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.logItemValue}>{log.value} Volume</Text>
                {log.notes && (
                  <Text style={styles.logItemNotes} numberOfLines={2}>
                    {log.notes.split('\n')[0]}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No Activities</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Text style={styles.footerLabel}>Day Volume</Text>
          <Text style={styles.footerValue}>
            {selectedLogs.reduce((a, b) => a + b.value, 0)} pts
          </Text>
        </View>
      </View>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalLabel}>Select Activity for</Text>
                <Text style={styles.modalTitle}>{selectedDateStr}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowExercisePicker(false);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search exercise..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItem}
                  onPress={() => {
                    onLogRequest(
                      item,
                      new Date(selectedDateStr || '').toISOString().split('T')[0]
                    );
                    setShowExercisePicker(false);
                    setSearchQuery('');
                  }}
                >
                  <View style={styles.exerciseItemContent}>
                    <View
                      style={[
                        styles.exerciseColorDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.exerciseItemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.exerciseArrow}>›</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  yearText: {
    color: '#cbd5e1',
  },
  navigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 20,
    color: '#475569',
  },
  calendarGrid: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1e293b',
    overflow: 'hidden',
    marginBottom: 16,
  },
  dayHeaders: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4,
    backgroundColor: 'white',
  },
  selectedDay: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  todayDay: {
    backgroundColor: '#f8fafc',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  todayNumber: {
    color: '#3b82f6',
  },
  todayBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 7,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  logsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    flex: 1,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreLogsText: {
    fontSize: 8,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  logCount: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  sidebar: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1e293b',
    padding: 16,
    minHeight: 400,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sidebarLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  logsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  logItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logItemTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  logItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#ef4444',
  },
  logItemValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  logItemNotes: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sidebarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 8,
    borderColor: '#1e293b',
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#94a3b8',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    paddingLeft: 40,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  exerciseItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  exerciseArrow: {
    fontSize: 18,
    color: '#cbd5e1',
  },
});


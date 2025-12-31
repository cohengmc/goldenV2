import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { TrainingNode } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (nodeId: string, value: number, notes: string, date?: string) => void;
  node: TrainingNode;
  defaultDate?: string;
}

export const LogModal: React.FC<LogModalProps> = ({
  isOpen,
  onClose,
  onLog,
  node,
  defaultDate,
}) => {
  const [sets, setSets] = useState<number[]>([5]);
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(
    defaultDate || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (defaultDate) {
      setLogDate(defaultDate);
    }
  }, [defaultDate, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSets([5]);
      setNotes('');
      setLogDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const updateSetValue = (index: number, delta: number) => {
    const newSets = [...sets];
    newSets[index] = Math.max(1, newSets[index] + delta);
    setSets(newSets);
  };

  const addSet = () => {
    setSets([...sets, sets[sets.length - 1]]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleLog = () => {
    const totalVolume = sets.reduce((a, b) => a + b, 0);
    const setsBreakdown = `Sets: ${sets.join(', ')}`;
    const finalNotes = notes ? `${notes}\n\n${setsBreakdown}` : setsBreakdown;

    onLog(node.id, totalVolume, finalNotes, logDate);

    setSets([5]);
    setNotes('');
    setLogDate(new Date().toISOString().split('T')[0]);
  };

  const totalVolume = sets.reduce((a, b) => a + b, 0);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { borderTopColor: node.color }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.label}>Logging Activity</Text>
              <Text style={styles.title}>{node.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date of Activity</Text>
              <TextInput
                style={styles.dateInput}
                value={logDate}
                onChangeText={setLogDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Track Sets</Text>
              {sets.map((val, idx) => (
                <View key={idx} style={styles.setRow}>
                  <View style={styles.setLabel}>
                    <Text style={styles.setLabelText}>S{idx + 1}</Text>
                  </View>
                  <View style={styles.setControls}>
                    <TouchableOpacity
                      onPress={() => updateSetValue(idx, -1)}
                      style={styles.setButton}
                    >
                      <Text style={styles.setButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.setValue}>{val}</Text>
                    <TouchableOpacity
                      onPress={() => updateSetValue(idx, 1)}
                      style={styles.setButton}
                    >
                      <Text style={styles.setButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {sets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSet(idx)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
              <Text style={styles.addSetButtonText}>+ Add Another Set</Text>
            </TouchableOpacity>

            <View style={styles.section}>
              <View style={styles.notesHeader}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>
                    Total Volume: {totalVolume}
                  </Text>
                </View>
              </View>
              <TextInput
                style={styles.notesInput}
                placeholder="How did it feel? Any PRs?"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              onPress={handleLog}
              style={[styles.logButton, { backgroundColor: node.color }]}
            >
              <Text style={styles.logButtonText}>
                LOG {sets.length} {sets.length === 1 ? 'SET' : 'SETS'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderTopWidth: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#94a3b8',
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 12,
  },
  dateInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  setLabel: {
    width: 32,
    height: 32,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  setControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  setButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setButtonText: {
    fontSize: 18,
    color: '#475569',
  },
  setValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#ef4444',
  },
  addSetButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  totalBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#475569',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});


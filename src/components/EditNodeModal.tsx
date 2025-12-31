import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { TrainingNode, TRAINING_COLORS } from '../types';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: TrainingNode;
  onSave: (nodeId: string, updates: Partial<TrainingNode>) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (nodeId: string) => void;
  isRoot: boolean;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
  onDelete,
  isRoot,
}) => {
  const [name, setName] = useState(node.name);
  const [color, setColor] = useState(node.color);

  useEffect(() => {
    setName(node.name);
    setColor(node.color);
  }, [node]);

  const handleSave = () => {
    onSave(node.id, { name, color });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Element',
      'Delete this element and all its children?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(node.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Element</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Label Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Node name..."
              />
            </View>

            {!isRoot && (
              <View style={styles.section}>
                <Text style={styles.label}>Theme Color</Text>
                <View style={styles.colorGrid}>
                  {Object.values(TRAINING_COLORS).map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={[
                        styles.colorButton,
                        color === c && styles.colorButtonSelected,
                        { backgroundColor: c },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
              </TouchableOpacity>

              {!isRoot && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>DELETE ELEMENT</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 8,
    borderColor: '#1e293b',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 24,
  },
  title: {
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
  content: {
    padding: 32,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    color: '#1e293b',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#1e293b',
    transform: [{ scale: 1.1 }],
  },
  actions: {
    marginTop: 24,
    gap: 16,
  },
  saveButton: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});


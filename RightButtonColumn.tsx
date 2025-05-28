import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserSettings } from '../../../settings/useUserSettings';
import ActionButton from '../../../components/buttons/ActionButton';
import ToggleButton from '../../../components/buttons/ToggleButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  collapsed: boolean;
  onDrawToggle: () => void;
  drawMode: boolean;
  onToggleCollapse: () => void;
  onZoomToggle: () => void; 
  onCompleteDrawing: () => void;
}

const RightButtonColumn = ({ collapsed, onDrawToggle, drawMode, onToggleCollapse, onZoomToggle, onCompleteDrawing }: Props) => {
  const [activeMode, setActiveMode] = useState<string | null>('drawLine');
  const [isConstructionLine, setIsConstructionLine] = useState(false);
  const [showConstructionLines, setShowConstructionLines] = useState(true);

  const { settings, update } = useUserSettings();

  const toggleMode = (mode: string) => {
    if (mode === 'drawLine') {
      setActiveMode((prev) => (prev === 'drawLine' ? null : 'drawLine'));
    } else if (mode === 'constructionLine') {
      setIsConstructionLine((prev) => !prev);
    } else {
      setActiveMode((prev) => (prev === mode ? null : mode));
    }
  };

  if (collapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <Pressable onPress={onToggleCollapse}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable style={styles.collapseToggle} onPress={onToggleCollapse}>
        <Ionicons name="chevron-forward" size={24} color="black" />
      </Pressable>

      <ToggleButton
        label="Draw Line"
        active={drawMode}
        onPress={onDrawToggle}
      />

      {activeMode === 'drawLine' && (
        <ToggleButton
          label="Line Type: Construction"
          active={isConstructionLine}
          onPress={() => toggleMode('constructionLine')}
        />
      )}

      <ToggleButton
        label="Show Construction Lines"
        active={showConstructionLines}
        onPress={() => setShowConstructionLines((prev) => !prev)}
      />

      <ToggleButton
        label="Draw Object"
        active={activeMode === 'drawObject'}
        onPress={() => toggleMode('drawObject')}
      />

      <ActionButton label="Undo" onPress={() => console.log('Undo')} />
      <ActionButton label="Redo" onPress={() => console.log('Redo')} />
      <ActionButton label="Delete" onPress={() => console.log('Delete')} />

      <ActionButton label="Complete Drawing" onPress={onCompleteDrawing} />

      <ActionButton label="Zoom" onPress={onZoomToggle} />

      <ActionButton label="Dev" onPress={() => update('devOverlayEnabled', !settings.devOverlayEnabled)} />
        <ActionButton
  label="AsyncClear"
  onPress={() => {
    AsyncStorage.clear().then(() => {
      console.log("AsyncStorage cleared!");
      alert("Local storage cleared. Restart the app to apply defaults.");
    });
  }}
/>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    top: 60,
    backgroundColor: '#f4f4f4',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  collapsedContainer: {
    position: 'absolute',
    right: 0,
    top: 60,
    backgroundColor: '#f4f4f4',
    padding: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    elevation: 5,
  },
  collapseToggle: {
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  activeButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#333',
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#fff',
  },
});

export default RightButtonColumn;

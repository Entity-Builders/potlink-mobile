import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import type { Pot } from '@eb-packages/garden';

interface QuickPlantSelectorProps {
  visible: boolean;
  pots: Pot[];
  onClose: () => void;
  onSelect: (pot: Pot) => void;
}

const STATE_EMOJI: Record<string, string> = {
  seeds: '🌱',
  seedling: '🌿',
  young: '🪴',
  mature: '🌳',
};

export const QuickPlantSelector = ({
  visible,
  pots,
  onClose,
  onSelect,
}: QuickPlantSelectorProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>¿Qué planta vamos a curar?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {pots.map((pot) => (
              <TouchableOpacity
                key={pot.id}
                style={styles.potRow}
                onPress={() => onSelect(pot)}
                activeOpacity={0.7}
              >
                {pot.photo_url ? (
                  <Image
                    source={{ uri: pot.photo_url }}
                    style={styles.potImage}
                  />
                ) : (
                  <View style={styles.potEmojiWrap}>
                    <Text style={styles.potEmoji}>
                      {STATE_EMOJI[pot.initial_state] ?? '🌱'}
                    </Text>
                  </View>
                )}

                <View style={styles.potInfo}>
                  <Text style={styles.potName}>{pot.name}</Text>
                  <Text style={styles.potSpecies}>{pot.species}</Text>
                </View>

                <View style={styles.arrowWrap}>
                  <Text style={styles.arrow}>📸</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4332',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  closeIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  potRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F3ED',
  },
  potImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  potEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D8F3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  potEmoji: {
    fontSize: 24,
  },
  potInfo: {
    flex: 1,
    marginLeft: 12,
  },
  potName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 2,
  },
  potSpecies: {
    fontSize: 13,
    color: '#407a52',
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 16,
  },
});

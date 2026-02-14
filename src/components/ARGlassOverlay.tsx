import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

export const ARGlassOverlay = ({ isScanning }: { isScanning: boolean }) => {
  const scanAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0, // Reset instantly
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isScanning]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250], // Match height of scan area
  });

  return (
    <View style={styles.container}>
      {/* Corner Brackets */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />

      {/* Scanning Line */}
      {isScanning && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4ade80', // Green-400
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

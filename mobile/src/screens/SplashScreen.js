import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const stageWidth = Math.min(width, 430);
const stageHeight = height;

const logoTop = Math.min(Math.max(stageHeight * 0.225, 108), 168);
const logoSize = Math.min(stageWidth * 0.18, 72);
const nameWidth = Math.min(stageWidth * 0.74, 300);
const nameHeight = nameWidth / 6.89;

export const SplashScreen = ({
  onSplashFinish,
  duration = 4000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      onSplashFinish?.();
    }, duration);

    return () => {
      clearTimeout(timer);
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
      progressAnim.stopAnimation();
    };
  }, [duration, fadeAnim, onSplashFinish, progressAnim, scaleAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFF7F8" translucent={false} />

      <View style={styles.stage}>
        <Image
          source={require('../../assets/images/camimho2.png')}
          style={styles.backgroundImage}
          resizeMode="stretch"
        />

        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/navora_symbol.png')}
            style={styles.mark}
            resizeMode="contain"
          />

          <Image
            source={require('../../assets/images/nome_navora_sem_fundo.png')}
            style={styles.name}
            resizeMode="contain"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>

        <View style={styles.loadingArea}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  stage: {
    width: stageWidth,
    height: stageHeight,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFF7F8',
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: stageWidth,
    height: stageHeight,
  },

  brandBlock: {
    position: 'absolute',
    top: logoTop,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  mark: {
    width: logoSize,
    height: logoSize,
    backgroundColor: 'transparent',
  },

  name: {
    width: nameWidth,
    height: nameHeight,
    marginTop: 6,
  },

  divider: {
    width: 76,
    height: 8,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  dividerLine: {
    width: 33,
    height: 1,
    backgroundColor: '#F4C3BE',
  },

  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EA8F82',
  },

  loadingArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Math.max(stageHeight * 0.045, 34),
    alignItems: 'center',
  },

  progressTrack: {
    width: Math.min(stageWidth * 0.28, 110),
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(244, 195, 190, 0.65)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#7B1027',
  },

  loadingText: {
    marginTop: 10,
    color: '#7B1027',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SplashScreen;
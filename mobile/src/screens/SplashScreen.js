import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Image as SvgImage,
  Line,
  Mask,
  Path,
} from 'react-native-svg';

import { useApp } from '../context/AppContext';

/*
 * Abertura: o pino percorre o caminho do desenho como indicador de carregamento.
 *
 * O fundo (splash_fundo.jpg) é o desenho original sem o pino e sem o caminho;
 * o caminho (splash_caminho.png) é uma camada separada, desenhada duas vezes:
 * bem clara inteira (o trecho que falta) e forte só no trecho já percorrido.
 *
 * Coordenadas em uma tela de referência de 390 x 844; o desenho é esticado
 * para o tamanho real do palco, então tudo é convertido por sx/sy.
 */

const REF_W = 390;
const REF_H = 844;

// Linha central do caminho, medida no desenho, de baixo (início) para cima (fim).
const ROUTE = [
  [277.5, 789.3], [272.0, 788.5], [266.0, 787.1], [260.0, 785.7], [254.0, 785.7],
  [248.5, 782.8], [243.5, 777.7], [238.5, 772.7], [233.5, 768.4], [228.5, 764.1],
  [223.5, 760.5], [218.5, 756.9], [213.5, 753.3], [208.0, 749.7], [202.5, 746.1],
  [197.0, 742.5], [191.5, 738.9], [186.0, 735.3], [180.5, 731.7], [175.5, 728.1],
  [170.5, 723.7], [165.5, 718.7], [161.5, 712.2], [159.5, 704.3], [161.0, 696.4],
  [163.5, 689.2], [168.0, 683.4], [173.0, 679.1], [178.5, 675.5], [183.5, 671.9],
  [189.0, 669.0], [194.5, 666.1], [200.0, 664.0], [205.5, 661.1], [211.0, 658.2],
  [216.0, 654.6], [220.5, 648.8], [221.0, 640.2], [217.0, 633.7], [212.0, 629.4],
  [206.5, 626.5], [201.0, 624.4], [195.5, 622.2], [189.5, 620.8], [184.0, 618.6],
  [178.5, 616.4], [173.0, 613.6], [169.5, 607.8], [173.0, 602.0], [178.5, 599.2],
  [184.0, 597.0], [189.5, 594.1], [191.0, 586.9],
];

// Cauda desbotada no pé da tela: fica sempre forte (é de onde o pino sai).
const TAIL = [[340, 850], [312, 820], [290, 798]];

const cumulative = (points) => {
  const lens = [0];
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    lens.push(lens[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  return lens;
};

const ROUTE_LENS = cumulative(ROUTE);
const ROUTE_TOTAL = ROUTE_LENS[ROUTE_LENS.length - 1];
const FULL = [...TAIL, ...ROUTE];
const FULL_LENS = cumulative(FULL);
const TAIL_LEN = FULL_LENS[TAIL.length];

// Tamanho do pino no fim do caminho = o pino original do desenho (31,5 x 70).
const PIN_W = 31.5;
const PIN_H = 70;
const PIN_START_SCALE = 0.4;
const PIN_COLOR = '#A9162B';

// Tempos (ms).
const MIN_DURATION = 1500; // nunca termina antes disso (a animação não fica corrida)
const MAX_DURATION = 4000; // termina aqui mesmo se a API ainda não respondeu
// Trecho final depois que o app ficou pronto: o tempo depende de quanto falta
// (antes era fixo em 0,5 s e o pino "voava" o resto do caminho quando o app
// carregava rápido). Mesma velocidade de quem vinha andando, desacelerando.
const FINISH_BASE = 500;
const FINISH_PER_ROUTE = 2600; // ms pra percorrer o caminho inteiro
// Igual ao protótipo aprovado: o pulso em volta do pino toca inteiro e só depois a tela esmaece.
const PULSE_DURATION = 700;
const FADE_DELAY = 700;
const FADE_DURATION = 500;

const AHEAD_OPACITY = 0.2;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
// Desaceleração leve: começa perto da velocidade que o pino já tinha.
const easeOutSoft = (t) => 1 - (1 - t) ** 2;

const pointAt = (fraction) => {
  const d = clamp01(fraction) * ROUTE_TOTAL;
  for (let i = 1; i < ROUTE_LENS.length; i += 1) {
    if (ROUTE_LENS[i] >= d) {
      const t = (d - ROUTE_LENS[i - 1]) / (ROUTE_LENS[i] - ROUTE_LENS[i - 1] || 1);
      return [
        ROUTE[i - 1][0] + (ROUTE[i][0] - ROUTE[i - 1][0]) * t,
        ROUTE[i - 1][1] + (ROUTE[i][1] - ROUTE[i - 1][1]) * t,
      ];
    }
  }
  return ROUTE[ROUTE.length - 1];
};

// Largura da máscara acompanha a perspectiva: fina no horizonte, larga perto da tela.
const maskWidthAt = (y) => 6 + Math.max(0, Math.min(1.25, (y - 587) / 202)) * 24;

const traveledSegments = (dist) => {
  const out = [];
  for (let i = 1; i < FULL.length; i += 1) {
    if (FULL_LENS[i - 1] >= dist) break;
    const a = FULL[i - 1];
    const b = FULL[i];
    const t = Math.min(1, (dist - FULL_LENS[i - 1]) / (FULL_LENS[i] - FULL_LENS[i - 1] || 1));
    const bx = a[0] + (b[0] - a[0]) * t;
    const by = a[1] + (b[1] - a[1]) * t;
    out.push({ x1: a[0], y1: a[1], x2: bx, y2: by, w: maskWidthAt((a[1] + by) / 2) });
  }
  return out;
};

const fundo = require('../../assets/images/splash_fundo.jpg');
const caminho = require('../../assets/images/splash_caminho.png');

export const SplashScreen = ({
  onSplashFinish,
  // App.js avisa quando os dados de navegação e a sessão já foram carregados.
  ready = true,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { appColors, t } = useApp();

  const layout = useMemo(() => {
    const stageWidth = Math.min(width, 430);
    const stageHeight = height;
    const nameWidth = Math.min(stageWidth * 0.74, 300);

    return {
      stageWidth,
      stageHeight,
      sx: stageWidth / REF_W,
      sy: stageHeight / REF_H,
      logoTop: Math.min(Math.max(stageHeight * 0.225, 108), 168),
      logoSize: Math.min(stageWidth * 0.15, 60),
      nameWidth,
      nameHeight: nameWidth / 6.89,
      loadingBottom: Math.max(stageHeight * 0.045, 34) + insets.bottom,
    };
  }, [width, height, insets.bottom]);

  const styles = useMemo(() => createStyles(layout), [layout]);

  // Entrada do logo (igual à versão anterior).
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.96));

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
  }, [fadeAnim, scaleAnim]);

  // "Reduzir movimento" do celular: o pino já aparece no fim, sem percorrer.
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(Boolean(enabled));
    });
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);

  // Linha do tempo: progresso do pino, pulso de chegada e transição para a próxima tela.
  const [frame, setFrame] = useState({ progress: 0, pulse: 0, fade: 0 });
  const readyRef = useRef(ready);
  const reduceMotionRef = useRef(reduceMotion);
  const finishRef = useRef(onSplashFinish);

  useEffect(() => {
    readyRef.current = ready;
    reduceMotionRef.current = reduceMotion;
    finishRef.current = onSplashFinish;
  }, [ready, reduceMotion, onSplashFinish]);

  useEffect(() => {
    const start = Date.now();
    let finishingFrom = null; // { at, progress } quando o app ficou pronto
    let arrivedAt = null;
    let finished = false;
    let rafId;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - start;
      const canFinish =
        elapsed >= MAX_DURATION || (readyRef.current && elapsed >= MIN_DURATION);

      let progress;

      if (reduceMotionRef.current) {
        progress = 1;
        if (arrivedAt === null && canFinish) arrivedAt = now;
      } else if (arrivedAt !== null) {
        progress = 1;
      } else {
        // Enquanto carrega, segue a curva de 4 s (sem passar de 90%).
        const natural = Math.min(0.9, easeInOut(clamp01(elapsed / MAX_DURATION)));

        if (canFinish && finishingFrom === null) {
          finishingFrom = {
            at: now,
            progress: natural,
            duration: FINISH_BASE + (1 - natural) * FINISH_PER_ROUTE,
          };
        }

        if (finishingFrom) {
          const t = clamp01((now - finishingFrom.at) / finishingFrom.duration);
          progress = finishingFrom.progress + (1 - finishingFrom.progress) * easeOutSoft(t);
          if (t >= 1) arrivedAt = now;
        } else {
          progress = natural;
        }
      }

      const sinceArrival = arrivedAt === null ? 0 : now - arrivedAt;
      const pulse =
        arrivedAt === null || reduceMotionRef.current
          ? 0
          : clamp01(sinceArrival / PULSE_DURATION);
      const fade =
        arrivedAt === null ? 0 : clamp01((sinceArrival - FADE_DELAY) / FADE_DURATION);

      setFrame({ progress, pulse, fade });

      if (fade >= 1 && !finished) {
        finished = true;
        finishRef.current?.();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);

  const { progress, pulse, fade } = frame;
  const { sx, sy, stageWidth, stageHeight } = layout;

  const [px, py] = pointAt(progress);
  const pinScale = PIN_START_SCALE + (1 - PIN_START_SCALE) * progress;
  const pinW = PIN_W * pinScale * sx;
  const pinH = PIN_H * pinScale * sy;
  const tipX = px * sx;
  const tipY = py * sy;

  const segments = useMemo(
    () => traveledSegments(TAIL_LEN + ROUTE_TOTAL * progress),
    [progress]
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando o Navora"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <StatusBar style="dark" backgroundColor="#FFF7F8" translucent={false} />

      <View style={styles.stage}>
        <Image source={fundo} style={styles.layer} resizeMode="stretch" />

        {/* Trecho que falta: o caminho inteiro, bem claro. */}
        <Image
          source={caminho}
          style={[styles.layer, { opacity: AHEAD_OPACITY }]}
          resizeMode="stretch"
        />

        {/* Trecho percorrido: o mesmo caminho, forte, recortado até o pino. */}
        <Svg
          style={styles.layer}
          width={stageWidth}
          height={stageHeight}
          viewBox={`0 0 ${REF_W} ${REF_H}`}
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          <Defs>
            <Mask id="trilha-percorrida" maskUnits="userSpaceOnUse" x="0" y="0" width={REF_W} height={REF_H}>
              {segments.map((seg, index) => (
                <Line
                  key={index}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke="#FFFFFF"
                  strokeWidth={seg.w}
                  strokeLinecap="round"
                />
              ))}
            </Mask>
          </Defs>
          <SvgImage
            href={caminho}
            x="0"
            y="0"
            width={REF_W}
            height={REF_H}
            preserveAspectRatio="none"
            mask="url(#trilha-percorrida)"
          />
        </Svg>

        <Animated.View
          style={[
            styles.brandBlock,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
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

        {/* Pulso no chão quando o pino chega. */}
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              left: tipX - 11,
              top: tipY - 4,
              opacity: pulse > 0 ? 0.7 * (1 - pulse) : 0,
              transform: [{ scale: 1 + pulse * 1.6 }],
            },
          ]}
        />

        <View pointerEvents="none" style={[styles.shadow, { left: tipX - 7, top: tipY - 2.5 }]} />

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: tipX - pinW / 2,
            top: tipY - pinH * 0.98,
            width: pinW,
            height: pinH,
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 30 42" preserveAspectRatio="none">
            <Path
              d="M15 1.5C7.5 1.5 1.5 7.4 1.5 14.8c0 9.6 11.4 23.2 12.4 24.4a1.4 1.4 0 0 0 2.2 0c1-1.2 12.4-14.8 12.4-24.4C28.5 7.4 22.5 1.5 15 1.5Z"
              fill={PIN_COLOR}
            />
            <Circle cx="15" cy="14.6" r="5.6" fill="#FFF7F8" />
          </Svg>
        </View>

        <View style={styles.loadingArea}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>

        {/* Transição: esmaece para a cor de fundo da próxima tela (Login/Home), no tema atual. */}
        <View
          pointerEvents="none"
          style={[styles.layer, { backgroundColor: appColors.background, opacity: fade }]}
        />
      </View>
    </View>
  );
};

const createStyles = ({
  stageWidth,
  stageHeight,
  logoTop,
  logoSize,
  nameWidth,
  nameHeight,
  loadingBottom,
}) => StyleSheet.create({
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

  layer: {
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
    marginTop: 14,
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

  ring: {
    position: 'absolute',
    width: 22,
    height: 8,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PIN_COLOR,
  },

  shadow: {
    position: 'absolute',
    width: 14,
    height: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(122, 16, 33, 0.22)',
  },

  loadingArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: loadingBottom,
    alignItems: 'center',
  },

  loadingText: {
    color: '#7B1027',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SplashScreen;

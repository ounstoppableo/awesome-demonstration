import { FlickeringGrid } from '@/components/background/grid-background/grid-background';
import { Waves } from '@/components/background/wave-background/wave-background';
import { selectBackgroundEffects } from '@/store/background-effects/background-effects-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectTheme } from '@/store/theme/theme-slice';

export default function useBackground(props: any) {
  const {} = props;
  const currentBackgroundEffect = useAppSelector(selectBackgroundEffects);
  const theme = useAppSelector(selectTheme);
  const getBackgroundEffect = () => {
    switch (currentBackgroundEffect) {
      case 'grid':
        return (
          <FlickeringGrid
            className="-z-10 absolute inset-0 size-full"
            squareSize={8}
            gridGap={8}
            color="#6B7280"
            maxOpacity={0.5}
            flickerChance={1}
          />
        );
      case 'wave':
        return (
          <Waves
            lineColor={
              theme === 'dark'
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(0, 0, 0, 0.3)'
            }
            backgroundColor="transparent"
            waveSpeedX={0.02}
            waveSpeedY={0.01}
            waveAmpX={40}
            waveAmpY={20}
            friction={0.9}
            tension={0.01}
            maxCursorMove={120}
            xGap={12}
            yGap={36}
          />
        );
    }
  };
  return {
    getBackgroundEffect,
  };
}

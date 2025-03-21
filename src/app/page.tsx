'use client';
import { IconBrandGithub } from '@tabler/icons-react';
import { Carousel } from '@/components/carousel/carousel';
import { FloatingDock } from '@/components/floating-dock/floating-dock';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  backgroundEffectMap,
  selectBackgroundEffects,
  setBackgroundEffect,
} from '@/store/background-effects/background-effects-slice';
import { selectTheme, setTheme } from '@/store/theme/theme-slice';
import {
  Sun,
  Moon,
  Plus,
  Palette,
  Search,
  Dices,
  ThumbsUp,
  SearchIcon,
  XIcon,
  SearchXIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog/index';
import { Button } from '@/components/buttons/button-three';
import useAddComponentForm from './hooks/useAddComponentForm';
import useBackground from '@/hooks/useBackground';
import Loading from '@/components/loading';
import useAuth from '@/hooks/useAuth';
import useAlert from '@/components/alert/useAlert';
import usePersistTheme from '@/hooks/usePersistTheme';
import {
  ConfettiEmoji,
  ConfettiFireworks,
  ConfettiStars,
} from '@/components/confetti';
import usePageCarouselLogic from './hooks/usePageCarouselLogic';
import { Input } from '@/components/suffix-input';

export default function MainPage() {
  const theme = useAppSelector(selectTheme);
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  usePersistTheme();

  const {
    setRandom,
    carousel,
    handleSearch,
    searchComponentName,
    setSearchComponentName,
    handleRandom,
  } = usePageCarouselLogic({
    loading,
    setLoading,
    router,
  });

  const inputRef = useRef(null);

  useEffect(() => {
    const _cb = () => {
      if (inputRef.current) (inputRef.current as any).focus();
    };
    window.addEventListener('keyup', _cb);
    return () => {
      window.removeEventListener('keyup', _cb);
    };
  }, []);
  const links = [
    {
      title: 'Blog',
      icon: (
        <img
          src="https://www.unstoppable840.cn/assets/avatar.jpeg"
          className="h-[100%] w-[100%] rounded-[100%]"
          alt="Aceternity Logo"
        />
      ),
      href: '#',
      handleClick: (e: any) => {
        e.preventDefault();
        window.open('https://www.unstoppable840.cn', '_blank');
      },
    },

    {
      title: 'Thumbs up',
      icon: (
        <ThumbsUp className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
      handleClick: (e: any) => {
        Math.random() < 0.3
          ? ConfettiFireworks()
          : Math.random() < 0.6
            ? ConfettiEmoji()
            : ConfettiStars();
      },
    },
    {
      title: 'Random',
      icon: (
        <Dices className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
      handleClick: (e: any) => {
        handleRandom();
      },
    },
    {
      title: 'Search',
      icon: (
        <Search className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      popover: (
        <div className="relative">
          <Input
            ref={inputRef}
            className="w-48 rounded-full"
            placeholder="Component Name ..."
            onKeyUp={handleSearch}
            value={searchComponentName}
            onChange={(e) => setSearchComponentName(e.target.value)}
          />
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Subscribe"
            onClick={handleSearch}
          >
            <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      ),
      popCb: () => {
        (inputRef.current as any)?.focus();
      },
      handleClick: () => {
        (inputRef.current as any)?.focus();
        setRandom(false);
      },
      href: '#',
    },
    {
      title: 'Backgrounds',
      icon: (
        <Palette className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
      handleClick: (e: any) => {
        backgroundEffectMap[currentBackgroundEffect].removeBackground();
        const newBackgroundEffect = Object.keys(backgroundEffectMap).filter(
          (key) => key !== currentBackgroundEffect,
        );
        dispatch(
          setBackgroundEffect(
            newBackgroundEffect[
              Math.floor(Math.random() * newBackgroundEffect.length)
            ] as any,
          ),
        );
      },
    },

    {
      title: 'Theme',
      icon:
        theme !== 'dark' ? (
          <Moon className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ) : (
          <Sun className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
      href: '#',
      handleClick: (e: any) => {
        const newTheme =
          document.documentElement.className === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        dispatch(setTheme(newTheme));
      },
    },
    {
      title: 'GitHub',
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
      handleClick: (e: any) => {
        e.preventDefault();
        window.open(
          'https://github.com/ounstoppableo/awesome-demonstration',
          '_blank',
        );
      },
    },
  ];

  const currentBackgroundEffect = useAppSelector(selectBackgroundEffects);
  const dispatch = useAppDispatch();

  useEffect(() => {
    currentBackgroundEffect &&
      backgroundEffectMap[currentBackgroundEffect].setBackground();
    return () => {
      currentBackgroundEffect &&
        backgroundEffectMap[currentBackgroundEffect].removeBackground();
    };
  }, [currentBackgroundEffect]);

  useEffect(() => {
    backgroundEffectMap[currentBackgroundEffect].removeBackground();
    backgroundEffectMap[currentBackgroundEffect].setBackground();
    return () => {
      backgroundEffectMap[currentBackgroundEffect].removeBackground();
    };
  }, [theme]);

  useEffect(() => {
    const token = searchParams.get('token');
    token && localStorage.setItem('token', token);
  }, []);

  const { getBackgroundEffect } = useBackground({ container: 'background' });

  const { auth } = useAuth();

  const { alertVDom } = useAlert({});

  const {
    formStep,
    AddComponentForm,
    handleSubmitBtnClick,
    showLoadingForStepTwo,
  } = useAddComponentForm({ setDialogOpen });

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      {alertVDom}
      <div className="flex flex-col items-center justify-center gap-[8%] absolute inset-0 overflow-hidden">
        <div className="w-full">{carousel}</div>
        <div className="z-50 flex items-center justify-center h-fit w-fit select-none max-sm:absolute max-sm:bottom-[8%] max-sm:scale-75">
          <FloatingDock items={links} />
        </div>
      </div>
      {auth ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <div className="absolute left-2 h-10 w-10 z-40 text-neutral-600 dark:text-neutral-200 bottom-[5%] rounded-[2.5rem] hover:w-48 bg-neutral-200 dark:bg-neutral-800 transition-all duration-300 overflow-hidden">
              <div className="h-10 w-10 rounded-[9999px]  flex justify-center items-center">
                <Plus />
                <div className="absolute w-40 left-7">Add Component</div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="w-fit">
            <DialogHeader>
              <DialogTitle>Add Component</DialogTitle>
              <DialogDescription>
                Add your components here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {AddComponentForm}
            <Loading
              className={'rounded-lg'}
              showLoading={showLoadingForStepTwo}
              cubeSize={60}
            ></Loading>
            <DialogFooter>
              <Button type="submit" onClick={handleSubmitBtnClick}>
                {formStep === 1 || formStep === 2 ? 'Next' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <></>
      )}
      <Loading showLoading={loading}></Loading>
      {getBackgroundEffect()}
    </div>
  );
}

'use client';
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from '@tabler/icons-react';
import { Carousel } from '@/components/carousel/carousel';
import { FloatingDock } from '@/components/floating-dock/floating-dock';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  backgroundEffectMap,
  selectBackgroundEffects,
  setBackgroundEffect,
} from '@/store/background-effects/background-effects-slice';
import { selectTheme, setTheme } from '@/store/theme/theme-slice';
import { Sun, Moon, Plus, Palette } from 'lucide-react';
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
import { getComponentList, getFileContent } from './lib/data';
import Viewer from '@/components/viewer/viewer';
import { formatDataToViewerAdaptor } from '@/utils/dataFormat';
import useBackground from '@/hooks/useBackground';
import Loading from '@/components/loading';
import useAuth from '@/hooks/useAuth';
import useAlert from '@/components/alert/useAlert';
import usePersistTheme from '@/hooks/usePersistTheme';

export default function MainPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [slideData, setSlideData] = useState([]);
  const theme = useAppSelector(selectTheme);
  const searchParams = useSearchParams();
  usePersistTheme();

  const links = [
    {
      title: 'Home',
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
    },

    {
      title: 'Products',
      icon: (
        <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
    },
    {
      title: 'Components',
      icon: (
        <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: '#',
    },
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
      icon: theme !== 'dark' ? <Moon /> : <Sun />,
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
    getComponentList().then(async (res) => {
      if (res.code === 200) {
        const slideData: any = await Promise.all(
          res.data.map(async (item: any, index: any) => {
            const componentInfoForViewer = formatDataToViewerAdaptor(
              item,
              item.framework[0],
            );
            const res = await getFileContent({
              id: componentInfoForViewer.id,
              fileName: componentInfoForViewer.entryFile,
            });
            if (res.code === 200) {
              componentInfoForViewer.fileContentsMap[
                componentInfoForViewer.entryFile
              ] = res.data.fileContent;
            } else {
              componentInfoForViewer.fileContentsMap[
                componentInfoForViewer.entryFile
              ] = '';
            }

            return {
              title: item.name,
              button: 'Explore Component',
              handleClick: (e: any) => {
                router.push(`/editor?id=${item.id}`);
              },
              slot: (
                <Viewer
                  key={index}
                  componentInfoForParent={componentInfoForViewer}
                ></Viewer>
              ),
            };
          }),
        );
        setSlideData(slideData);
      }
      setLoading(false);
    });
  }, []);

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
  } = useAddComponentForm();

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      {alertVDom}
      <div className="flex flex-col items-center justify-end gap-[6%] h-full w-full">
        <div className="w-full">
          <Carousel slides={slideData} />
        </div>
        <div className="z-[48] flex items-center justify-center h-fit w-fit select-none pb-[2%]">
          <FloatingDock mobileClassName="translate-y-20" items={links} />
        </div>
      </div>
      {auth ? (
        <Dialog>
          <DialogTrigger>
            <div className="absolute left-2 h-10 w-10 z-40 text-neutral-600 dark:text-neutral-200 bottom-12 rounded-[2.5rem] hover:w-48 bg-neutral-200 dark:bg-neutral-800 transition-all duration-300 overflow-hidden">
              <div className="h-10 w-10 rounded-[9999px]  flex justify-center items-center">
                <Plus />
                <div className="absolute w-40 left-7">Add Component</div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="w-fit overflow-hidden">
            <DialogHeader>
              <DialogTitle>Add Component</DialogTitle>
              <DialogDescription>
                Add your components here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {AddComponentForm}
            <Loading
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

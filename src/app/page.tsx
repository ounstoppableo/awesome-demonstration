'use client';
import { IconBrandGithub } from '@tabler/icons-react';
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
import {
  Sun,
  Moon,
  Plus,
  Palette,
  Search,
  Dices,
  ThumbsUp,
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
import { getComponentList, getFileContent } from './lib/data';
import Viewer from '@/components/viewer/viewer';
import { formatDataToViewerAdaptor } from '@/utils/dataFormat';
import useBackground from '@/hooks/useBackground';
import Loading from '@/components/loading';
import useAuth from '@/hooks/useAuth';
import useAlert from '@/components/alert/useAlert';
import usePersistTheme from '@/hooks/usePersistTheme';
import {
  ConfettiEmoji,
  ConfettiFireworks,
  ConfettiRef,
  ConfettiStars,
} from '@/components/confetti';
import useGetComponentLimitCount from './hooks/useGetComponentLimitCount';

export default function MainPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [slideData, setSlideData] = useState([]);
  const theme = useAppSelector(selectTheme);
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shouldAddpage, setshouldAddpage] = useState(1);
  const { limit } = useGetComponentLimitCount({});
  const carouselRef = useRef<any>(null);
  const [componetListRaw, setComponentListRaw] = useState<any>({});
  const [componentList, setComponentList] = useState<any>([]);
  const [curretnCarusalIndex, setCurrentCarusalIndex] = useState(0);
  usePersistTheme();

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
    },
    {
      title: 'Search',
      icon: (
        <Search className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
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

  const handleSetComponentList = () => {
    setLoading(true);
    getComponentList({ page: shouldAddpage, limit }).then(async (res: any) => {
      if (res.code === 200) {
        setComponentListRaw({ ...componetListRaw, [shouldAddpage]: res.data });
      }
      setLoading(false);
    });
  };

  const handleGenerateCarusalData = async () => {
    const slideData: any = await Promise.all(
      componentList.map(async (item: any, index: any) => {
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

        const showRange = Math.ceil(limit / 2) - 1;

        return {
          title: item.name,
          button: 'Explore Component',
          handleClick: (e: any) => {
            router.push(`/editor?id=${item.id}`);
          },
          slot:
            curretnCarusalIndex <= index + showRange &&
            curretnCarusalIndex >= index - showRange ? (
              <Viewer
                key={index}
                componentInfoForParent={componentInfoForViewer}
              ></Viewer>
            ) : (
              <></>
            ),
        };
      }),
    );
    setSlideData(slideData);
  };

  useEffect(() => {
    setComponentList(
      [
        ...new Map(
          Object.values(componetListRaw)
            .flat()
            .map((component: any) => [component.index, component]),
        ).values(),
      ].sort((a: any, b: any) => +a.index - +b.index),
    );
  }, [componetListRaw]);

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
    handleSetComponentList();
  }, [limit, shouldAddpage]);

  useEffect(() => {
    const currentPage = Math.floor(curretnCarusalIndex / limit) + 1;
    const startIndex = (currentPage - 1) * limit;
    const endIndex = currentPage * limit - 1;
    if (curretnCarusalIndex >= endIndex - Math.floor(limit / 4)) {
      setshouldAddpage(currentPage + 1);
      return;
    }
    if (curretnCarusalIndex <= startIndex + Math.floor(limit / 4)) {
      setshouldAddpage(currentPage === 1 ? 1 : currentPage - 1);
      return;
    }
    setshouldAddpage(currentPage);
  }, [curretnCarusalIndex, limit]);

  useEffect(() => {
    handleGenerateCarusalData();
  }, [componentList, limit, curretnCarusalIndex]);

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
      <div className="flex flex-col items-center justify-end gap-[6%] absolute inset-0 overflow-hidden">
        <div className="w-full">
          <Carousel
            handleChange={setCurrentCarusalIndex}
            ref={carouselRef}
            slides={slideData}
          />
        </div>
        <div className="z-50 flex items-center justify-center h-fit w-fit select-none pb-[2%]">
          <FloatingDock mobileClassName="translate-y-20" items={links} />
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

import { useEffect, useRef, useState } from 'react';
import useGetComponentLimitCount from './useGetComponentLimitCount';
import { useRouter } from 'next/router';
import {
  getComponentList,
  getFileContent,
  randomComponent,
  searchComponentResPage,
} from '../lib/data';
import { formatDataToViewerAdaptor } from '@/utils/dataFormat';
import Viewer from '@/components/viewer/viewer';
import { Carousel } from '@/components/carousel/carousel';

export default function usePageCarouselLogic(props: any) {
  const { loading, setLoading, router } = props;
  const carouselRef = useRef<any>(null);
  const [slideData, setSlideData] = useState([]);
  const [shouldAddpage, setshouldAddpage] = useState(1);
  const [componetListRaw, setComponentListRaw] = useState<any>({});
  const [componentList, setComponentList] = useState<any>([]);
  const [currentCarusalIndex, setCurrentCarusalIndex] = useState(0);
  const [carouselAnimate, setCarouselAnimate] = useState(true);
  const { limit } = useGetComponentLimitCount({});
  const [searchResIndex, setSearchResIndex] = useState<any>(null);
  const [random, setRandom] = useState(false);
  const [randomList, setRandomList] = useState([]);
  const [lastPage, setLastPage] = useState<any>(null);

  const handleSetComponentList = () => {
    if (
      (lastPage && shouldAddpage >= lastPage) ||
      (componetListRaw[shouldAddpage] &&
        componetListRaw[shouldAddpage].length === limit)
    )
      return;
    setLoading(true);
    getComponentList({ page: shouldAddpage, limit }).then(async (res: any) => {
      if (res.code === 200) {
        setCarouselAnimate(false);
        setComponentListRaw({
          ...componetListRaw,
          [shouldAddpage]: res.data,
        });
        if (shouldAddpage === 1 && (!res.data || !res.data.length))
          setLoading(false);
        if (
          (!res.data || !res.data.length || res.data.length < limit) &&
          !lastPage
        )
          setLastPage(shouldAddpage);
      }
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
            currentCarusalIndex <= index + showRange &&
            currentCarusalIndex >= index - showRange ? (
              <Viewer
                key={item.index}
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

  const setComponentListFromRaw = () => {
    setComponentList(
      random
        ? randomList
        : [
            ...new Map(
              Object.values(componetListRaw)
                .flat()
                .map((component: any) => [component.index, component]),
            ).values(),
          ].sort((a: any, b: any) => +a.index - +b.index),
    );
  };

  useEffect(() => {
    handleSetComponentList();
  }, [limit, shouldAddpage]);

  useEffect(() => {
    setCurrentCarusalIndex(0);
    setLastPage(null);
  }, [limit]);

  useEffect(() => {
    setComponentListFromRaw();
  }, [componetListRaw, random, randomList]);

  useEffect(() => {
    handleGenerateCarusalData();
  }, [componentList, limit, currentCarusalIndex]);

  useEffect(() => {
    if (random) return;
    if (
      !componentList ||
      componentList.length === 0 ||
      !componentList[currentCarusalIndex]
    )
      return;
    const currentPage =
      Math.floor((componentList[currentCarusalIndex].index - 1) / limit) + 1;
    const startIndex = (currentPage - 1) * limit;
    const endIndex = currentPage * limit - 1;
    if (currentCarusalIndex >= endIndex - Math.floor(limit / 2)) {
      setshouldAddpage(currentPage + 1);
      return;
    }
    if (currentCarusalIndex <= startIndex + Math.floor(limit / 2)) {
      setshouldAddpage(currentPage === 1 ? 1 : currentPage - 1);
      return;
    }
    setshouldAddpage(currentPage);
  }, [currentCarusalIndex, limit, random]);

  useEffect(() => {
    if (!slideData.length) return;
    setLoading(false);
  }, [slideData]);

  useEffect(() => {
    setCarouselAnimate(true);
  }, [slideData.length]);

  useEffect(() => {
    if (lastPage && lastPage <= shouldAddpage) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setCarouselAnimate(true));
      } else {
        setTimeout(() => setCarouselAnimate(true), 0);
      }
    }
  }, [lastPage]);

  const [searchComponentName, setSearchComponentName] = useState('');
  const handleSearch = (e: any) => {
    if (
      (e.type === 'keyup' && e.key !== 'Enter') ||
      (e.type !== 'click' && e.type !== 'keyup')
    )
      return;
    if (!searchComponentName) return;
    setLoading(true);
    searchComponentResPage({ componentName: searchComponentName, limit }).then(
      (res) => {
        if (res.code === 200 && res.data.page && res.data.index) {
          setComponentListRaw({
            ...componetListRaw,
            [res.data.page]: res.data.pageList,
          });
          if (res.data.pageList < limit) setLastPage(res.data.page);
        } else {
          setLoading(false);
        }
        setSearchResIndex(res.data.index);
        setSearchComponentName('');
      },
    );
  };

  const handleRandom = () => {
    setLoading(true);
    setRandom(true);
    randomComponent().then((res) => {
      if (res.code === 200) {
        setRandomList(res.data);
        setCurrentCarusalIndex(0);
        if (!res.data || !res.data.length) setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (searchResIndex) {
      const index = componentList.findIndex(
        (component: any) => component.index === searchResIndex,
      );
      index >= 0 && setCurrentCarusalIndex(index);
    }
  }, [searchResIndex, slideData]);

  useEffect(() => {
    if (!random) {
      setComponentListFromRaw();
      setCurrentCarusalIndex(0);
    }
  }, [random]);

  const carousel = (
    <Carousel
      ref={carouselRef}
      slides={slideData}
      animate={carouselAnimate}
      current={currentCarusalIndex}
      setCurrent={setCurrentCarusalIndex}
      handleClick={() => setSearchResIndex(null)}
    />
  );

  return {
    carousel,
    handleSearch,
    searchComponentName,
    currentCarusalIndex,
    setSearchComponentName,
    handleRandom,
    setRandom,
  };
}

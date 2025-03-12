import { useEffect, useRef, useState } from 'react';

export default function useGetComponentLimitCount(props: any) {
  const {} = props;
  const [limit, setLimit] = useState(4);
  const _timer = useRef<any>(null);
  useEffect(() => {
    const _resizeCb = () => {
      if (_timer.current) clearTimeout(_timer.current);
      _timer.current = setTimeout(() => {
        const componentWidth = (document.querySelector('.carouselItem') as any)
          ?.offsetWidth;
        if (componentWidth) {
          setLimit(Math.floor(window.innerWidth / componentWidth));
        }
        _timer.current = null;
      }, 500);
    };
    _resizeCb();
    window.addEventListener('resize', _resizeCb);
    return () => {
      window.removeEventListener('resize', _resizeCb);
    };
  }, []);
  return { limit };
}

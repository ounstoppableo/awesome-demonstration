'use client';
import useBackground from '@/hooks/useBackground';
import { IconArrowNarrowRight } from '@tabler/icons-react';
import React, {
  useState,
  useRef,
  useId,
  useEffect,
  useImperativeHandle,
} from 'react';

interface SlideData {
  title: string;
  button: string;
  slot: string;
  handleClick: (event: React.MouseEvent<HTMLButtonElement>) => any;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;

      const x = xRef.current;
      const y = yRef.current;

      slideRef.current.style.setProperty('--x', `${x}px`);
      slideRef.current.style.setProperty('--y', `${y}px`);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.opacity = '1';
  };

  const { getBackgroundEffect } = useBackground({ container: 'other' });

  const { slot, button, title, handleClick } = slide;

  return (
    <div className="carouselItem [perspective:1200px] [transform-style:preserve-3d] select-none">
      <li
        ref={slideRef}
        className="group flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 transition-all duration-300 ease-in-out w-[70vmin] h-[70vmin] mx-[4vmin] z-10"
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            current !== index
              ? 'scale(0.98) rotateX(8deg)'
              : 'scale(1) rotateX(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'bottom',
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full gradient-border rounded-[5%] overflow-hidden transition-all duration-150 ease-out"
          style={{
            transform:
              current === index
                ? 'translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)'
                : 'none',
          }}
        >
          {getBackgroundEffect()}
          <div
            style={{
              opacity: current === index ? 1 : 0.5,
            }}
            className="absolute inset-[2px] rounded-[5%] overflow-hidden object-cover opacity-100 transition-opacity duration-600 ease-in-out"
          >
            {slot}
          </div>
          {current === index ? (
            <div className="absolute inset-[2px] rounded-[5%] group-hover:bg-black/20 transition-all duration-1000"></div>
          ) : (
            <></>
          )}
          {current !== index ? (
            <div className="absolute inset-[2px] rounded-[5%] bg-black/10 transition-all duration-1000"></div>
          ) : (
            <></>
          )}
        </div>

        <article
          className={`${
            current === index
              ? 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              : 'opacity-0 invisible'
          } relative p-[4vmin] transition-opacity duration-1000 ease-in-out `}
        >
          <h2 className="text-lg md:text-2xl lg:text-4xl font-semibold  relative">
            {title}
          </h2>
          <div className="flex justify-center">
            <button
              onClick={handleClick}
              className="mt-6 px-4 py-2 w-fit mx-auto sm:text-sm text-black bg-white h-12 border border-transparent text-xs flex justify-center items-center rounded-2xl hover:shadow-lg transition duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
            >
              {button}
            </button>
          </div>
        </article>
      </li>
    </div>
  );
};

interface CarouselControlProps {
  type: string;
  title: string;
  handleClick: () => void;
}

const CarouselControl = ({
  type,
  title,
  handleClick,
}: CarouselControlProps) => {
  return (
    <button
      className={`relative z-30 w-10 h-10 flex items-center mx-2 justify-center bg-neutral-200 dark:bg-neutral-800 border-3 border-transparent rounded-full focus:border-[#6D64F7] focus:outline-none hover:-translate-y-0.5 active:translate-y-0.5 transition duration-200 ${
        type === 'previous' ? 'rotate-180' : ''
      }`}
      title={title}
      onClick={handleClick}
    >
      <IconArrowNarrowRight className="text-neutral-600 dark:text-neutral-200" />
    </button>
  );
};

interface CarouselProps {
  slides: SlideData[];
  handleChange?: (...args: any) => any;
}

export const Carousel = React.forwardRef<any, CarouselProps>(
  ({ slides, handleChange }: CarouselProps, ref) => {
    const [current, setCurrent] = useState(0);

    useImperativeHandle(ref, () => ({
      current: () => current,
    }));

    const handlePreviousClick = () => {
      const previous = current - 1;
      setCurrent(previous < 0 ? slides.length - 1 : previous);
    };

    const handleNextClick = () => {
      const next = current + 1;
      setCurrent(next === slides.length ? 0 : next);
    };

    const handleSlideClick = (index: number) => {
      if (current !== index) {
        setCurrent(index);
      }
    };

    useEffect(() => {
      handleChange && handleChange(current);
    }, [current]);

    const id = useId();

    return (
      <>
        <div
          className="relative w-[70vmin] h-[70vmin] mx-auto z-10"
          aria-labelledby={`carousel-heading-${id}`}
        >
          <ul
            className="absolute flex mx-[-4vmin] transition-transform duration-1000 ease-in-out"
            style={{
              transform: `translateX(-${current * (100 / slides.length)}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <Slide
                key={index}
                slide={slide}
                index={index}
                current={current}
                handleSlideClick={handleSlideClick}
              />
            ))}
          </ul>
        </div>
        <div className="absolute inset-0 flex justify-between items-center">
          <CarouselControl
            type="previous"
            title="Go to previous slide"
            handleClick={handlePreviousClick}
          />

          <CarouselControl
            type="next"
            title="Go to next slide"
            handleClick={handleNextClick}
          />
        </div>
      </>
    );
  },
);

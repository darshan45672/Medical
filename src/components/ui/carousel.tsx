import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselProps {
  children: React.ReactNode[]
  className?: string
}

export function Carousel({ children, className = '' }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  })
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  if (children.length === 0) return null

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {children.map((child, index) => (
            <div key={index} className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(33.333%-11px)] min-w-0">
              {child}
            </div>
          ))}
        </div>
      </div>
      
      {children.length > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-gray-300 dark:border-slate-600 shadow-lg hover:bg-white dark:hover:bg-slate-800 ${
              !prevBtnEnabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-gray-300 dark:border-slate-600 shadow-lg hover:bg-white dark:hover:bg-slate-800 ${
              !nextBtnEnabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

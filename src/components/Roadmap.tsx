import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Roadmap = () => {
  const sliderRef = useRef<Slider | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const milestones = [
    {
      quarter: 'Q2 2025',
      title: 'Lanzamiento Beta',
      description:
        'Primera versión de la API con soporte para OpenZeppelin y Uniswap V3. Documentación inicial y ejemplos básicos.',
      icon: '🚀',
    },
    {
      quarter: 'Q3 2025',
      title: 'Mejoras de Seguridad',
      description:
        'Integración de análisis de seguridad automatizado para los contratos generados. Auditorías de código y optimización de gas.',
      icon: '🔒',
    },
    {
      quarter: 'Q4 2025',
      title: 'Ampliación de Frameworks',
      description:
        'Añadir soporte para nuevos frameworks y estándares. Compatibilidad con Solidity 0.8.30+.',
      icon: '🔧',
    },
    {
      quarter: 'Q1 2026',
      title: 'Herramientas Avanzadas',
      description:
        'Visualizador de contratos completo, herramientas de prueba automatizadas y despliegue directo a testnet y mainnet.',
      icon: '⚙️',
    },
  ];

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '25%',
    arrows: false,
    beforeChange: (current: number, next: number) => setActiveSlide(next),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          centerPadding: '15%',
        },
      },
      {
        breakpoint: 768,
        settings: {
          centerPadding: '5%',
        },
      },
    ],
  };

  const nextSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickNext();
    }
  };

  const prevSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPrev();
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center text-white mb-12">
        Nuestro Roadmap
      </h2>

      {/* Línea de progreso */}
      <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-gray-700 rounded-full z-0">
        <div
          className="h-full bg-gradient-to-r from-rootstock-primary to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${(activeSlide / (milestones.length - 1)) * 100}%` }}
        ></div>
      </div>

      {/* Controles del carrusel */}
      <div className="flex justify-between absolute top-1/2 left-0 right-0 transform -translate-y-1/2 z-20 px-4">
        <button
          onClick={prevSlide}
          className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Carrusel */}
      <div className="relative z-10 mt-8">
        <Slider ref={sliderRef} {...settings}>
          {milestones.map((milestone, index) => (
            <div key={index} className="px-4 outline-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: activeSlide === index ? 1 : 0.9,
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className={`
                    bg-gradient-to-br rounded-2xl p-8 shadow-xl border
                    ${
                      activeSlide === index
                        ? 'from-[#1a1f3d] to-[#12152a] border-rootstock-primary/50 shadow-rootstock-primary/20'
                        : 'from-[#191c36] to-[#12152a] border-gray-800'
                    }
                    transition-all duration-300 h-full
                  `}
                >
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{milestone.icon}</div>
                    <div>
                      <span className="inline-block px-4 py-1 bg-rootstock-primary/20 text-rootstock-primary rounded-full text-sm font-medium">
                        {milestone.quarter}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {milestone.description}
                  </p>

                  {activeSlide === index && (
                    <motion.div
                      className="mt-6 pt-6 border-t border-gray-700"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-3 w-3 rounded-full ${index <= activeSlide ? 'bg-green-500' : 'bg-gray-600'} mr-3`}
                        ></div>
                        <span className="text-sm text-gray-400">
                          {index < activeSlide
                            ? 'Completado'
                            : index === activeSlide
                              ? 'En progreso'
                              : 'Pendiente'}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </Slider>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center mt-8 space-x-2">
        {milestones.map((_, index) => (
          <button
            key={index}
            onClick={() => sliderRef.current?.slickGoTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSlide === index
                ? 'bg-rootstock-primary w-6'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Roadmap;

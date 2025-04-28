
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const Hero = () => {
  return (
    <section className="pt-32 pb-16 px-4 md:px-8 relative min-h-[80vh] flex items-center">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-48 left-10 w-72 h-72 bg-rootstock-primary opacity-10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600 opacity-10 rounded-full blur-[120px]" />
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="bg-gradient-to-r from-rootstock-primary to-purple-600 px-4 py-1 rounded-full text-sm font-medium text-white">
              Powered by IA
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Contratos Inteligentes <span className="text-transparent bg-clip-text bg-gradient-to-r from-rootstock-primary to-purple-600">en Segundos</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Crea y personaliza contratos inteligentes para Rootstock utilizando IA. 
            Optimizado con OpenZeppelin y compatible con los estándares más recientes.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a href="#demo" className="px-8 py-4 bg-rootstock-primary text-white rounded-lg hover:bg-rootstock-primary/90 transition-colors flex items-center justify-center">
              Probar Ahora
              <ArrowDown className="ml-2 h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

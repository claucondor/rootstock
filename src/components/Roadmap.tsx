
import { motion } from 'framer-motion';

const Roadmap = () => {
  const milestones = [
    {
      quarter: "Q2 2025",
      title: "Lanzamiento Beta",
      description: "Primera versión de la API con soporte para OpenZeppelin y Uniswap V3. Documentación inicial y ejemplos básicos."
    },
    {
      quarter: "Q3 2025",
      title: "Mejoras de Seguridad",
      description: "Integración de análisis de seguridad automatizado para los contratos generados. Auditorías de código y optimización de gas."
    },
    {
      quarter: "Q4 2025",
      title: "Ampliación de Frameworks",
      description: "Añadir soporte para nuevos frameworks y estándares. Compatibilidad con Solidity 0.8.30+."
    },
    {
      quarter: "Q1 2026",
      title: "Herramientas Avanzadas",
      description: "Visualizador de contratos completo, herramientas de prueba automatizadas y despliegue directo a testnet y mainnet."
    }
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Línea central */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-rootstock-primary/30"></div>
      
      {milestones.map((milestone, index) => (
        <motion.div 
          key={index}
          className={`flex items-center mb-16 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className={`w-5/12 ${index % 2 === 1 && 'order-2'}`}>
            <div className="bg-[#191c36] rounded-xl p-6 shadow-lg border border-gray-800">
              <span className="inline-block px-4 py-1 bg-rootstock-primary/20 text-rootstock-primary rounded-full text-sm font-medium mb-4">
                {milestone.quarter}
              </span>
              <h3 className="text-xl font-bold mb-2 text-white">{milestone.title}</h3>
              <p className="text-gray-300">{milestone.description}</p>
            </div>
          </div>
          
          <div className={`w-2/12 flex justify-center ${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
            <div className="w-8 h-8 rounded-full bg-rootstock-primary border-4 border-[#12152a] z-10"></div>
          </div>
          
          <div className="w-5/12"></div>
        </motion.div>
      ))}
    </div>
  );
};

export default Roadmap;

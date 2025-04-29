import { motion } from 'framer-motion';

const Technologies = () => {
  const technologies = [
    {
      name: 'Rootstock',
      logo: '/images/rootstock-network.png',
      description:
        'Red blockchain compatible con EVM que permite contratos inteligentes en Bitcoin',
    },
    {
      name: 'OpenZeppelin',
      logo: 'https://seeklogo.com/images/O/openzeppelin-logo-2909FE553F-seeklogo.com.png',
      description: 'Biblioteca de contratos inteligentes seguros y auditados',
    },
    {
      name: 'Solidity',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Solidity_logo.svg',
      description:
        'Lenguaje de programación para contratos inteligentes en Ethereum y redes compatibles',
    },
    {
      name: 'Hardhat',
      logo: 'https://seeklogo.com/images/H/hardhat-logo-888739EBB4-seeklogo.com.png',
      description:
        'Entorno de desarrollo para compilar, probar y desplegar contratos inteligentes',
    },
    {
      name: 'React',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      description:
        'Biblioteca JavaScript para construir interfaces de usuario interactivas',
    },
    {
      name: 'TypeScript',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg',
      description:
        'Superset de JavaScript con tipado estático para desarrollo más robusto',
    },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-3 py-1 bg-rootstock-primary/20 text-rootstock-primary rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Stack Tecnológico
          </motion.span>

          <motion.h2
            className="text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Tecnologías Utilizadas
          </motion.h2>

          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Nuestra plataforma está construida con las tecnologías más avanzadas
            y seguras del ecosistema blockchain.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <img
                  src={tech.logo}
                  alt={tech.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tech.name}</h3>
              <p className="text-sm text-gray-300">{tech.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div className="inline-block px-6 py-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-300">
              Todas estas tecnologías se combinan para ofrecerte la mejor
              experiencia en la generación de contratos inteligentes.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Technologies;

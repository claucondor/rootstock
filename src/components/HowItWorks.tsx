import { motion } from 'framer-motion';
import { MessageSquare, Code, FileText, Rocket } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <MessageSquare className="h-10 w-10 text-white" />,
      title: 'Describe your contract',
      description:
        'Explain in natural language what type of contract you need and its specific functionalities.',
      color: 'from-blue-600 to-blue-400',
    },
    {
      icon: <Code className="h-10 w-10 text-white" />,
      title: 'AI Generation',
      description:
        'Our AI analyzes your description and generates an optimized and secure smart contract.',
      color: 'from-purple-600 to-purple-400',
    },
    {
      icon: <FileText className="h-10 w-10 text-white" />,
      title: 'Customize and refine',
      description:
        'Review the generated contract, request specific changes or adjust parameters according to your needs.',
      color: 'from-green-600 to-green-400',
    },
    {
      icon: <Rocket className="h-10 w-10 text-white" />,
      title: 'Deploy to Rootstock',
      description:
        'Compile and deploy your contract directly to the Rootstock network with one click.',
      color: 'from-rootstock-primary to-red-400',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-3 py-1 bg-rootstock-primary/20 text-rootstock-primary rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Simple Process
          </motion.span>

          <motion.h2
            className="text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            How It Works
          </motion.h2>

          <motion.p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Generating smart contracts has never been easier. Follow these
            simple steps to create custom contracts in minutes.
          </motion.p>
        </div>

        <div className="relative">
          {/* Línea conectora */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 transform -translate-y-1/2 hidden md:block"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-full">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 mx-auto md:mx-0`}
                  >
                    {step.icon}
                    <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold border-2 border-rootstock-primary">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 text-center md:text-left">
                    {step.title}
                  </h3>
                  <p className="text-gray-300 text-center md:text-left">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <a
            href="/contract-generator"
            className="inline-block px-8 py-4 bg-rootstock-primary text-white rounded-lg hover:bg-rootstock-primary/90 transition-colors"
          >
            Try Now
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;

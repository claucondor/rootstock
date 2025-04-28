
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#0c0f1d] border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link to="/" className="flex items-center mb-4">
              <div className="mr-3 text-rootstock-primary font-bold text-3xl">R</div>
              <span className="text-xl font-semibold text-white">SmartGenAI</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Generador de contratos inteligentes para Rootstock con OpenZeppelin y Uniswap V3.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-rootstock-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-rootstock-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-rootstock-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-rootstock-primary transition-colors">Inicio</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-rootstock-primary transition-colors">Características</a></li>
              <li><a href="#demo" className="text-gray-400 hover:text-rootstock-primary transition-colors">Demo API</a></li>
              <li><a href="#roadmap" className="text-gray-400 hover:text-rootstock-primary transition-colors">Roadmap</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li><a href="/docs" className="text-gray-400 hover:text-rootstock-primary transition-colors">Documentación</a></li>
              <li><a href="/api" className="text-gray-400 hover:text-rootstock-primary transition-colors">API Reference</a></li>
              <li><a href="/examples" className="text-gray-400 hover:text-rootstock-primary transition-colors">Ejemplos</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-rootstock-primary transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li><a href="/contact" className="text-gray-400 hover:text-rootstock-primary transition-colors">Contacto</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-rootstock-primary transition-colors">Sobre Nosotros</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-rootstock-primary transition-colors">Términos de Servicio</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-rootstock-primary transition-colors">Política de Privacidad</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-500">
            &copy; {currentYear} SmartGenAI. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

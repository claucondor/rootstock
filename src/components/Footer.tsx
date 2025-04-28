import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const links = {
    product: [
      { name: "Generador de Contratos", href: "/contract-generator" },
      { name: "Documentación", href: "/docs" },
      { name: "API", href: "/api" },
      { name: "Precios", href: "#" }
    ],
    resources: [
      { name: "Tutoriales", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Comunidad", href: "#" },
      { name: "Roadmap", href: "#roadmap" }
    ],
    company: [
      { name: "Acerca de", href: "#" },
      { name: "Equipo", href: "#" },
      { name: "Contacto", href: "#" },
      { name: "Términos de Servicio", href: "#" }
    ],
    social: [
      { name: "GitHub", icon: <Github className="h-5 w-5" />, href: "https://github.com" },
      { name: "Twitter", icon: <Twitter className="h-5 w-5" />, href: "https://twitter.com" },
      { name: "LinkedIn", icon: <Linkedin className="h-5 w-5" />, href: "https://linkedin.com" },
      { name: "Email", icon: <Mail className="h-5 w-5" />, href: "mailto:info@example.com" }
    ]
  };

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center mb-6">
              <div className="mr-3 text-rootstock-primary font-bold text-3xl">R</div>
              <span className="text-xl font-semibold text-white">SmartGenAI</span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              Plataforma de generación de contratos inteligentes impulsada por IA para la red Rootstock.
              Crea, personaliza y despliega contratos de manera rápida y segura.
            </p>
            <div className="flex space-x-4">
              {links.social.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Producto</h3>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Recursos</h3>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Compañía</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {currentYear} SmartGenAI. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Términos
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

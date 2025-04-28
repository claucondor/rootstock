
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0f1d]">
      <div className="text-center">
        <div className="text-7xl font-bold text-rootstock-primary mb-4">404</div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Página no encontrada</h1>
        <p className="text-gray-300 mb-8">Lo sentimos, la página que buscas no existe.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-rootstock-primary text-white rounded-lg hover:bg-rootstock-primary/80 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

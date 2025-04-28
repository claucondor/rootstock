import React, { useState, useEffect, useRef } from 'react';

function LandingPage({ onGetStarted = () => { console.log('Get Started clicked') } }) {
  // State for carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const autoplayRef = useRef(null);
  
  // Features data for carousel
  const features = [
    {
      icon: "fa-robot",
      title: "AI-Powered Generation",
      description: "Create smart contracts from natural language descriptions using advanced AI models"
    },
    {
      icon: "fa-diagram-project",
      title: "Visual Diagrams",
      description: "Understand contract architecture through interactive diagrams showing functions and relationships"
    },
    {
      icon: "fa-graduation-cap",
      title: "Educational Insights",
      description: "Learn about each function's purpose, parameters, and security considerations"
    },
    {
      icon: "fa-code",
      title: "Code Editing",
      description: "Modify generated contracts with syntax highlighting and real-time feedback"
    },
    {
      icon: "fa-rocket",
      title: "One-Click Deployment",
      description: "Deploy contracts directly to Rootstock testnet or mainnet with MetaMask integration"
    },
    {
      icon: "fa-flask",
      title: "Interactive Testing",
      description: "Test your contract functions directly in the browser before deployment"
    }
  ];
  
  // Autoplay for carousel
  useEffect(() => {
    const playCarousel = () => {
      setActiveSlide(prev => (prev + 1) % features.length);
    };
    
    autoplayRef.current = setInterval(playCarousel, 5000);
    
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [features.length]);
  
  // Handle manual navigation
  const goToSlide = (index) => {
    setActiveSlide(index);
    // Reset autoplay timer when manually navigating
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % features.length);
      }, 5000);
    }
  };
  
  return (
    <div className="landing-page">
      {/* Hero Section with Animated Background */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="animated-bg"></div>
        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <img
                src="https://developers.rsk.co/assets/img/rsk_logo.svg"
                alt="Rootstock Logo"
                className="h-20 md:h-24 animate-fade-in"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white hero-title animate-title">
              Smart Contract <span className="text-gradient">Generator</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed animate-subtitle">
              Create, visualize, and deploy smart contracts on Rootstock with AI assistance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-buttons">
              <button
                className="btn-hero-primary"
                onClick={onGetStarted}
                aria-label="Get Started"
              >
                <i className="fa-solid fa-rocket mr-2"></i>
                Get Started
              </button>
              <a
                href="https://developers.rsk.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-secondary"
                aria-label="Learn More"
              >
                <i className="fa-solid fa-book mr-2"></i>
                Learn More
              </a>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="wave-divider">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Carousel Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">Everything you need to create and understand smart contracts</p>
          </div>
          
          {/* Features Carousel */}
          <div className="features-carousel" ref={carouselRef}>
            <div className="carousel-container">
              <div
                className="carousel-track"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {features.map((feature, index) => (
                  <div key={index} className="carousel-slide">
                    <div className="feature-card-modern">
                      <div className="feature-icon-wrapper bg-gradient-to-br from-primary to-secondary">
                        <i className={`fa-solid ${feature.icon}`}></i>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Carousel Navigation */}
            <div className="carousel-nav">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                ></button>
              ))}
            </div>
            
            {/* Carousel Controls */}
            <div className="carousel-controls">
              <button
                className="carousel-control prev"
                onClick={() => goToSlide((activeSlide - 1 + features.length) % features.length)}
                aria-label="Previous slide"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                className="carousel-control next"
                onClick={() => goToSlide((activeSlide + 1) % features.length)}
                aria-label="Next slide"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
        </div>
      </section>

      {/* About Rootstock Section with Card Design */}
      <section className="py-20 bg-gradient-light">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src="https://blog.rsk.co/hubfs/blog-files/rootstock-bitcoin-smart-contracts.jpg"
                  alt="Rootstock Blockchain"
                  className="w-full h-auto transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Powered by Bitcoin</h3>
                  <p className="text-white/80">The most secure blockchain in the world</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="section-title mb-6 text-left">Why Rootstock?</h2>
              <p className="mb-6 text-lg">
                Rootstock (RSK) is a smart contract platform with a 2-way peg to Bitcoin that also rewards Bitcoin miners via merge-mining. It aims to add value and functionality to the Bitcoin ecosystem by enabling smart contracts, near instant payments, and higher scalability.
              </p>
              
              <ul className="space-y-4">
                <li className="feature-list-item">
                  <div className="feature-check-icon">
                    <i className="fa-solid fa-check text-green-600 text-sm"></i>
                  </div>
                  <span>Bitcoin compatibility and security through merge-mining</span>
                </li>
                <li className="feature-list-item">
                  <div className="feature-check-icon">
                    <i className="fa-solid fa-check text-green-600 text-sm"></i>
                  </div>
                  <span>EVM compatibility for easy migration of Ethereum dApps</span>
                </li>
                <li className="feature-list-item">
                  <div className="feature-check-icon">
                    <i className="fa-solid fa-check text-green-600 text-sm"></i>
                  </div>
                  <span>Low transaction costs and fast confirmation times</span>
                </li>
                <li className="feature-list-item">
                  <div className="feature-check-icon">
                    <i className="fa-solid fa-check text-green-600 text-sm"></i>
                  </div>
                  <span>Growing ecosystem of DeFi and other applications</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <a
                  href="https://www.rsk.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  Learn More About Rootstock
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Development Roadmap</h2>
            <p className="section-subtitle">Our journey to build the ultimate smart contract platform</p>
          </div>
          
          <div className="roadmap-modern">
            <div className="roadmap-item-modern roadmap-complete">
              <div className="roadmap-content-modern">
                <div className="roadmap-badge">Phase 1</div>
                <h3 className="text-xl font-bold mb-2">Core Functionality</h3>
                <p className="text-gray-600">AI contract generation, code editing, and basic deployment</p>
                <div className="roadmap-status">
                  <i className="fa-solid fa-check-circle mr-2"></i> Completed
                </div>
              </div>
            </div>
            
            <div className="roadmap-item-modern roadmap-active">
              <div className="roadmap-content-modern">
                <div className="roadmap-badge">Phase 2</div>
                <h3 className="text-xl font-bold mb-2">Educational Features</h3>
                <p className="text-gray-600">Function descriptions, contract visualization, and educational mode</p>
                <div className="roadmap-status">
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i> In Progress
                </div>
              </div>
            </div>
            
            <div className="roadmap-item-modern">
              <div className="roadmap-content-modern">
                <div className="roadmap-badge">Phase 3</div>
                <h3 className="text-xl font-bold mb-2">Advanced Testing</h3>
                <p className="text-gray-600">Automated security analysis, test case generation, and simulation</p>
                <div className="roadmap-status text-gray-400">
                  <i className="fa-regular fa-clock mr-2"></i> Coming Soon
                </div>
              </div>
            </div>
            
            <div className="roadmap-item-modern">
              <div className="roadmap-content-modern">
                <div className="roadmap-badge">Phase 4</div>
                <h3 className="text-xl font-bold mb-2">Community Features</h3>
                <p className="text-gray-600">Contract templates, sharing, and collaborative editing</p>
                <div className="roadmap-status text-gray-400">
                  <i className="fa-regular fa-clock mr-2"></i> Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Info Section */}
      <section className="py-20 bg-gradient-light">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Technical Information</h2>
            <p className="section-subtitle">Current versions and limitations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="tech-card">
              <h3 className="text-xl font-bold mb-4">Current Version</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="font-medium">Application</span>
                  <span className="tech-badge">v1.2.0</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="font-medium">Solidity Compiler</span>
                  <span className="tech-badge">0.8.17</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="font-medium">OpenZeppelin</span>
                  <span className="tech-badge">4.8.0</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="font-medium">AI Model</span>
                  <span className="tech-badge">DeepSeek Chat v3</span>
                </div>
              </div>
            </div>
            
            <div className="tech-card">
              <h3 className="text-xl font-bold mb-4">Limitations</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fa-solid fa-circle-info text-primary mt-1 mr-3"></i>
                  <span>Currently supports Solidity version 0.8.x</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-circle-info text-primary mt-1 mr-3"></i>
                  <span>Maximum contract size limited to 24KB (EVM limit)</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-circle-info text-primary mt-1 mr-3"></i>
                  <span>Testnet deployments only support RSK Testnet</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-circle-info text-primary mt-1 mr-3"></i>
                  <span>Complex custom libraries may require manual implementation</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-circle-info text-primary mt-1 mr-3"></i>
                  <span>Diagram visualization is simplified (full ReactFlow integration coming soon)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Floating Elements */}
      <section className="py-20 bg-gradient-cta text-white relative overflow-hidden">
        <div className="floating-elements">
          <div className="floating-element" style={{ top: '10%', left: '5%' }}>
            <i className="fa-solid fa-code text-white/20 text-4xl"></i>
          </div>
          <div className="floating-element" style={{ top: '60%', left: '15%' }}>
            <i className="fa-solid fa-robot text-white/20 text-5xl"></i>
          </div>
          <div className="floating-element" style={{ top: '20%', right: '10%' }}>
            <i className="fa-solid fa-diagram-project text-white/20 text-4xl"></i>
          </div>
          <div className="floating-element" style={{ top: '70%', right: '5%' }}>
            <i className="fa-solid fa-rocket text-white/20 text-5xl"></i>
          </div>
        </div>
        
        <div className="container text-center relative z-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-pulse-slow">Ready to Build on Rootstock?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Start creating smart contracts with AI assistance and deploy them to the Rootstock blockchain
          </p>
          <button
            className="btn-cta pulse-animation"
            onClick={onGetStarted}
            aria-label="Get Started Now"
          >
            <i className="fa-solid fa-play mr-2"></i>
            Get Started Now
          </button>
          <p className="mt-4 text-white/80">
            No registration required. Connect your wallet only when you're ready to deploy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <img 
                src="https://developers.rsk.co/assets/img/rsk_logo.svg" 
                alt="Rootstock Logo" 
                className="h-10 mb-4"
              />
              <p className="text-gray-400">
                &copy; {new Date().getFullYear()} Rootstock Smart Contract Generator
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://developers.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Developer Portal
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/rsksmart" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Community</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://twitter.com/rsksmart" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="https://t.me/rskofficialcommunity" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Telegram
                    </a>
                  </li>
                  <li>
                    <a href="https://discord.gg/rsksmart" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Discord
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h4 className="text-lg font-semibold mb-4">About</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://www.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Rootstock Website
                    </a>
                  </li>
                  <li>
                    <a href="https://www.rsk.co/blog/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="https://explorer.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                      Explorer
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
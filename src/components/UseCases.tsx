import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Image, Users, ShoppingCart, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UseCases = () => {
  const [activeTab, setActiveTab] = useState('tokens');
  
  const useCases = [
    {
      id: 'tokens',
      icon: <Coins className="h-8 w-8 text-rootstock-primary" />,
      title: "Tokens y Finanzas",
      description: "Crea tokens ERC20 personalizados, sistemas de staking, vesting y más para tus proyectos DeFi.",
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DefiToken is ERC20, ERC20Burnable, Pausable, Ownable {
    constructor() ERC20("DefiToken", "DFT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`
    },
    {
      id: 'nfts',
      icon: <Image className="h-8 w-8 text-rootstock-primary" />,
      title: "Colecciones NFT",
      description: "Genera contratos para colecciones NFT con funcionalidades como whitelist, revelado progresivo y royalties.",
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ArtCollection is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    uint256 public constant MAX_SUPPLY = 1000;
    string private _baseTokenURI;
    
    constructor() ERC721("ArtCollection", "ART") {}
    
    function safeMint(address to) public onlyOwner {
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
}`
    },
    {
      id: 'dao',
      icon: <Users className="h-8 w-8 text-rootstock-primary" />,
      title: "Gobernanza y DAOs",
      description: "Implementa sistemas de gobernanza, votación y gestión de propuestas para organizaciones descentralizadas.",
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract DAOGovernance is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    constructor(IVotes _token)
        Governor("DAOGovernance")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}

    function votingDelay() public pure override returns (uint256) {
        return 1 days;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 1 weeks;
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }
}`
    },
    {
      id: 'marketplace',
      icon: <ShoppingCart className="h-8 w-8 text-rootstock-primary" />,
      title: "Marketplaces",
      description: "Crea marketplaces descentralizados para la compra, venta e intercambio de activos digitales.",
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }
    
    mapping(uint256 => Listing) public listings;
    uint256 private _listingId = 0;
    uint256 public platformFee = 250; // 2.5%
    
    event ItemListed(uint256 listingId, address seller, address nftContract, uint256 tokenId, uint256 price);
    event ItemSold(uint256 listingId, address buyer, uint256 price);
    event ListingCancelled(uint256 listingId);
    
    function listItem(address nftContract, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be greater than zero");
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        listings[_listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        emit ItemListed(_listingId, msg.sender, nftContract, tokenId, price);
        _listingId++;
    }
    
    function buyItem(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        listing.active = false;
        
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        payable(listing.seller).transfer(sellerAmount);
        
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        emit ItemSold(listingId, msg.sender, listing.price);
    }
}`
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block px-3 py-1 bg-rootstock-primary/20 text-rootstock-primary rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Aplicaciones
          </motion.span>
          
          <motion.h2 
            className="text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Casos de Uso
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Explora los diferentes tipos de contratos inteligentes que puedes crear con nuestra plataforma.
          </motion.p>
        </div>
        
        <Tabs defaultValue="tokens" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-gray-800 p-1 rounded-lg">
            {useCases.map((useCase) => (
              <TabsTrigger 
                key={useCase.id} 
                value={useCase.id}
                className="data-[state=active]:bg-rootstock-primary data-[state=active]:text-white"
              >
                <div className="flex items-center">
                  <div className="mr-2">{useCase.icon}</div>
                  <span className="hidden md:inline">{useCase.title}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {useCases.map((useCase) => (
            <TabsContent key={useCase.id} value={useCase.id} className="mt-0">
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-800 rounded-lg p-6 border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div>
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-rootstock-primary/20 rounded-lg mr-4">
                        {useCase.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white">{useCase.title}</h3>
                    </div>
                    <p className="text-gray-300 text-lg mb-6">{useCase.description}</p>
                    
                    <a 
                      href="/contract-generator" 
                      className="inline-flex items-center text-rootstock-primary hover:text-rootstock-primary/80 transition-colors"
                    >
                      Crear este tipo de contrato
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-3">Características principales:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mr-2 mt-0.5">✓</div>
                        <span>Implementación de estándares de la industria</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mr-2 mt-0.5">✓</div>
                        <span>Funciones personalizables según tus necesidades</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mr-2 mt-0.5">✓</div>
                        <span>Optimización de gas y seguridad verificada</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="ml-4 text-xs text-gray-400">ejemplo-contrato.sol</div>
                  </div>
                  
                  <pre className="text-xs md:text-sm font-mono text-gray-300 overflow-x-auto max-h-[400px]">
                    <code>{useCase.code}</code>
                  </pre>
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default UseCases;
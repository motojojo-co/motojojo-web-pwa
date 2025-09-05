import React from 'react';

const MediaLogosSection = () => {
  const mediaBrands = [
    {
      name: "Radio and Music",
      logo: "/media-logos/radio-and-music.png",
      website: "radioandmusic.com"
    },
    {
      name: "LBB",
      logo: "/media-logos/lbb.png",
      website: "lbb.in"
    },
    {
      name: "The Times of India",
      logo: "/media-logos/times-of-india.png",
      website: "timesofindia.indiatimes.com"
    },
    {
      name: "Dainik Bhaskar",
      logo: "/media-logos/dainik-bhaskar.png",
      website: "dainikbhaskar.com"
    },
    {
      name: "Mumbai Mirror",
      logo: "/media-logos/mumbai-mirror.png",
      website: "mumbaimirror.indiatimes.com"
    },
    {
      name: "The Indian Express",
      logo: "/media-logos/indian-express.png",
      website: "indianexpress.com"
    },
    {
      name: "Rolling Stone",
      logo: "/media-logos/rolling-stone.png",
      website: "rollingstone.com"
    },
    {
      name: "The Hindu",
      logo: "/media-logos/the-hindu.png",
      website: "thehindu.com"
    }
  ];

  return (
    <section className="py-16 bg-sandstorm overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 section-title-jolly drop-shadow-lg">
            Featured In
          </h2>
          <p className="text-xl md:text-2xl text-gray-800 max-w-2xl mx-auto font-medium drop-shadow-md">
            Trusted by leading media outlets and publications across India
          </p>
        </div>
        
        {/* Scrolling Animation Container */}
        <div className="relative">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-sandstorm to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-sandstorm to-transparent z-10"></div>
          
          {/* Scrolling logos */}
          <div className="flex animate-scroll space-x-6 md:space-x-12 items-center">
            {/* First set of logos */}
            {mediaBrands.map((brand, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0 flex items-center justify-center"
              >
                <div className="bg-white rounded-lg p-4 md:p-6 min-w-[160px] md:min-w-[200px] h-24 md:h-32 flex items-center justify-center border border-gray-300">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-16 md:max-h-24 max-w-full object-contain"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.alt = brand.name;
                    }}
                  />
                </div>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {mediaBrands.map((brand, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0 flex items-center justify-center"
              >
                <div className="bg-white rounded-lg p-4 md:p-6 min-w-[160px] md:min-w-[200px] h-24 md:h-32 flex items-center justify-center border border-gray-300">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-16 md:max-h-24 max-w-full object-contain"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.alt = brand.name;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default MediaLogosSection;

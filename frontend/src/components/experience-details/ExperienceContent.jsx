import { MapPin, Clock } from 'lucide-react';
import FormattedImportantInfo from '../FormattedImportantInfo';
import MapboxMap from '../MapboxMap';

const ExperienceContent = ({
  displayData,
  itinerariesData,
  highlightsArray,
  isMobile = false
}) => {
  // Debug logging
  console.log('🎯 ExperienceContent - itinerariesData:', itinerariesData);
  console.log('🎯 ExperienceContent - displayData:', displayData);

  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Highlights */}
        <div>
          <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
            Highlights
          </h2>
          <ul className="space-y-2">
            {highlightsArray.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-neutrals-3 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Full Description */}
        <div>
          <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
            Full Description
          </h2>
          <p className="text-neutrals-3 text-sm leading-relaxed break-words" style={{ fontFamily: 'Poppins', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            {displayData.fullDescription || displayData.shortDescription || 'This is a sample experience page. To see real data, please go through the Create Experience flow: Basic Info → Details → Pricing → Availability → Success → View Experience.'}
          </p>
        </div>

        {/* Mobile Itinerary */}
        {itinerariesData && itinerariesData.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
              Itinerary
            </h2>
            <div className="bg-neutrals-7 rounded-lg p-4">
              <div className="space-y-4">
                {itinerariesData.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          item.stopType === 'start' ? 'bg-green-500' :
                          item.stopType === 'end' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {item.stopType === 'start' ? 'ST' :
                           item.stopType === 'end' ? 'END' : index}
                        </div>
                        {index < itinerariesData.length - 1 && (
                          <div className="w-0.5 h-16 bg-neutrals-5 mt-2 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-sm font-medium text-neutrals-2 mb-1">{item.locationName}</h4>
                        {item.stopType !== 'start' && item.stopType !== 'end' && (
                          <p className="text-xs text-neutrals-4 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{item.duration || 'Duration not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* What's Included */}
        <div>
          <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
            What's Included
          </h2>
          <div className="text-neutrals-3 text-sm space-y-2">
            {(displayData.whatIncluded || 'Food tastings, Expert guide, Cultural insights, Small group experience').split(', ').map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Meeting Point */}
        <div>
          <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
            {itinerariesData && itinerariesData.length > 0 ? 'Route Map' : 'Meeting Point'}
          </h2>
          
          {/* Map View */}
          <div className="mb-4">
            <MapboxMap
              latitude={displayData.latitude}
              longitude={displayData.longitude}
              locationName={displayData.location || 'Meeting Point'}
              itineraries={itinerariesData}
              zoom={14}
              height="250px"
              className="shadow-sm"
            />
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-primary-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-neutrals-2 font-medium mb-1 text-sm">{displayData.location || 'Meeting location will be provided after booking'}</p>
            </div>
          </div>
        </div>

        {/* Important Information */}
        {displayData.importantInfo && (
        <div>
          <h2 className="text-lg font-semibold text-neutrals-2 mb-3" style={{ fontFamily: 'Poppins' }}>
            Important Information
          </h2>
          <div className="bg-neutrals-7 rounded-lg p-4">
            <FormattedImportantInfo text={displayData.importantInfo} isMobile={true} />
          </div>
        </div>
        )}
      </div>
    );
  }

  return (
    <div className="col-span-2 space-y-8 min-w-0 overflow-hidden">
      {/* Highlights */}
      <div>
        <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
          Highlights
        </h2>
        <ul className="space-y-3">
          {highlightsArray.map((highlight, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-neutrals-3 break-words" style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {highlight}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Full Description */}
      <div>
        <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
          Full Description
        </h2>
        <p className="text-neutrals-3 leading-relaxed break-words" style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {displayData.fullDescription || displayData.shortDescription || 'This is a sample experience page. To see real data, please go through the Create Experience flow: Basic Info → Details → Pricing → Availability → Success → View Experience.'}
        </p>
      </div>

      {/* Itinerary */}
      {itinerariesData && itinerariesData.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
            Itinerary
          </h2>
          <div className="bg-neutrals-7 rounded-2xl p-6">
            <div className="space-y-6" style={{padding: '10px'}}>
              {itinerariesData.map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex items-start gap-5">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        item.stopType === 'start' ? 'bg-green-500' :
                        item.stopType === 'end' ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        {item.stopType === 'start' ? 'START' :
                         item.stopType === 'end' ? 'END' : index}
                      </div>
                      {index < itinerariesData.length - 1 && (
                        <div className="w-1 h-20 bg-neutrals-5 mt-3 rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-neutrals-4" />
                        <span className="text-lg font-semibold text-neutrals-1">
                          {item.locationName || 'Location'}
                        </span>
                      </div>

                      {item.stopType !== 'start' && item.stopType !== 'end' && (
                        <div className="flex items-center gap-3 text-sm text-neutrals-3">
                          <Clock className="w-4 h-4 text-neutrals-4" />
                          <span>{item.duration || 'Duration not specified'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* What's Included */}
      <div>
        <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
          What's included
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {displayData.whatIncluded ? (
            displayData.whatIncluded.split(',').filter(item => item.trim()).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-neutrals-3 text-sm break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{item.trim()}</span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-neutrals-3 text-sm">Food tastings</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-neutrals-3 text-sm">Expert guide</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meeting Point */}
      <div>
        <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
          {itinerariesData && itinerariesData.length > 0 ? 'Route Map' : 'Meeting Point'}
        </h2>
        
        {/* Map View */}
        <div className="mb-4">
          <MapboxMap
            latitude={displayData.latitude}
            longitude={displayData.longitude}
            locationName={displayData.location || 'Meeting Point'}
            itineraries={itinerariesData}
            zoom={14}
            height="400px"
            className="shadow-md"
          />
        </div>

        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-primary-1 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="text-neutrals-2 font-medium mb-1">{displayData.location || 'Meeting location will be provided after booking'}</p>
          </div>
        </div>
      </div>

      {/* Important Info */}
      {displayData.importantInfo && (
        <div>
          <h2 className="text-2xl font-semibold text-neutrals-2 mb-4" style={{ fontFamily: 'Poppins' }}>
            Important Information
          </h2>
          <div className="bg-neutrals-7 rounded-lg p-4">
            <FormattedImportantInfo text={displayData.importantInfo} isMobile={false} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceContent;
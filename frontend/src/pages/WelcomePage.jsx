import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import ExperienceCard from '../components/ExperienceCard'

// Images - these would normally be imported from assets
const heroImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"

// 16 realistic mock experiences
const mockExperiences = [
    {
        image: "https://images.unsplash.com/photo-1557410069-8da84c0523d9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Tokyo Street Food Tour",
        location: "Shibuya",
        originalPrice: 85,
        salePrice: 68,
        dates: "Mon, Oct 15 - Wed, Oct 17",
        rating: 4.8
    },
    {
        image: "https://images.unsplash.com/photo-1723992483876-0e6015fda324?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Bali Sunrise Volcano Hike",
        location: "Mount Batur",
        originalPrice: 120,
        salePrice: 95,
        dates: "Sat, Nov 2 - Sun, Nov 3",
        rating: 4.9
    },
    {
        image: "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Santorini Wine Tasting",
        location: "Oia Village",
        originalPrice: 150,
        salePrice: 120,
        dates: "Thu, Sep 28 - Fri, Sep 29",
        rating: 4.7
    },
    {
        image: "https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Northern Lights Photography",
        location: "Reykjavik",
        originalPrice: 200,
        salePrice: 160,
        dates: "Wed, Dec 12 - Sat, Dec 15",
        rating: 4.6
    },
    {
        image: "https://images.unsplash.com/photo-1596985825719-53fd3315e25c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Moroccan Desert Safari",
        location: "Sahara Desert",
        originalPrice: 300,
        salePrice: 240,
        dates: "Mon, Jan 20 - Thu, Jan 23",
        rating: 4.9
    },
    {
        image: "https://images.unsplash.com/photo-1605940169839-aedc047b0b06?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Amazon Rainforest Trek",
        location: "Manaus",
        originalPrice: 180,
        salePrice: 144,
        dates: "Fri, Feb 14 - Mon, Feb 17",
        rating: 4.8
    },
    {
        image: "https://images.unsplash.com/photo-1546180043-e1475c173021?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Swiss Alps Skiing",
        location: "Zermatt",
        originalPrice: 250,
        salePrice: 200,
        dates: "Sat, Mar 8 - Tue, Mar 11",
        rating: 4.7
    },
    {
        image: "https://images.unsplash.com/photo-1630362137311-ca837e790e47?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Parisian Cooking Class",
        location: "Montmartre",
        originalPrice: 90,
        salePrice: 72,
        dates: "Sun, Apr 6 - Mon, Apr 7",
        rating: 4.5
    },
    {
        image: "https://images.unsplash.com/photo-1594902294032-b00d798485e8?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Machu Picchu Expedition",
        location: "Cusco",
        originalPrice: 350,
        salePrice: 280,
        dates: "Wed, May 15 - Sun, May 19",
        rating: 4.9
    },
    {
        image: "https://images.unsplash.com/photo-1619382590986-e2ac189b0658?q=80&w=713&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Maldives Snorkeling",
        location: "Malé Atoll",
        originalPrice: 220,
        salePrice: 176,
        dates: "Fri, Jun 21 - Mon, Jun 24",
        rating: 4.8
    },
    {
        image: "https://images.unsplash.com/photo-1633954935960-60dbe143edbd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Thai Temple Discovery",
        location: "Chiang Mai",
        originalPrice: 75,
        salePrice: 60,
        dates: "Tue, Jul 9 - Thu, Jul 11",
        rating: 4.6
    },
    {
        image: "https://plus.unsplash.com/premium_photo-1693579944297-c503697f4f73?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "NYC Street Art Tour",
        location: "Brooklyn",
        originalPrice: 65,
        salePrice: 52,
        dates: "Sat, Aug 17 - Sun, Aug 18",
        rating: 4.4
    },
    {
        image: "https://images.unsplash.com/photo-1707477553761-693ad22457c5?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Australian Outback Safari",
        location: "Uluru",
        originalPrice: 400,
        salePrice: 320,
        dates: "Mon, Sep 2 - Fri, Sep 6",
        rating: 4.7
    },
    {
        image: "https://plus.unsplash.com/premium_photo-1697729600773-5b039ef17f3b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Kerala Backwater Cruise",
        location: "Alleppey",
        originalPrice: 130,
        salePrice: 104,
        dates: "Wed, Oct 23 - Sat, Oct 26",
        rating: 4.8
    },
    {
        image: "https://images.unsplash.com/photo-1641391282758-7eae20bcb631?q=80&w=2010&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Scottish Highlands Tour",
        location: "Isle of Skye",
        originalPrice: 180,
        salePrice: 144,
        dates: "Fri, Nov 15 - Mon, Nov 18",
        rating: 4.6
    },
    {
        image: "https://images.unsplash.com/photo-1702036394924-9c079b10c4e4?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Egyptian Pyramid Exploration",
        location: "Giza",
        originalPrice: 280,
        salePrice: 224,
        dates: "Sun, Dec 8 - Wed, Dec 11",
        rating: 4.9
    }
]

// Wrapper component for ExperienceCard that overrides click behavior
const WelcomeExperienceCard = ({ experience, onClick }) => {
    return (
        <div onClick={onClick} className="cursor-pointer">
            <ExperienceCard 
                experience={experience}
                showWishlistButton={false} // Hide wishlist for non-authenticated users
                variant="welcome"
            />
        </div>
    )
}

// Transform mock data to match ExperienceCard format
const transformMockDataForCard = (mockExp) => ({
    id: mockExp.title.replace(/\s+/g, '-').toLowerCase(),
    experienceId: mockExp.title.replace(/\s+/g, '-').toLowerCase(),
    title: mockExp.title,
    location: mockExp.location,
    price: mockExp.salePrice,
    originalPrice: mockExp.originalPrice,
    duration: Math.floor(Math.random() * 4) + 2, // Random duration 2-5 hours
    category: "GUIDED_TOUR",
    participantsAllowed: Math.floor(Math.random() * 20) + 5, // Random 5-25 participants
    rating: mockExp.rating,
    imageUrl: mockExp.image,
    coverPhotoUrl: mockExp.image
})

const WelcomePage = () => {
    const navigate = useNavigate()
    const scrollContainerRef = useRef(null)

    const handleSignUp = () => {
        navigate('/signup')
    }

    const handleCardClick = () => {
        navigate('/signup')
    }


    return (
        <div className="min-h-screen bg-neutrals-8">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[597px] lg:h-[838px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>
                </div>

                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="text-center text-neutrals-8 px-8 max-w-4xl">
                        <h1 className="font-dm-sans font-bold text-[40px] lg:text-[72px] leading-[48px] lg:leading-[80px] tracking-[-0.4px] lg:tracking-[-1.44px] mb-4">
                            <span className="lg:hidden">Discover the most engaging places</span>
                            <span className="hidden lg:inline">Discover Hidden Local Gems</span>
                        </h1>
                        <p className="font-poppins text-sm lg:text-base mb-8 lg:mb-12">
                            <span className="lg:hidden">Less planning 45,000 trips are ready for you</span>
                            <span className="hidden lg:inline">No more boring holidays. No more tourist traps.</span>
                        </p>
                        <Button
                            onClick={handleSignUp}
                            variant="primary"
                            size="lg"
                        >
                            Start Now
                        </Button>
                    </div>
                </div>
            </section>

            {/* Discover Weekly Section */}
            <section className="py-20 px-8 lg:px-40 bg-neutrals-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-dm-sans font-bold text-[32px] lg:text-[48px] leading-[40px] lg:leading-[56px] tracking-[-0.32px] lg:tracking-[-0.96px] text-neutrals-2 mb-3">
                            Discover Weekly
                        </h2>
                        <p className="font-poppins text-base lg:text-xl text-neutrals-4">
                            <span className="lg:hidden">Find your Next Adventure</span>
                            <span className="hidden lg:inline">True Localised Experiences</span>
                        </p>
                    </div>

                    {/* Experience Cards Carousel */}
                    <div className="relative">
                        {/* Scrollable container */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto experience-carousel gap-6 pb-4"
                        >
                            {mockExperiences.map((experience, index) => (
                                <WelcomeExperienceCard
                                    key={index}
                                    experience={transformMockDataForCard(experience)}
                                    onClick={handleCardClick}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 lg:px-20 bg-neutrals-7">
                <div className="max-w-7xl mx-auto">
                    <div className="lg:flex lg:items-end lg:justify-between mb-20">
                        <div className="mb-8 lg:mb-0">
                            <p className="font-poppins font-bold text-xs text-neutrals-4 uppercase mb-4">
                                <span className="lg:hidden">Trippy</span>
                                <span className="hidden lg:inline">The Experts are You and Me</span>
                            </p>
                            <h2 className="font-dm-sans font-bold text-[32px] lg:text-[48px] leading-[40px] lg:leading-[56px] tracking-[-0.32px] lg:tracking-[-0.96px] text-neutrals-2">
                                Find your Guide.<br />Be a Guide.
                            </h2>
                        </div>
                        <Button
                            onClick={handleSignUp}
                            variant="primary"
                            size="lg"
                        >
                            Book now
                        </Button>
                    </div>

                    {/* Video/Image placeholder */}
                    <div className="relative h-[480px] lg:h-[700px] bg-primary-1 rounded-2xl overflow-hidden">
                        <img
                            src={heroImage}
                            alt="Video placeholder"
                            className="w-full h-full object-cover"
                        />
                        <button className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-neutrals-8 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-neutrals-2 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* Travel Blogs Section */}
            <section className="py-20 px-8 lg:px-40 bg-neutrals-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-20">
                        <div>
                            <h2 className="font-dm-sans font-bold text-[32px] lg:text-[48px] leading-[40px] lg:leading-[56px] tracking-[-0.32px] lg:tracking-[-0.96px] text-neutrals-2 mb-3">
                                Travel Blogs
                            </h2>
                            <p className="font-poppins text-base text-neutrals-4">
                                Collective wisdom from all over the world
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-2">
                            <button className="p-2 rounded-full">
                                <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button className="p-2 rounded-full border-2 border-neutrals-6">
                                <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Blog Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        {[
                            {
                                image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=983&q=80",
                                title: "Pack wisely before traveling",
                                excerpt: "It is almost impossible to read the news without coming across a lead story elections through fake social media accounts...",
                                date: "25 May, 2021"
                            },
                            {
                                image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                                title: "Introducing this amazing city",
                                excerpt: "It is almost impossible to read the news without coming across a lead story elections through fake social media accounts...",
                                date: "25 May, 2021"
                            },
                            {
                                image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-4.0.3&auto=format&fit=crop&w=986&q=80",
                                title: "How to travel with paper map",
                                excerpt: "It is almost impossible to read the news without coming across a lead story elections through fake social media accounts...",
                                date: "25 May, 2021"
                            }
                        ].slice(0, window.innerWidth >= 1024 ? 3 : 1).map((blog, index) => (
                            <div key={index} className="bg-white rounded-2xl overflow-hidden">
                                <div className="relative h-80 bg-neutrals-2">
                                    <img
                                        src={blog.image}
                                        alt={blog.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                    <button className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-neutrals-8 text-neutrals-2 font-dm-sans font-bold text-base px-6 py-4 rounded-[90px] hover:bg-neutrals-7 transition-colors">
                                            Read More
                                        </div>
                                    </button>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-poppins font-medium text-base text-neutrals-2 mb-2">{blog.title}</h3>
                                    <p className="font-poppins text-sm text-neutrals-4 mb-4">{blog.excerpt}</p>
                                    <div className="flex items-center gap-2 text-neutrals-4">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-poppins font-medium text-sm">{blog.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile arrows */}
                    <div className="lg:hidden flex justify-center gap-2">
                        <button className="p-2 rounded-full">
                            <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button className="p-2 rounded-full border-2 border-neutrals-6">
                            <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-neutrals-8 border-t border-neutrals-6 pt-20 pb-6 px-8 lg:px-40">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/Logo.png" alt="Logo" className="w-40 h-40 object-contain" />
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <h3 className="font-dm-sans font-bold text-base text-neutrals-2 mb-8">About</h3>
                            <ul className="space-y-4 font-poppins text-sm text-neutrals-4">
                                <li>Discover</li>
                                <li>Find Travel</li>
                                <li>Popular Destinations</li>
                                <li>Reviews</li>
                            </ul>
                        </div>

                        <div className="lg:col-span-1">
                            <h3 className="font-dm-sans font-bold text-base text-neutrals-2 mb-8">Support</h3>
                            <ul className="space-y-4 font-poppins text-sm text-neutrals-4">
                                <li>Customer Support</li>
                                <li>Privacy & Policy</li>
                                <li>Contact Channels</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-neutrals-6 pt-6">
                        <p className="font-poppins font-semibold text-xs text-neutrals-3 text-center">
                            Copyright © Trippy. All rights reserved
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default WelcomePage

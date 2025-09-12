import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

// Images - these would normally be imported from assets
const heroImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
const experienceImage1 = "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=983&q=80"
const experienceImage2 = "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
const experienceImage3 = "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-4.0.3&auto=format&fit=crop&w=986&q=80"

const WelcomePage = () => {
    const navigate = useNavigate()

    const handleSignIn = () => {
        navigate('/signin')
    }

    const handleSignUp = () => {
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
                        <Link
                            to="/signup"
                            className="inline-flex items-center justify-center bg-primary-1 text-neutrals-8 font-poppins font-medium text-base px-6 py-3 rounded-[90px] border-[6px] border-white/50 hover:bg-primary-1/90 transition-colors"
                        >
                            Start Now
                        </Link>
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
                            <span className="hidden lg:inline">Our Top Picks for You</span>
                        </p>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex gap-4">
                            <button className="bg-neutrals-2 text-neutrals-8 font-dm-sans font-bold text-sm px-4 py-1.5 rounded-full">
                                Domestic
                            </button>
                            <button className="text-neutrals-4 font-dm-sans font-bold text-sm px-4 py-1.5 rounded-full hover:bg-neutrals-7">
                                Foreign
                            </button>
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

                    {/* Experience Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                        {[experienceImage1, experienceImage2, experienceImage3, experienceImage1].slice(0, window.innerWidth >= 1024 ? 4 : 2).map((image, index) => (
                            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                                <div className="relative h-48 bg-neutrals-2">
                                    <img
                                        src={image}
                                        alt="Experience"
                                        className="w-full h-full object-cover"
                                    />
                                    <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-poppins font-medium text-base text-neutrals-1 mb-2">Venice, Rome & Milan</h3>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-poppins text-xs text-neutrals-3">Karineside</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-poppins font-bold text-xs text-neutrals-5 line-through">$699</span>
                                            <span className="font-poppins font-bold text-xs text-primary-1">$548</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-neutrals-6 pt-4 flex justify-between items-center">
                                        <span className="font-poppins text-xs text-neutrals-4">Tue, Jul 20 - Fri, Jul 23</span>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3 text-primary-2 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="font-poppins font-semibold text-xs text-neutrals-2">4.9</span>
                                        </div>
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

            {/* CTA Section */}
            <section className="py-20 px-6 lg:px-20 bg-neutrals-7">
                <div className="max-w-7xl mx-auto">
                    <div className="lg:flex lg:items-end lg:justify-between mb-20">
                        <div className="mb-8 lg:mb-0">
                            <p className="font-poppins font-bold text-xs text-neutrals-4 uppercase mb-4">
                                <span className="lg:hidden">Trippy</span>
                                <span className="hidden lg:inline">fleet travel ui kit</span>
                            </p>
                            <h2 className="font-dm-sans font-bold text-[32px] lg:text-[48px] leading-[40px] lg:leading-[56px] tracking-[-0.32px] lg:tracking-[-0.96px] text-neutrals-2">
                                Find your Guide.<br />Be a Guide.
                            </h2>
                        </div>
                        <Link
                            to="/signup"
                            className="inline-flex lg:inline-flex items-center justify-center bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-base px-6 py-4 rounded-[90px] hover:bg-primary-1/90 transition-colors"
                        >
                            Book now
                        </Link>
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
                                Collective wisdom from our users, including you and I.
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
                                image: experienceImage1,
                                title: "Pack wisely before traveling",
                                excerpt: "It is almost impossible to read the news without coming across a lead story elections through fake social media accounts...",
                                date: "25 May, 2021"
                            },
                            {
                                image: experienceImage2,
                                title: "Introducing this amazing city",
                                excerpt: "It is almost impossible to read the news without coming across a lead story elections through fake social media accounts...",
                                date: "25 May, 2021"
                            },
                            {
                                image: experienceImage3,
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
                                <div className="w-8 h-8 bg-primary-1 rounded-full flex items-center justify-center">
                                    <span className="text-neutrals-8 font-bold">T</span>
                                </div>
                                <span className="font-poppins font-semibold text-neutrals-2 text-2xl">Trippy</span>
                            </div>
                            <p className="font-poppins text-sm text-neutrals-4 hidden lg:block">
                                There are many variations of passages of available but it is the majority of suffered that a alteration in that some dummy text.
                            </p>
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

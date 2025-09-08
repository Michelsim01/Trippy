import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-neutrals-8 pt-16 px-8 w-full">
            <div className="w-full mx-auto max-w-[1200px]">
                <div className="flex flex-col lg:flex-row lg:justify-between gap-12 mb-12 w-full">
                    {/* Logo */}
                    <div className="flex flex-col gap-2.5 lg:w-64">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-1 rounded-full flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                            </div>
                            <span className="text-[24px] font-semibold text-neutrals-1">Trippy</span>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-10 lg:gap-20 lg:flex-nowrap">
                        <div className="flex flex-col gap-8 w-[140px]">
                            <h3 className="text-[16px] font-bold text-neutrals-1">About</h3>
                            <div className="flex flex-col gap-4 text-[12px] font-semibold text-neutrals-4">
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Discover</a>
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Find Travel</a>
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Popular Destinations</a>
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Reviews</a>
                            </div>
                        </div>
                        <div className="flex flex-col gap-8 w-[140px]">
                            <h3 className="text-[16px] font-bold text-neutrals-1">Support</h3>
                            <div className="flex flex-col gap-4 text-[12px] font-semibold text-neutrals-4">
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Customer Support</a>
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Privacy & Policy</a>
                                <a href="#" className="hover:text-neutrals-1 transition-colors">Contact Channels</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col items-center gap-6 pb-6">
                    <div className="h-px bg-neutrals-6 w-full" />
                    <p className="text-[12px] font-semibold text-neutrals-3 leading-[20px]">
                        Copyright © Trippy. All rights reserved
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

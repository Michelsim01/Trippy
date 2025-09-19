import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-neutrals-8 pt-16 px-8 w-full">
            <div className="w-full mx-auto max-w-[1200px]">
                <div className="flex flex-col lg:flex-row lg:justify-between gap-12 mb-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-40 h-40 flex items-center justify-center">
                            <img src="/Logo.png" alt="Logo" className="w-40 h-40 object-contain" />
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

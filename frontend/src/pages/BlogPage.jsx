import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const BlogPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-neutrals-8">
            {/* Desktop Layout */}
            <div className="hidden lg:flex">
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
                </div>

                <div className="flex-1 w-full transition-all duration-300">
                    <Navbar
                        isAuthenticated={true}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={toggleSidebar}
                    />
                    <main className="w-full p-8">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Blog</h1>
                            <p className="text-lg text-neutrals-3 mb-8">
                                Discover travel stories, tips, and inspiration from fellow travelers around the world.
                            </p>

                            {/* Blog posts placeholder */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map((post) => (
                                    <div key={post} className="bg-white rounded-lg p-6 shadow-sm">
                                        <div className="h-40 bg-neutrals-6 rounded-lg mb-4"></div>
                                        <h3 className="text-xl font-semibold text-neutrals-1 mb-2">
                                            Blog Post Title {post}
                                        </h3>
                                        <p className="text-neutrals-4 text-sm mb-4">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                                        </p>
                                        <div className="text-neutrals-5 text-xs">
                                            January {post}, 2024
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full">
                <Navbar
                    isAuthenticated={true}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                <main className="w-full p-4">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Blog</h1>
                        <p className="text-base text-neutrals-3 mb-8">
                            Discover travel stories, tips, and inspiration from fellow travelers around the world.
                        </p>

                        <div className="space-y-6">
                            {[1, 2, 3].map((post) => (
                                <div key={post} className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="h-32 bg-neutrals-6 rounded-lg mb-4"></div>
                                    <h3 className="text-lg font-semibold text-neutrals-1 mb-2">
                                        Blog Post Title {post}
                                    </h3>
                                    <p className="text-neutrals-4 text-sm mb-4">
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                                    </p>
                                    <div className="text-neutrals-5 text-xs">
                                        January {post}, 2024
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BlogPage;

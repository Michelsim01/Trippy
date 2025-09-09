import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const SettingsPage = () => {
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
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Settings</h1>
                            <p className="text-lg text-neutrals-3 mb-8">
                                Manage your account preferences and privacy settings.
                            </p>

                            <div className="space-y-6">
                                {/* Profile Settings */}
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h2 className="text-xl font-semibold text-neutrals-1 mb-4">Profile Settings</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-[#FFBC99] rounded-full overflow-hidden">
                                                <img
                                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-neutrals-1">Profile Photo</h3>
                                                <p className="text-sm text-neutrals-4">Update your profile picture</p>
                                            </div>
                                            <button className="px-4 py-2 border border-neutrals-6 rounded-lg text-sm font-medium hover:bg-neutrals-7 transition-colors">
                                                Change
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                                    defaultValue="John"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                                    defaultValue="Doe"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                                defaultValue="john.doe@example.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                Bio
                                            </label>
                                            <textarea
                                                rows="3"
                                                className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                                placeholder="Tell us about yourself..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h2 className="text-xl font-semibold text-neutrals-1 mb-4">Notifications</h2>

                                    <div className="space-y-4">
                                        {[
                                            { title: 'Email notifications', desc: 'Receive email updates about your bookings' },
                                            { title: 'Push notifications', desc: 'Get notified about new experiences and updates' },
                                            { title: 'Marketing emails', desc: 'Receive promotional content and travel tips' },
                                            { title: 'SMS notifications', desc: 'Get important updates via text message' }
                                        ].map((setting, index) => (
                                            <div key={index} className="flex items-center justify-between py-3 border-b border-neutrals-6 last:border-b-0">
                                                <div>
                                                    <h3 className="font-medium text-neutrals-1">{setting.title}</h3>
                                                    <p className="text-sm text-neutrals-4">{setting.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                                                    <div className="w-11 h-6 bg-neutrals-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-1"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h2 className="text-xl font-semibold text-neutrals-1 mb-4">Privacy</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b border-neutrals-6">
                                            <div>
                                                <h3 className="font-medium text-neutrals-1">Profile visibility</h3>
                                                <p className="text-sm text-neutrals-4">Control who can see your profile</p>
                                            </div>
                                            <select className="px-3 py-2 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1">
                                                <option>Public</option>
                                                <option>Friends only</option>
                                                <option>Private</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-b border-neutrals-6">
                                            <div>
                                                <h3 className="font-medium text-neutrals-1">Show online status</h3>
                                                <p className="text-sm text-neutrals-4">Let others see when you're online</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-neutrals-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-1"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between py-3">
                                            <div>
                                                <h3 className="font-medium text-neutrals-1">Data sharing</h3>
                                                <p className="text-sm text-neutrals-4">Share anonymized data to improve our service</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-neutrals-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-1"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Actions */}
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h2 className="text-xl font-semibold text-neutrals-1 mb-4">Account</h2>

                                    <div className="space-y-4">
                                        <button className="w-full md:w-auto px-6 py-3 border border-neutrals-6 rounded-lg font-medium hover:bg-neutrals-7 transition-colors">
                                            Change Password
                                        </button>
                                        <div className="pt-4 border-t border-neutrals-6">
                                            <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                                            <p className="text-sm text-neutrals-4 mb-4">
                                                Once you delete your account, there is no going back. Please be certain.
                                            </p>
                                            <button className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end">
                                    <button className="px-8 py-3 bg-primary-1 text-white rounded-lg font-medium hover:opacity-90 transition-colors">
                                        Save Changes
                                    </button>
                                </div>
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
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Settings</h1>

                        <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h2 className="text-lg font-semibold text-neutrals-1 mb-4">Profile</h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg"
                                        placeholder="First Name"
                                        defaultValue="John"
                                    />
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg"
                                        placeholder="Last Name"
                                        defaultValue="Doe"
                                    />
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg"
                                        placeholder="Email"
                                        defaultValue="john.doe@example.com"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h2 className="text-lg font-semibold text-neutrals-1 mb-4">Notifications</h2>
                                <div className="space-y-3">
                                    {['Email notifications', 'Push notifications', 'Marketing emails'].map((setting, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-neutrals-2">{setting}</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                                                <div className="w-10 h-5 bg-neutrals-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-1"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full bg-primary-1 text-white px-6 py-3 rounded-lg font-medium">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;

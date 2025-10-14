import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { kycService } from "../services/kycService";

export default function GuideOnboardingPage() {
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    const navigate = useNavigate();
    const { user: authUser, isAuthenticated } = useAuth();

    // Check KYC status to prevent resubmission
    useEffect(() => {
        const checkKycStatus = async () => {
            if (!authUser?.id) return;

            try {
                const kycDetails = await kycService.getKycStatus(authUser.id);

                // If KYC has been submitted (not NOT_STARTED), redirect to submitted page
                if (kycDetails.kycStatus !== 'NOT_STARTED') {
                    navigate('/kyc-submitted');
                }
            } catch (error) {
                console.error('Error checking KYC status:', error);
            }
        };

        if (isAuthenticated && authUser?.id) {
            checkKycStatus();
        }
    }, [isAuthenticated, authUser?.id, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col">
            <Navbar
                isAuthenticated={true}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setSidebarOpen(true)}
            />
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                variant="desktop"
                isAuthenticated={true}
            />

            <main className="flex-1 flex items-center justify-center px-4">
                <div className="bg-white shadow-xl rounded-2xl p-12 max-w-3xl w-full flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 flex flex-col justify-center items-start">
                        <h1 className="text-3xl font-extrabold mb-6 text-gray-900">
                            Ready to become a Guide?<br />
                            <span className="text-primary-1">Share your passion, earn, and connect!</span>
                        </h1>
                        <ul className="space-y-6 mb-8">
                            <li className="flex items-start gap-4">
                                <span className="flex items-center justify-center w-10 h-10 text-neutrals-8 bg-primary-1 rounded-full font-bold text-xl">1</span>
                                <div>
                                    <div className="font-semibold text-lg">Share your local expertise</div>
                                    <div className="text-gray-500 text-base">Create authentic adventures for curious travellers.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="flex items-center justify-center w-10 h-10 text-neutrals-8 bg-primary-1 rounded-full font-bold text-xl">2</span>
                                <div>
                                    <div className="font-semibold text-lg">Connect &amp; earn</div>
                                    <div className="text-gray-500 text-base">Meet new people, showcase your city, and get rewarded for your knowledge.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="flex items-center justify-center w-10 h-10 text-neutrals-8 bg-primary-1 rounded-full font-bold text-xl">3</span>
                                <div>
                                    <div className="font-semibold text-lg">Peace of mind &amp; support</div>
                                    <div className="text-gray-500 text-base">Verified guides, secure bookings, and friendly support for every experience.</div>
                                </div>
                            </li>
                        </ul>
                        <button
                            className="bg-primary-1 text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
                            onClick={() => navigate("/kyc-verification")}
                        >
                            Get started
                        </button>
                        <p className="mt-2 text-sm text-gray-400">It only takes 2 minutes!</p>
                    </div>

                    {/* Image Section */}
                    <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="relative">
                                <img 
                                    src="/public/images/pic2.jpeg" 
                                    alt="Become a local guide and share your passion" 
                                    className="max-w-sm md:max-w-md w-full rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                                />
                                {/* Decorative elements */}
                                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-primary-1 to-emerald-600 rounded-full opacity-20 animate-pulse"></div>
                                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-primary-4 rounded-full opacity-20 animate-pulse delay-75"></div>
                            </div>
                        </div>
                </div>
            </main>
        </div>
    );
}
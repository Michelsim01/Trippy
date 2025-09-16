import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function KycSubmittedPage() {
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
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
                <div className="bg-white shadow-lg rounded-xl p-10 max-w-lg w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Your application is under review</h2>
                    <p className="text-neutrals-2 mb-6">Thank you for verifying your identity! Our team will review your application and notify you once you’re approved to create experiences.</p>
                    <a href="/home" className="bg-primary-1 text-white font-bold py-3 px-8 rounded-xl text-lg shadow hover:bg-primary-1/90 transition-colors">Back to Home</a>
                </div>
            </main>
        </div>
    );
}
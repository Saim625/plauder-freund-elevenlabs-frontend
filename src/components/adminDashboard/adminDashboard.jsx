import { useState } from "react";
import { AdminManagement } from "./adminManagement/AdminManagement";
import { UserManagement } from "./userManagement/UserManagement";
import { PersonalityConfig } from "../personalityConfig/PersonalityConfig";

export const AdminDashboard = ({ token }) => {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", name: "User Management", icon: "👥" },
    { id: "config", name: "Personality & Voice", icon: "🎭" },
    { id: "admins", name: "Admin Management", icon: "👨🏻‍💻" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement token={token} />;
      case "config":
        return <PersonalityConfig token={token} />;
      case "admins":
        return <AdminManagement token={token} />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Admin Dashboard
              </h2>
              <p className="text-blue-100 text-sm">
                Manage users, memories, and configurations
              </p>
            </div>
            <div className="bg-blue-800/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-400/30">
              <span className="text-xs text-blue-200 block mb-0.5">
                Admin Token
              </span>
              <span className="text-sm font-mono text-white">
                {token.substring(0, 16)}
              </span>
            </div>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav
            className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm transition-all duration-200 flex-shrink-0
                  ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-white"
                      : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-white/50"
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(" ")[0]}</span>
              </button>
            ))}
          </nav>
        </div>
        {/* Content Area */}
        <div className="bg-white min-h-[60vh]">{renderContent()}</div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Admin Dashboard • Secure Access • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

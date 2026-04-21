"use client";

import { useState } from "react";
import { 
  User, 
  Bell, 
  Shield, 
  Link as LinkIcon, 
  Globe, 
  CreditCard,
  Check,
  ExternalLink
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("accounts");

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "accounts", name: "Connected Accounts", icon: LinkIcon },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "billing", name: "Billing", icon: CreditCard },
    { id: "security", name: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-12 animate-in fade-in duration-500">
      <aside className="lg:w-64 space-y-1">
        <h2 className="text-3xl font-bold font-outfit mb-8 px-2">Settings</h2>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-neutral-500 hover:text-white hover:bg-neutral-800"}`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{tab.name}</span>
          </button>
        ))}
      </aside>

      <main className="flex-1 max-w-2xl">
        {activeTab === "accounts" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-xl font-bold font-outfit mb-2">Connected Accounts</h3>
              <p className="text-neutral-400 text-sm">Manage your platform connections and OAuth permissions.</p>
            </div>

            <div className="space-y-4">
              {[
                { name: "YouTube", handle: "@AlexTech", status: "Connected", color: "bg-red-500" },
                { name: "TikTok", handle: "@alex_creates", status: "Connected", color: "bg-purple-500" },
                { name: "Instagram", handle: "alex.codes", status: "Disconnected", color: "bg-pink-500" },
                { name: "X (Twitter)", handle: "@alex_dev", status: "Connected", color: "bg-neutral-100 text-black" },
              ].map(account => (
                <div key={account.name} className="card flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${account.color} flex items-center justify-center font-bold text-xs`}>
                      {account.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{account.name}</p>
                      <p className="text-xs text-neutral-500">{account.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${account.status === "Connected" ? "text-emerald-400 bg-emerald-400/10" : "text-neutral-500 bg-neutral-500/10"}`}>
                      {account.status}
                    </span>
                    <button className="p-2 text-neutral-500 hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-4 border-2 border-dashed border-neutral-800 rounded-2xl text-sm font-bold text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all flex items-center justify-center gap-2">
              <LinkIcon className="w-4 h-4" />
              <span>Connect New Platform</span>
            </button>
          </div>
        )}

        {activeTab !== "accounts" && (
          <div className="h-[400px] flex items-center justify-center border border-dashed border-neutral-800 rounded-2xl">
            <p className="text-neutral-500 text-sm">Settings for {activeTab} coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}

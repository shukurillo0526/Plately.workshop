"use client";

import { useState } from "react";
import { Store, MapPin, Users, Truck, AlertTriangle, Plus, Save, Key, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General & Info", icon: Store },
    { id: "branches", label: "Branches", icon: MapPin },
    { id: "staff", label: "Staff & RBAC", icon: Users },
    { id: "logistics", label: "Logistics & API", icon: Truck },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 text-slate-200">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Workshop Settings</h1>
        <p className="text-slate-400">Manage your restaurant details, branches, staff, and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-orange-500/10 text-[#f98b25]"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-[500px]">
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">General Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Restaurant Name</label>
                      <input type="text" defaultValue="Tashkent Palace" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f98b25]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Slug (URL)</label>
                      <input type="text" defaultValue="tashkent-palace" disabled className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Cuisine Type</label>
                      <input type="text" defaultValue="Uzbek National" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f98b25]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Contact Phone</label>
                      <input type="text" defaultValue="+998 90 123 45 67" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f98b25]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">HQ Address</label>
                    <textarea rows={2} defaultValue="Amir Timur Street, Tashkent, Uzbekistan" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f98b25]" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Operating Hours</h2>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <div key={day} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                      <span className="w-32 text-sm">{day}</span>
                      <div className="flex items-center gap-2">
                        <input type="time" defaultValue="09:00" className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#f98b25]" />
                        <span className="text-slate-500">-</span>
                        <input type="time" defaultValue="23:00" className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#f98b25]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "branches" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Branch Management</h2>
                  <p className="text-sm text-slate-400">Manage your restaurant locations and active statuses.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Branch
                </button>
              </div>

              <div className="grid gap-4">
                {[
                  { name: "Main Branch - Chorsu", status: "active", address: "Chorsu Bazaar area, Tashkent" },
                  { name: "City Branch - Amir Timur", status: "active", address: "Amir Timur Square, Tashkent" },
                  { name: "Yunusabad Express", status: "inactive", address: "Yunusabad, Mega Planet" },
                ].map((branch, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-800 rounded-lg">
                        <Store className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{branch.name}</h3>
                        <p className="text-sm text-slate-400">{branch.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${branch.status === 'active' ? 'bg-[#34d399]/10 text-[#34d399]' : 'bg-slate-800 text-slate-400'}`}>
                        {branch.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <button className="text-sm text-slate-400 hover:text-white underline underline-offset-4">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Staff & RBAC Roles</h2>
                  <p className="text-sm text-slate-400">Manage team members and their access levels.</p>
                </div>
                <button className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07b1d] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  Invite Staff
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {[
                      { name: "Alisher N.", role: "Owner", email: "alisher@example.com" },
                      { name: "Jasur K.", role: "Kitchen Manager", email: "jasur@example.com" },
                      { name: "Nodira T.", role: "Viewer", email: "nodira@example.com" },
                    ].map((staff, i) => (
                      <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{staff.name}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">
                            {staff.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{staff.email}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-white transition-colors">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-6 h-6 text-[#f98b25]" />
                  <h2 className="text-xl font-semibold text-white">Logistics & 3PL</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                      Noor 3PL API Key
                      <span className="text-xs text-[#34d399] flex items-center gap-1"><Shield className="w-3 h-3"/> Connected</span>
                    </label>
                    <div className="flex gap-2">
                      <input type="password" defaultValue="noor_live_xxxxxxxxxxxxx" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f98b25]" />
                      <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">Update</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Webhook Secret Generator</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value="whsec_8f92j3f928j3f9823jf9823j" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-400 font-mono text-sm" />
                      <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Key className="w-4 h-4" /> Generate
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950">
                    <div>
                      <h4 className="font-medium text-white">Auto-dispatch Orders</h4>
                      <p className="text-sm text-slate-400 mt-1">Automatically send delivery request to 3PL when order is marked "Ready"</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34d399]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border border-red-900/50 bg-red-950/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-500 mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Archive Restaurant</h4>
                      <p className="text-sm text-slate-400 mt-1">Temporarily hide restaurant from customer app. Data is preserved.</p>
                    </div>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Archive
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Transfer Ownership</h4>
                      <p className="text-sm text-slate-400 mt-1">Transfer this workshop portal to another user.</p>
                    </div>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Transfer
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-500/50 bg-red-500/5 rounded-lg">
                    <div>
                      <h4 className="font-medium text-red-400">Delete Workshop</h4>
                      <p className="text-sm text-red-400/70 mt-1">Permanently remove this restaurant and all associated data. This action cannot be undone.</p>
                    </div>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

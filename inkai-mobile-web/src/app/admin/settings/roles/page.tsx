'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Check, Save, Lock, Info, ChevronRight, UserCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('permissions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.roles.getAll(),
        api.roles.getPermissions()
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      if (rolesRes.data.length > 0) {
        setSelectedRole(rolesRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    if (!selectedRole) return;

    const currentPerms = selectedRole.permissions.map((p: any) => p.permission.id);
    let newPermIds;

    if (currentPerms.includes(permId)) {
      newPermIds = currentPerms.filter((id: string) => id !== permId);
    } else {
      newPermIds = [...currentPerms, permId];
    }

    // Optimistically update UI
    const updatedRole = {
      ...selectedRole,
      permissions: newPermIds.map((id: string) => ({
        permission: permissions.find(p => p.id === id)
      }))
    };
    
    setSelectedRole(updatedRole);
    setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permissionIds = selectedRole.permissions.map((p: any) => p.permission.id);
      await api.roles.updatePermissions(selectedRole.id, { permissionIds });
      // Show success toast or similar
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-amber-500" size={32} />
            Manajemen Role & Hak Akses
          </h1>
          <p className="text-gray-500 mt-2">Atur menu dan fitur yang bisa diakses oleh setiap level pengurus.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selectedRole}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          {saving ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" /> : <Save size={20} />}
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Roles List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-2">Daftar Role</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                  selectedRole?.id === role.id 
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/5' 
                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedRole?.id === role.id ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                    <UserCircle size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">{role.name}</div>
                    <div className="text-xs opacity-60">{role._count?.users || 0} Pengguna</div>
                  </div>
                </div>
                {selectedRole?.id === role.id && <ChevronRight size={18} className="text-amber-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="lg:col-span-8">
          <div className="glass-card border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[32px] overflow-hidden min-h-[500px]">
            {/* Panel Tabs */}
            <div className="flex border-b border-white/5">
              <button 
                className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'permissions' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                onClick={() => setActiveTab('permissions')}
              >
                Hak Akses Menu
                {activeTab === 'permissions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
              </button>
              <button 
                className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'info' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                onClick={() => setActiveTab('info')}
              >
                Informasi Role
                {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'permissions' ? (
                <div className="space-y-6">
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-3 text-amber-500/80 text-sm">
                    <Info size={20} className="shrink-0" />
                    <p>Centang menu di bawah untuk mengizinkan role <strong>{selectedRole?.name}</strong> mengakses fitur tersebut di Admin Portal.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions.map((perm) => {
                      const isChecked = selectedRole?.permissions.some((rp: any) => rp.permission.id === perm.id);
                      return (
                        <div 
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`group flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-amber-500/5 border-amber-500/30 text-white' 
                              : 'bg-black-20 border-white/5 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`font-bold transition-colors ${isChecked ? 'text-amber-500' : 'group-hover:text-white'}`}>
                              {perm.name}
                            </span>
                            <span className="text-xs opacity-50 uppercase tracking-tighter mt-1">{perm.slug}</span>
                          </div>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isChecked ? 'bg-amber-500 text-black scale-110 shadow-lg shadow-amber-500/20' : 'bg-white/5 border border-white/10 group-hover:border-white/30'
                          }`}>
                            {isChecked && <Check size={16} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 max-w-lg">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Role</label>
                    <input 
                      type="text" 
                      value={selectedRole?.name}
                      readOnly
                      className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Keamanan Dasar</label>
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-3 text-red-500/80 text-sm">
                      <Lock size={20} className="shrink-0" />
                      <p>Role ini adalah role sistem bawaan. Anda tidak dapat mengubah nama atau menghapusnya untuk menjaga stabilitas sistem.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

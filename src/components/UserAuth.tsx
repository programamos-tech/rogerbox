'use client';

import { useState, useEffect } from 'react';
import { appStore } from '@/lib/store';
import { User } from '@/types';
import { UserPlus, Users, Weight, Calendar, Video, Settings } from 'lucide-react';
import StudentDashboard from './StudentDashboard';

export default function UserAuth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const state = appStore.getState();
      setUsers(state.users);
      setCurrentUser(state.currentUser);
      setIsAdminMode(state.isAdminMode);
    });

    // Initial load
    const state = appStore.getState();
    setUsers(state.users);
    setCurrentUser(state.currentUser);
    setIsAdminMode(state.isAdminMode);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !weight.trim()) return;

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    appStore.createUser(name.trim(), weightNum, 170, 'other', ['fitness']);
    setName('');
    setWeight('');
    setIsRegistering(false);
  };

  const handleSelectUser = (userId: string) => {
    appStore.selectUser(userId);
  };

  const toggleAdminMode = () => {
    appStore.toggleAdminMode();
  };

  // Si hay usuarios, seleccionar el primero automáticamente
  useEffect(() => {
    if (users.length > 0 && !currentUser) {
      handleSelectUser(users[0].id);
    }
  }, [users, currentUser]);

  if (currentUser) {
    return (
      <StudentDashboard 
        user={currentUser} 
        onBack={() => appStore.selectUser('')} 
      />
    );
  }

  // Si no hay usuarios, mostrar formulario de registro directo
  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
            <p className="text-white text-lg font-semibold">Tu plataforma de fitness personalizada</p>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-black text-white mb-6 text-center">
              CREAR CUENTA
            </h2>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-white font-bold text-sm mb-2">
                  NOMBRE COMPLETO
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white font-bold text-sm mb-2">
                  PESO (KG)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                  placeholder="70"
                  min="1"
                  step="0.1"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🚀 CREAR CUENTA
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

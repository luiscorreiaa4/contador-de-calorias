import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Flame, LogOut, Plus, Utensils, Droplets, Target } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Área Privada
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold mt-2">
            Olá, {user?.name || 'Usuário'}! 👋
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            Bem-vindo ao seu painel de controle diário de calorias.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="py-2.5 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all min-h-[44px]"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Daily Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Calories Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Metas de Calorias</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">1,450 / 2,000</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">kcal</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-orange-500 h-2 rounded-full w-[72.5%]" />
          </div>
        </div>

        {/* Water Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Água Ingerida</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Droplets className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">1.8 / 2.5</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">litros</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full w-[72%]" />
          </div>
        </div>

        {/* Goal Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Objetivo Atual</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Target className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 capitalize">
              {user?.goal ? user.goal.replace('_', ' ') : 'Perder Peso'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Déficit diário recomendado: -500 kcal</p>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Utensils className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Registrar Refeição</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adicione café da manhã, almoço, jantar ou lanches.</p>
          </div>
        </div>
        <button
          type="button"
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md text-sm flex items-center gap-2 min-h-[44px] transition-all"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nova Refeição</span>
        </button>
      </div>
    </div>
  );
};

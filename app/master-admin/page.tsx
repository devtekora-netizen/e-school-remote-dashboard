"use client";

import { useState, useEffect } from "react";

export default function MasterAdminPage() {
  const [masterKey, setMasterKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schools, setSchools] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authenticate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sync?apiKey=${masterKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.role === "MASTER_ADMIN") {
          setSchools(data.schools);
          setLogs(data.logs || []);
          setIsAuthenticated(true);
          
          // Fetch Live Heartbeat stats
          const heartRes = await fetch('/api/heartbeat');
          if (heartRes.ok) {
            setLiveSessions(await heartRes.json());
          }
        } else {
          setError("Clé Maître invalide.");
        }
      } else {
        setError("Erreur d'authentification.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh toutes les 30 secondes quand on est connecté
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(authenticate, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, masterKey]);

  const toggleSchoolStatus = async (schoolId: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus 
        ? `Voulez-vous vraiment BLOQUER l'école ${schoolId} ? Elle ne pourra plus se synchroniser.`
        : `Voulez-vous ACTIVER l'école ${schoolId} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/schools`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterKey,
          schoolId,
          isActive: !currentStatus
        })
      });

      if (res.ok) {
        authenticate();
      } else {
        alert("Erreur lors du changement de statut.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Accès Entreprise</h1>
            <p className="text-slate-400">Entrez la Clé Maître pour gérer les écoles.</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Clé Maître E-School"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
            />
            <button
              onClick={authenticate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Se connecter"}
            </button>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const criticalLogs = logs.filter(l => l.type === 'RESTORE');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Banner Alertes Critiques */}
        {criticalLogs.length > 0 && (
            <div className="mb-6 bg-red-600 p-4 rounded-xl flex items-center justify-between animate-pulse shadow-lg shadow-red-900/20">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-black text-white">ALERTE : RESTAURATION CLOUD DÉTECTÉE</p>
                        <p className="text-sm text-red-100">L'école {criticalLogs[0].schoolId} a lancé une récupération d'urgence le {new Date(criticalLogs[0].timestamp).toLocaleString()}.</p>
                    </div>
                </div>
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors">Vérifier l'École</button>
            </div>
        )}

        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Console E-School SaaS</h1>
            <p className="text-slate-400 font-medium">Monitoring & Gestion de Licence</p>
          </div>
          <div className="flex items-center gap-4">
              <button 
                onClick={async () => {
                   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                   const allowedChars = chars;
                   
                   let keyBase = "ESCHM"; // 5 chars
                   let segments = [];
                   let currentSum = 0;
                   
                   // Somme de ESCHM
                   for(let i=0; i<keyBase.length; i++) currentSum += keyBase.charCodeAt(i);

                   // Générer 2 segments de 5
                   for(let s=0; s<2; s++) {
                     let seg = "";
                     for(let i=0; i<5; i++) {
                       const c = allowedChars[Math.floor(Math.random() * allowedChars.length)];
                       seg += c;
                       currentSum += c.charCodeAt(0);
                     }
                     segments.push(seg);
                   }

                   // Générer le dernier segment (4 chars + 1 checksum char)
                   let lastSeg = "";
                   for(let i=0; i<4; i++) {
                     const c = allowedChars[Math.floor(Math.random() * allowedChars.length)];
                     lastSeg += c;
                     currentSum += c.charCodeAt(0);
                   }
                   
                   // Trouver le 5ème char pour que (currentSum + charCode) % 7 == 0
                   let checkChar = "";
                   for(let i=0; i<allowedChars.length; i++) {
                     if((currentSum + allowedChars.charCodeAt(i)) % 7 === 0) {
                       checkChar = allowedChars[i];
                       break;
                     }
                   }
                   lastSeg += checkChar;
                   
                   const finalKey = `ESCHM-${segments[0]}-${segments[1]}-${lastSeg}`;
                   
                   const res = await fetch('/api/license', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ masterKey, newKey: finalKey })
                   });
                   if (res.ok) {
                     alert(`Nouvelle clé générée avec succès :\n\n${finalKey}\n\nCopiez-là pour le client.`);
                   }
                }}
                className="bg-accent hover:opacity-90 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95"
                >
                <span>+</span> Générer une Clé
              </button>
              <div className="h-8 w-px bg-slate-800 mx-2"></div>
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="text-slate-500 hover:text-white text-sm font-bold transition-colors"
                >
                Déconnexion
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne Gauche: Liste des Ecoles */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-slate-400 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Écoles Sous Contrat ({Object.keys(schools).length})
                </h2>
                
                <div className="grid gap-4">
                {Object.entries(schools).map(([id, data]: [string, any]) => (
                    <div key={id} className={`bg-slate-900 p-6 rounded-2xl border transition-all ${data.isActive === false ? 'border-red-900/50 bg-red-950/5' : 'border-slate-800 hover:border-slate-700'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-xl font-black text-white">{id}</h2>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${data.isActive === false ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {data.isActive === false ? 'LICENCE BLOQUÉE' : 'ACTIVE'}
                                    </span>
                                    {liveSessions[id] > 0 && (
                                        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded animate-pulse">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                            <span className="text-[10px] font-bold text-blue-400">{liveSessions[id]} en ligne</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-8 text-sm">
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-600 font-black mb-1">Population</p>
                                        <p className="text-white font-bold">{data.stats?.totalStudents || 0} Élèves</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-600 font-black mb-1">Flux de Synchro</p>
                                        <p className="text-white font-bold">
                                            {new Date(data.receivedAt).toLocaleTimeString('fr-FR')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-600 font-black mb-1">Recettes Globales</p>
                                        <p className="text-emerald-400 font-bold">{data.stats?.totalRecettes?.toLocaleString() || 0} $</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleSchoolStatus(id, data.isActive !== false)}
                                className={`px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95 ${
                                    data.isActive === false 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20' 
                                        : 'bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white'
                                }`}
                            >
                                {data.isActive === false ? 'RÉACTIVER' : 'SUSPENDRE'}
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Colonne Droite: Journal d'Activité */}
            <div className="bg-slate-900/30 rounded-3xl border border-slate-800 p-6 flex flex-col h-[700px]">
                <h2 className="text-lg font-bold text-slate-400 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Journal d'Activité
                </h2>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {logs.map((log: any) => {
                        const getLogIcon = () => {
                            switch(log.type) {
                                case 'SYNC': return '🔄';
                                case 'RESTORE': return '🚑';
                                case 'LICENSE_GEN': return '🔑';
                                case 'LICENSE_ACTIVATE': return '✨';
                                case 'ADMIN_BLOCK': return '🚫';
                                case 'ADMIN_UNBLOCK': return '✅';
                                case 'LOGIN': return '👤';
                                default: return '📄';
                            }
                        };

                        const getLogColor = () => {
                            switch(log.type) {
                                case 'SYNC': return 'bg-blue-500/10 text-blue-400';
                                case 'RESTORE': return 'bg-red-500/10 text-red-400';
                                case 'LICENSE_GEN': return 'bg-purple-500/10 text-purple-400';
                                case 'LICENSE_ACTIVATE': return 'bg-emerald-500/10 text-emerald-400';
                                case 'ADMIN_BLOCK': return 'bg-red-900/20 text-red-500';
                                case 'ADMIN_UNBLOCK': return 'bg-emerald-500/20 text-emerald-500';
                                default: return 'bg-slate-800 text-slate-400';
                            }
                        };

                        const getLogTitle = () => {
                            switch(log.type) {
                                case 'SYNC': return 'Synchronisation';
                                case 'RESTORE': return 'Restauration Cloud';
                                case 'LICENSE_GEN': return 'Clé Produit Créée';
                                case 'LICENSE_ACTIVATE': return 'Licence Activée';
                                case 'ADMIN_BLOCK': return 'Licence Suspendue';
                                case 'ADMIN_UNBLOCK': return 'Licence Réactivée';
                                case 'LOGIN': return 'Connexion Web';
                                default: return log.type;
                            }
                        };

                        return (
                            <div key={log.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-3 hover:border-slate-700 transition-colors">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${getLogColor()}`}>
                                    {getLogIcon()}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className="text-xs font-bold text-white truncate">{log.schoolId}</p>
                                        <span className="text-[9px] text-slate-600 font-medium whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-300">{getLogTitle()}</p>
                                    {log.details && (
                                        <p className="text-[9px] text-slate-500 mt-1 italic">{log.details}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {logs.length === 0 && (
                        <p className="text-center text-slate-600 italic py-10 text-sm">Aucune activité enregistrée.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

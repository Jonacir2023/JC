// RDO Bridge — Sincroniza dados entre BUILDLy e Diário de Obras
(function(){
  'use strict';

  const BRIDGE_KEY = 'buildly-rdo-bridge';
  const RDO_SYNC_KEY = 'buildly-rdo-sync';

  // Chamado pelo BUILDLy ANTES de abrir diário-obras.html
  window.syncRdoToBridge = function(data) {
    try {
      localStorage.setItem(BRIDGE_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        rdos: data.rdos || [],
        people: data.people || [],
        equipment: data.equipment || [],
        lightVehicles: data.lightVehicles || [],
        activitiesCatalog: data.activitiesCatalog || [],
        work: data.work,
        profile: data.profile
      }));
      localStorage.setItem(RDO_SYNC_KEY, 'synced');
    } catch(e) {
      console.error('Bridge sync failed:', e);
    }
  };

  // Chamado pelo Diário de Obras PARA carregar dados do BUILDLy
  window.loadRdoFromBridge = function() {
    try {
      const synced = localStorage.getItem(RDO_SYNC_KEY);
      if (!synced) return null;

      const data = JSON.parse(localStorage.getItem(BRIDGE_KEY) || 'null');
      if (!data) return null;

      return {
        rdos: data.rdos,
        people: data.people,
        equipment: data.equipment,
        lightVehicles: data.lightVehicles,
        activitiesCatalog: data.activitiesCatalog,
        work: data.work,
        profile: data.profile,
        timestamp: data.timestamp
      };
    } catch(e) {
      console.error('Bridge load failed:', e);
      return null;
    }
  };

  // Chamado pelo Diário de Obras PARA retornar dados editados ao BUILDLy
  window.pushRdoBackToBuildly = function(rdos) {
    try {
      localStorage.setItem('buildly-rdo-updated', JSON.stringify({
        timestamp: new Date().toISOString(),
        rdos: rdos
      }));
    } catch(e) {
      console.error('Bridge push failed:', e);
    }
  };

  // Chamado pelo BUILDLy PARA carregar RDOs atualizados do Diário
  window.pullRdoFromBridge = function() {
    try {
      const updated = localStorage.getItem('buildly-rdo-updated');
      if (!updated) return null;

      const data = JSON.parse(updated);
      localStorage.removeItem('buildly-rdo-updated'); // Limpar após leitura
      return data.rdos;
    } catch(e) {
      console.error('Bridge pull failed:', e);
      return null;
    }
  };

  // Auto-limpar flag de sync ao sair do diário-obras
  window.addEventListener('beforeunload', function() {
    if (window.location.pathname.includes('diario-obras')) {
      localStorage.removeItem(RDO_SYNC_KEY);
    }
  });
})();

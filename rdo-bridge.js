// RDO Bridge — ponte de dados BUILDLy → Diário de Obras
//
// REGRA FUNDAMENTAL: diario-obras.html é intocável. Este arquivo só é
// carregado pelo BUILDLy (index.html) e opera exclusivamente lendo/escrevendo
// nas MESMAS chaves nativas de localStorage que o diario-obras.html já usa
// por conta própria (obra_atual, diario_obras_v4_state_*, diario_obras_v4_history_*).
// Nenhum código é injetado no diario-obras.html.
(function(){
  'use strict';

  const STATE_KEY_BASE = 'diario_obras_v4_state';
  const HISTORY_KEY_BASE = 'diario_obras_v4_history';

  function slug(nome) {
    return (nome || 'default').toString().trim().replace(/\s+/g, '_').toLowerCase() || 'default';
  }

  function stateKey(obraNome) {
    return STATE_KEY_BASE + '_' + slug(obraNome);
  }

  function historyKey(obraNome) {
    return HISTORY_KEY_BASE + '_' + slug(obraNome);
  }

  // Chamado pelo BUILDLy ANTES de abrir diario-obras.html.
  // Semeia obra/colaboradores/equipamentos/atividades na chave nativa do
  // diario-obras, apenas se aquela obra ainda não tem dados lá (nunca
  // sobrescreve o que o usuário já preencheu no diário).
  window.syncRdoToBridge = function(data) {
    try {
      const obraNome = data?.work?.name || '';
      const key = stateKey(obraNome);
      const existing = localStorage.getItem(key);

      if (!existing) {
        const state = {
          obra: {
            nome: obraNome,
            empresa: data?.work?.client || '',
            local: data?.work?.location || '',
            contrato: data?.work?.contract || '',
            logo: '',
            encerramentoNormal: '17:00',
            encerramentoSexta: '16:00',
            encerramentoSabado: '16:00'
          },
          colaboradores: {
            categorias: [{
              id: 'buildly',
              icon: '👷',
              nome: 'Equipe (BUILDLy)',
              itens: (data.people || []).map((p, i) => ({
                id: p.id || ('bp' + i),
                mat: p.registration || String(i + 1),
                nome: p.name || '',
                funcao: p.role || ''
              }))
            }]
          },
          equipamentos: (data.equipment || []).map((e, i) => ({
            id: e.id || ('be' + i),
            numero: e.code || e.id || String(i + 1),
            desc: e.name || e.description || '',
            isMotorista: false
          })),
          atividades: (data.activitiesCatalog || []).map((a, i) => ({
            id: a.id || ('ba' + i),
            desc: a.name || a.description || '',
            local: '',
            unidade: a.unit || ''
          })),
          veiculosFrota: (data.lightVehicles || []).map((v, i) => ({
            id: v.id || ('bv' + i),
            desc: v.description || v.name || '',
            placa: v.plate || ''
          })),
          seguranca: [],
          meio_ambiente: []
        };
        localStorage.setItem(key, JSON.stringify(state));
      }

      if (!localStorage.getItem(historyKey(obraNome))) {
        localStorage.setItem(historyKey(obraNome), JSON.stringify({}));
      }

      // Só troca a obra ativa — não mexe em dados de nenhuma obra.
      localStorage.setItem('obra_atual', obraNome);
    } catch(e) {
      console.error('Bridge sync failed:', e);
    }
  };

  // Chamado pelo BUILDLy PARA ler os RDOs já lançados no diário (somente
  // leitura — o diario-obras.html continua sendo o dono desses dados).
  window.pullRdoFromBridge = function(obraNome) {
    try {
      const raw = localStorage.getItem(historyKey(obraNome));
      if (!raw) return [];
      const history = JSON.parse(raw) || {};
      return Object.keys(history).map(chave => {
        const [data, apontador] = chave.split('#');
        return { chave, data, apontador: apontador || '', dia: history[chave] };
      }).sort((a, b) => (a.data < b.data ? 1 : -1));
    } catch(e) {
      console.error('Bridge pull failed:', e);
      return [];
    }
  };
})();

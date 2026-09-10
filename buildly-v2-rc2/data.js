window.BUILDLY_DATA = {
  meta:{version:'2.2.0-rc1',mode:'demo-local',updated:'2026-09-07'},
  works:[{id:'teste',code:'TESTE',name:'TESTE',city:'Cidade Teste',uf:'SC',active:true}],
  profiles:[
    {id:'owner',label:'Jonacir · Gestor Global',role:'gestor',global:true,specialties:[]},
    {id:'gestor',label:'Gestor da Obra',role:'gestor',global:false,specialties:[]},
    {id:'engenheiro',label:'Engenheiro',role:'engenheiro',global:false,specialties:[]},
    {id:'eng_med',label:'Engenheiro · Medições/Custos',role:'engenheiro',global:false,specialties:['medicoes_custos']},
    {id:'eng_plan',label:'Engenheiro · Planejamento',role:'engenheiro',global:false,specialties:['planejamento']},
    {id:'eng_full',label:'Engenheiro · Medições/Custos + Planejamento',role:'engenheiro',global:false,specialties:['medicoes_custos','planejamento']},
    {id:'tecnico',label:'Técnico',role:'tecnico',global:false,specialties:[]},
    {id:'analista',label:'Analista',role:'analista',global:false,specialties:[]},
    {id:'encarregado',label:'Encarregado',role:'encarregado',global:false,specialties:[]},
    {id:'apontador',label:'Apontador',role:'apontador',global:false,specialties:[]},
    {id:'administrativo',label:'Administrativo',role:'administrativo',global:false,specialties:[]}
  ],
  permissions:{
    gestor:{dashboard:['view'],planejamento:['view','create','edit','delete','approve'],custos:['view','create','edit','delete','approve'],contratos:['view','create','edit','delete','approve'],medicoes:['view','create','edit','delete','approve'],nfs:['view','create','edit','delete','approve'],rdo:['view','create','edit','delete'],cadastro:['view','create','edit','delete'],equipamentos:['view','create','edit','delete'],efetivo:['view','create','edit','delete'],alertas:['view','edit'],ocorrencias:['view','create','edit','delete'],tarefas:['view','create','edit','delete'],reunioes:['view','create','edit','delete'],relatorios:['view','generate'],documentos:['view','create','edit','delete','approve'],orcamento:['view','create','edit','approve'],suprimentos:['view','create','edit','delete','approve'],brain:['view'],auditoria:['view']},
    engenheiro:{dashboard:['view'],planejamento:[],custos:[],contratos:['view'],medicoes:['view','create','edit'],nfs:[],rdo:['view','create','edit','delete'],cadastro:['view','create','edit','delete'],equipamentos:['view','create','edit'],efetivo:['view','create','edit'],alertas:['view'],ocorrencias:['view','create','edit','delete'],tarefas:['view','create','edit'],reunioes:['view','create','edit'],relatorios:['view','generate'],documentos:['view','create','edit'],orcamento:['view'],suprimentos:[],brain:['view'],auditoria:[]},
    tecnico:{dashboard:['view'],planejamento:[],custos:[],contratos:[],medicoes:[],nfs:[],rdo:['view','create','edit'],cadastro:['view','create','edit'],equipamentos:['view'],efetivo:['view'],alertas:['view'],ocorrencias:['view','create','edit'],tarefas:['view','create','edit'],reunioes:[],relatorios:[],documentos:[],orcamento:[],suprimentos:[],brain:['view'],auditoria:[]},
    analista:{dashboard:['view'],planejamento:[],custos:[],contratos:[],medicoes:[],nfs:[],rdo:['view','create','edit'],cadastro:['view','create','edit'],equipamentos:['view'],efetivo:['view'],alertas:['view'],ocorrencias:['view','create','edit'],tarefas:['view','create','edit'],reunioes:[],relatorios:[],documentos:[],orcamento:[],suprimentos:[],brain:['view'],auditoria:[]},
    encarregado:{dashboard:['view'],planejamento:[],custos:[],contratos:[],medicoes:[],nfs:[],rdo:['view','create','edit'],cadastro:['view','create','edit'],equipamentos:['view'],efetivo:['view'],alertas:[],ocorrencias:[],tarefas:[],reunioes:[],relatorios:[],documentos:[],orcamento:[],suprimentos:[],brain:['view'],auditoria:[]},
    apontador:{dashboard:['view'],planejamento:[],custos:[],contratos:[],medicoes:[],nfs:[],rdo:['view','create','edit'],cadastro:['view','create','edit'],equipamentos:['view'],efetivo:['view'],alertas:[],ocorrencias:[],tarefas:[],reunioes:[],relatorios:[],documentos:[],orcamento:[],suprimentos:[],brain:['view'],auditoria:[]},
    administrativo:{dashboard:['view'],planejamento:[],custos:['view','create','edit'],contratos:['view'],medicoes:[],nfs:['view','create','edit'],rdo:['view','create','edit'],cadastro:['view','create','edit'],equipamentos:['view','create','edit'],efetivo:['view','create','edit'],alertas:['view'],ocorrencias:['view','create','edit'],tarefas:['view','create','edit'],reunioes:[],relatorios:[],documentos:[],orcamento:['view'],suprimentos:['view','create','edit'],brain:['view'],auditoria:[]}
  },
  wbs:[
    {id:'01',parent:null,code:'01',name:'Terraplenagem',progress:92,planned:94},
    {id:'01.01',parent:'01',code:'01.01',name:'Limpeza',progress:100,planned:100},
    {id:'01.02',parent:'01',code:'01.02',name:'Escavação',progress:96,planned:97},
    {id:'01.03',parent:'01',code:'01.03',name:'Aterro',progress:84,planned:88},
    {id:'02',parent:null,code:'02',name:'Drenagem',progress:58,planned:63},
    {id:'02.01',parent:'02',code:'02.01',name:'Tubulação',progress:63,planned:68},
    {id:'02.02',parent:'02',code:'02.02',name:'Caixas',progress:52,planned:56},
    {id:'02.03',parent:'02',code:'02.03',name:'Dissipadores',progress:38,planned:42},
    {id:'03',parent:null,code:'03',name:'Estruturas',progress:41,planned:45},
    {id:'03.01',parent:'03',code:'03.01',name:'Fundação',progress:55,planned:57},
    {id:'03.02',parent:'03',code:'03.02',name:'Superestrutura',progress:28,planned:33},
    {id:'04',parent:null,code:'04',name:'Instalações',progress:25,planned:33},
    {id:'05',parent:null,code:'05',name:'Acabamentos',progress:10,planned:12},
    {id:'06',parent:null,code:'06',name:'Administração Local',progress:65,planned:65}
  ],
  cbs:[
    {code:'MO',name:'Mão de obra'},
    {code:'MAT',name:'Materiais'},
    {code:'EQP',name:'Equipamentos'},
    {code:'SUB',name:'Subempreiteiros'},
    {code:'COMB',name:'Combustíveis'},
    {code:'ADM',name:'Administração local'},
    {code:'VIAG',name:'Viagens e logística'},
    {code:'UTIL',name:'Água, energia e condomínio'}
  ],
  budgetLines:[
    {id:'b1',wbs:'01',cbs:'SUB',description:'Terraplenagem',original:20000000},
    {id:'b2',wbs:'02',cbs:'SUB',description:'Drenagem',original:17000000},
    {id:'b3',wbs:'03',cbs:'SUB',description:'Estruturas',original:25000000},
    {id:'b4',wbs:'04',cbs:'SUB',description:'Instalações',original:15000000},
    {id:'b5',wbs:'05',cbs:'MAT',description:'Acabamentos',original:13000000},
    {id:'b6',wbs:'06',cbs:'ADM',description:'Administração local',original:10000000}
  ],
  budgetAdjustments:[
    {id:'ALT-001',group:'ALT-001',type:'suplementacao',wbs:'03',cbs:'SUB',description:'Revisão aprovada — estruturas',delta:5000000,status:'aprovada',date:'2026-08-20'},
    {id:'ALT-002-A',group:'ALT-002',type:'transferencia',wbs:'05',cbs:'MAT',description:'Saída · Transferência em análise',delta:-600000,status:'em_aprovacao',date:'2026-09-05'},
    {id:'ALT-002-B',group:'ALT-002',type:'transferencia',wbs:'04',cbs:'MAT',description:'Entrada · Transferência em análise',delta:600000,status:'em_aprovacao',date:'2026-09-05'}
  ],
  suppliers:[
    {id:'F001',name:'FORNECEDOR TESTE 01',cnpj:'00.000.000/0001-01',specialty:'Terraplenagem',active:true},
    {id:'F002',name:'FORNECEDOR TESTE 02',cnpj:'00.000.000/0001-02',specialty:'Drenagem',active:true},
    {id:'F003',name:'FORNECEDOR TESTE 03',cnpj:'00.000.000/0001-03',specialty:'Estruturas',active:true},
    {id:'F004',name:'FORNECEDOR TESTE 04',cnpj:'00.000.000/0001-04',specialty:'Instalações',active:true},
    {id:'F005',name:'FORNECEDOR TESTE 05',cnpj:'00.000.000/0001-05',specialty:'Logística',active:true},
    {id:'F006',name:'FORNECEDOR TESTE 06',cnpj:'00.000.000/0001-06',specialty:'Urbanização',active:true}
  ],
  contracts:[
    {id:'CT-001',number:'CT-001',name:'Terraplenagem',supplier:'FORNECEDOR TESTE 01',status:'ativo',start:'2026-06-10',end:'2026-11-30',retention:5,items:[{id:'ct1i1',wbs:'01',cbs:'SUB',description:'Execução terraplenagem',qty:1,unit:'vb',unitPrice:18000000,amount:18000000}]},
    {id:'CT-002',number:'CT-002',name:'Drenagem',supplier:'FORNECEDOR TESTE 02',status:'ativo',start:'2026-07-01',end:'2026-12-20',retention:5,items:[{id:'ct2i1',wbs:'02',cbs:'SUB',description:'Sistema de drenagem',qty:1,unit:'vb',unitPrice:12000000,amount:12000000}]},
    {id:'CT-003',number:'CT-003',name:'Estruturas',supplier:'FORNECEDOR TESTE 03',status:'ativo',start:'2026-07-15',end:'2027-02-15',retention:5,items:[{id:'ct3i1',wbs:'03',cbs:'SUB',description:'Estruturas civis',qty:1,unit:'vb',unitPrice:20000000,amount:20000000}]},
    {id:'CT-004',number:'CT-004',name:'Instalações',supplier:'FORNECEDOR TESTE 04',status:'ativo',start:'2026-08-01',end:'2027-03-10',retention:3,items:[{id:'ct4i1',wbs:'04',cbs:'SUB',description:'Instalações prediais',qty:1,unit:'vb',unitPrice:10000000,amount:10000000}]},
    {id:'CT-005',number:'CT-005',name:'Logística e apoio',supplier:'FORNECEDOR TESTE 05',status:'ativo',start:'2026-06-01',end:'2027-04-30',retention:0,items:[{id:'ct5i1',wbs:'06',cbs:'ADM',description:'Transporte, alojamento e apoio',qty:1,unit:'vb',unitPrice:12000000,amount:12000000}]},
    {id:'CT-006',number:'CT-006',name:'Paisagismo final',supplier:'FORNECEDOR TESTE 06',status:'rascunho',start:'2027-01-10',end:'2027-04-10',retention:5,items:[{id:'ct6i1',wbs:'05',cbs:'SUB',description:'Paisagismo e urbanização',qty:1,unit:'vb',unitPrice:3000000,amount:3000000}]}
  ],
  contractAmendments:[
    {id:'AD-001',contract:'CT-002',number:1,type:'prazo',description:'Prorrogação de prazo sem valor',amount:0,status:'aprovado',date:'2026-08-22'},
    {id:'AD-002',contract:'CT-003',number:1,type:'acrescimo',description:'Reforço de fundações',amount:2000000,status:'em_aprovacao',date:'2026-09-05'}
  ],
  measurements:[
    {id:'BM-01-01',number:1,contract:'CT-001',date:'2026-07-31',period:'2026-07',amount:4500000,status:'aprovada'},
    {id:'BM-01-02',number:2,contract:'CT-001',date:'2026-08-31',period:'2026-08',amount:6700000,status:'aprovada'},
    {id:'BM-02-01',number:1,contract:'CT-002',date:'2026-07-31',period:'2026-07',amount:3200000,status:'aprovada'},
    {id:'BM-02-02',number:2,contract:'CT-002',date:'2026-08-31',period:'2026-08',amount:5700000,status:'aprovada'},
    {id:'BM-03-01',number:1,contract:'CT-003',date:'2026-08-31',period:'2026-08',amount:7500000,status:'aprovada'},
    {id:'BM-04-01',number:1,contract:'CT-004',date:'2026-08-31',period:'2026-08',amount:2000000,status:'aprovada'},
    {id:'BM-05-01',number:1,contract:'CT-005',date:'2026-07-31',period:'2026-07',amount:3800000,status:'aprovada'},
    {id:'BM-05-02',number:2,contract:'CT-005',date:'2026-08-31',period:'2026-08',amount:4600000,status:'aprovada'}
  ],
  directCosts:[
    {id:'DC-001',date:'2026-08-05',wbs:'06',cbs:'COMB',category:'Combustível',description:'Diesel frota e equipamentos',amount:1200000,status:'aprovado'},
    {id:'DC-002',date:'2026-08-10',wbs:'06',cbs:'ADM',category:'Alojamentos',description:'Locações de alojamentos',amount:1100000,status:'aprovado'},
    {id:'DC-003',date:'2026-08-18',wbs:'06',cbs:'VIAG',category:'Viagens',description:'Passagens e deslocamentos',amount:600000,status:'aprovado'},
    {id:'DC-004',date:'2026-08-25',wbs:'06',cbs:'UTIL',category:'Utilidades',description:'Água, energia e condomínio',amount:1100000,status:'aprovado'}
  ],
  invoices:[
    {id:'NF-001',number:'1844',supplier:'FORNECEDOR TESTE 01',date:'2026-08-05',amount:4500000,status:'paga',source:'BM-01-01'},
    {id:'NF-002',number:'3398',supplier:'FORNECEDOR TESTE 02',date:'2026-08-07',amount:3200000,status:'paga',source:'BM-02-01'},
    {id:'NF-003',number:'721',supplier:'FORNECEDOR TESTE 03',date:'2026-09-02',amount:7500000,status:'paga',source:'BM-03-01'},
    {id:'NF-004',number:'488',supplier:'FORNECEDOR TESTE 05',date:'2026-08-08',amount:3800000,status:'paga',source:'BM-05-01'},
    {id:'NF-005',number:'1882',supplier:'FORNECEDOR TESTE 01',date:'2026-09-03',amount:6700000,status:'paga',source:'BM-01-02'},
    {id:'NF-006',number:'3431',supplier:'FORNECEDOR TESTE 02',date:'2026-09-04',amount:5700000,status:'paga',source:'BM-02-02'},
    {id:'NF-007',number:'505',supplier:'FORNECEDOR TESTE 04',date:'2026-09-04',amount:2000000,status:'aprovada',source:'BM-04-01'},
    {id:'NF-008',number:'502',supplier:'FORNECEDOR TESTE 05',date:'2026-09-05',amount:4600000,status:'conferida',source:'BM-05-02'}
  ],
  payments:[
    {id:'PG-001',invoice:'NF-001',date:'2026-08-20',amount:4500000,status:'pago'},
    {id:'PG-002',invoice:'NF-002',date:'2026-08-22',amount:3200000,status:'pago'},
    {id:'PG-003',invoice:'NF-003',date:'2026-09-05',amount:7500000,status:'pago'},
    {id:'PG-004',invoice:'NF-004',date:'2026-08-25',amount:3800000,status:'pago'},
    {id:'PG-005',invoice:'NF-005',date:'2026-09-06',amount:6700000,status:'pago'},
    {id:'PG-006',invoice:'NF-006',date:'2026-09-06',amount:5700000,status:'pago'}
  ],
  forecastExtras:[
    {id:'F-001',wbs:'05',cbs:'SUB',description:'Contratação ainda não emitida — acabamentos',amount:11800000},
    {id:'F-002',wbs:'04',cbs:'SUB',description:'Complemento instalações',amount:6000000},
    {id:'F-003',wbs:'06',cbs:'ADM',description:'Custos indiretos a incorrer',amount:9000000}
  ],
  purchaseRequests:[
    {id:'SC-001',number:'SC-001',wbs:'05',cbs:'MAT',description:'Materiais de acabamento — lote 1',qty:1,unit:'vb',estimated:2400000,status:'em_cotacao',owner:'Suprimentos',date:'2026-09-05'},
    {id:'SC-002',number:'SC-002',wbs:'04',cbs:'MAT',description:'Cabos e eletrocalhas — etapa 1',qty:1,unit:'vb',estimated:1800000,status:'em_aprovacao',owner:'Suprimentos',date:'2026-09-06'}
  ],
  purchaseQuotes:[
    {id:'COT-001',request:'SC-001',supplier:'FORNECEDOR TESTE 04',amount:2320000,leadDays:18,payment:'28 dias',selected:true},
    {id:'COT-002',request:'SC-001',supplier:'FORNECEDOR TESTE 06',amount:2450000,leadDays:14,payment:'28/56 dias',selected:false}
  ],
  purchaseOrders:[
    {id:'PC-001',number:'PC-001',request:'SC-002',supplier:'FORNECEDOR TESTE 04',wbs:'04',cbs:'MAT',description:'Cabos e eletrocalhas — etapa 1',amount:1500000,status:'em_aprovacao',date:'2026-09-06'}
  ],
  receipts:[],
  auditTrail:[
    {id:'AUD-001',date:'2026-09-07T08:00:00',module:'sistema',action:'BASE_CARREGADA',reference:'TESTE',user:'Gestor Global',detail:'Base de demonstração Feature Complete carregada.'}
  ],
  planning:[
    {id:'P01',wbs:'01.03',activity:'Aterro plataforma setor norte',start:'2026-08-20',end:'2026-09-12',planned:88,actual:84,owner:'Produção',critical:false},
    {id:'P02',wbs:'02.01',activity:'Tubulação PEAD DN 400',start:'2026-08-25',end:'2026-09-18',planned:68,actual:63,owner:'FORNECEDOR TESTE 02',critical:true},
    {id:'P03',wbs:'02.02',activity:'Caixas pluviais CP-11 a CP-20',start:'2026-08-28',end:'2026-09-21',planned:56,actual:52,owner:'FORNECEDOR TESTE 02',critical:true},
    {id:'P04',wbs:'03.01',activity:'Fundações bloco B',start:'2026-08-22',end:'2026-09-15',planned:57,actual:55,owner:'FORNECEDOR TESTE 03',critical:false},
    {id:'P05',wbs:'03.02',activity:'Pilares eixo 4-8',start:'2026-09-01',end:'2026-09-24',planned:33,actual:28,owner:'FORNECEDOR TESTE 03',critical:true},
    {id:'P06',wbs:'04',activity:'Infra elétrica área produtiva',start:'2026-09-01',end:'2026-09-30',planned:33,actual:25,owner:'FORNECEDOR TESTE 04',critical:true}
  ],
  weeklyPlan:[
    {id:'S-001',wbs:'02.01',activity:'Assentar 420 m de tubulação',owner:'FORNECEDOR TESTE 02',plannedQty:420,actualQty:310,unit:'m',status:'em_andamento'},
    {id:'S-002',wbs:'02.02',activity:'Executar 6 caixas pluviais',owner:'FORNECEDOR TESTE 02',plannedQty:6,actualQty:4,unit:'un',status:'em_andamento'},
    {id:'S-003',wbs:'03.02',activity:'Concretar 5 pilares',owner:'FORNECEDOR TESTE 03',plannedQty:5,actualQty:3,unit:'un',status:'em_andamento'},
    {id:'S-004',wbs:'01.03',activity:'Executar 4.000 m³ de aterro',owner:'Produção',plannedQty:4000,actualQty:3900,unit:'m³',status:'em_andamento'}
  ],
  fortnightPlan:[
    {id:'Q-001',wbs:'02.01',activity:'Concluir trecho DN400 setor leste',owner:'FORNECEDOR TESTE 02',due:'2026-09-18',status:'em_andamento'},
    {id:'Q-002',wbs:'03.02',activity:'Liberar eixo 4-8 para superestrutura',owner:'FORNECEDOR TESTE 03',due:'2026-09-24',status:'em_andamento'},
    {id:'Q-003',wbs:'04',activity:'Infra elétrica área produtiva — etapa 1',owner:'FORNECEDOR TESTE 04',due:'2026-09-30',status:'aberta'}
  ],
  curveS:[
    {period:'Mai/26',planned:5,actual:5},{period:'Jun/26',planned:16,actual:15},{period:'Jul/26',planned:31,actual:29},{period:'Ago/26',planned:50,actual:47},{period:'Set/26',planned:64.5,actual:61.8},{period:'Out/26',planned:76,actual:null},{period:'Nov/26',planned:85,actual:null},{period:'Dez/26',planned:92,actual:null},{period:'Jan/27',planned:97,actual:null},{period:'Fev/27',planned:100,actual:null}
  ],
  restrictions:[
    {id:'R-01',wbs:'02.01',title:'Liberação interferência rede existente',owner:'Engenharia',due:'2026-09-08',status:'aberta'},
    {id:'R-02',wbs:'02.02',title:'Aprovação detalhe CP-17',owner:'Projetos',due:'2026-09-09',status:'aberta'},
    {id:'R-03',wbs:'03.02',title:'Entrega armação pilares',owner:'Suprimentos',due:'2026-09-07',status:'critica'}
  ],
  rdos:[
    {id:'RDO-001',number:1,date:'2026-09-03',weatherMorning:'Sol',weatherAfternoon:'Sol',condition:'praticavel',workforce:84,equipment:17,notes:'Frentes de terraplenagem, drenagem e fundações.',progress:'Tubulação 72 m; aterro 1.250 m³',dss:'Movimentação de máquinas'},
    {id:'RDO-002',number:2,date:'2026-09-04',weatherMorning:'Nublado',weatherAfternoon:'Nublado',condition:'praticavel',workforce:88,equipment:18,notes:'Execução de caixas pluviais e pilares.',progress:'4 caixas; 2 pilares concretados',dss:'Trabalho em altura'},
    {id:'RDO-003',number:3,date:'2026-09-05',weatherMorning:'Sol',weatherAfternoon:'Sol',condition:'praticavel',workforce:91,equipment:19,notes:'Avanço drenagem e estrutura.',progress:'Tubulação 86 m; 3 fundações',dss:'Organização da frente'}
  ],
  documents:[
    {id:'DOC-001',code:'TESTE-CON-0001',title:'Contrato da Obra',revision:'00',discipline:'Contratual',status:'Aprovado',type:'Contrato',date:'2026-06-01'},
    {id:'DOC-002',code:'TESTE-PLA-0001',title:'Cronograma Base',revision:'02',discipline:'Planejamento',status:'Aprovado',type:'Cronograma',date:'2026-08-15'},
    {id:'DOC-003',code:'TESTE-ORC-0001',title:'Orçamento Base',revision:'01',discipline:'Custos',status:'Aprovado',type:'Orçamento',date:'2026-08-12'},
    {id:'DOC-004',code:'TESTE-CIV-DRG-00125',title:'Drenagem geral',revision:'03',discipline:'Civil',status:'AFC',type:'Projeto',date:'2026-08-28'},
    {id:'DOC-005',code:'TESTE-EST-00088',title:'Formas fundações bloco B',revision:'02',discipline:'Estrutural',status:'Aprovado com comentários',type:'Projeto',date:'2026-08-31'}
  ],
  documentRevisions:[
    {id:'REV-001',document:'DOC-004',revision:'01',status:'Submetido',date:'2026-08-05',note:'Emissão inicial'},
    {id:'REV-002',document:'DOC-004',revision:'02',status:'Comentado',date:'2026-08-17',note:'Comentários incorporados'},
    {id:'REV-003',document:'DOC-004',revision:'03',status:'AFC',date:'2026-08-28',note:'Liberado para construção'}
  ],
  tasks:[
    {id:'T-001',subject:'Liberar interferência rede existente',description:'Coordenar com engenharia de projeto para resolver interferência de rede existente na área de drenagem.',creator:'Jonacir',owner:'Engenharia',sector:'Planejamento',launchDate:'2026-09-03',due:'2026-09-08',priority:'alta',status:'em_andamento',completedAt:null,origin:'restricao'},
    {id:'T-002',subject:'Confirmar entrega armação pilares',description:'Verificar recebimento e qualidade da armação de aço para pilares do eixo 4-8.',creator:'Jonacir',owner:'Suprimentos',sector:'Suprimentos',launchDate:'2026-09-04',due:'2026-09-07',priority:'alta',status:'aberta',completedAt:null,origin:'reuniao'},
    {id:'T-003',subject:'Emitir programação semanal',description:'Consolidar programação de atividades para a semana de 10-14/09/2026.',creator:'Jonacir',owner:'Planejamento',sector:'Planejamento',launchDate:'2026-09-04',due:'2026-09-07',priority:'media',status:'aberta',completedAt:null,origin:'planejamento'},
    {id:'T-004',subject:'Atualizar cadastro de equipamentos',description:'Verificar disponibilidade e utilização de equipamentos em campo.',creator:'Jonacir',owner:'Administrativo',sector:'Administração',launchDate:'2026-09-01',due:'2026-09-12',priority:'baixa',status:'concluida',completedAt:'2026-09-09T16:30:00Z',origin:'cadastro'}
  ],
  alerts:[
    {id:'A-01',severity:'critica',title:'Atividade crítica abaixo do planejado',detail:'Infra elétrica: 25% realizado x 33% planejado.',read:false},
    {id:'A-02',severity:'atencao',title:'Contrato de drenagem com saldo reduzido',detail:'Saldo contratual aproximado R$ 3,1 mi.',read:false},
    {id:'A-03',severity:'atencao',title:'3 restrições abertas',detail:'Uma restrição vence em 07/09/2026.',read:true}
  ],
  occurrences:[
    {id:'O-001',date:'2026-09-04',type:'Operacional',severity:'media',description:'Interferência de rede existente identificada na drenagem.',action:'Replanejamento de frente e solicitação à engenharia.',owner:'Engenharia',contractId:'PES-001',daysAway:0,registeredBy:'Jonacir',createdAt:'2026-09-04T10:15:00Z',rdoId:'RDO-002'}
  ],
  meetings:[
    {id:'M-001',date:'2026-09-05',title:'Reunião semanal de produção',participants:'12',status:'realizada',decisions:'Priorizar drenagem e pilares do eixo 4-8.',nextDate:'2026-09-12'}
  ],
  meetingTopics:[
    {id:'MT-001',meeting:'M-001',order:1,title:'Drenagem',decision:'Priorizar trecho leste.',owner:'Produção'},
    {id:'MT-002',meeting:'M-001',order:2,title:'Estruturas',decision:'Antecipar armação de pilares.',owner:'Suprimentos'}
  ],
  equipment:[
    {id:'E-01',prefix:'TESTE-EXC-01',type:'Escavadeira',brand:'CAT',model:'320',plate:'',year:2022,category:'pesado',owner:'Locado',supplier:'FORNECEDOR TESTE 01',availability:91,utilization:78,status:'operando',active:true},
    {id:'E-02',prefix:'TESTE-CAM-07',type:'Caminhão basculante',brand:'SCANIA',model:'P440',plate:'TESTE-01',year:2020,category:'pesado',owner:'Locado',supplier:'FORNECEDOR TESTE 01',availability:88,utilization:82,status:'operando',active:true},
    {id:'E-03',prefix:'TESTE-GRU-01',type:'Guindaste 60 t',brand:'LIEBHERR',model:'LTM 1600-7.1',plate:'',year:2019,category:'pesado',owner:'Locado',supplier:'FORNECEDOR TESTE 03',availability:96,utilization:55,status:'operando',active:true}
  ],
  maintenance:[
    {id:'MAN-001',equipment:'E-02',date:'2026-09-10',type:'Preventiva',description:'Revisão 500 h',status:'programada'}
  ],
  functionsCatalog:[
    {id:'FN-01',name:'Engenheiro Civil',category:'lideranca',travelDays:30},
    {id:'FN-02',name:'Técnico de Segurança',category:'tecnica',travelDays:30},
    {id:'FN-03',name:'Encarregado Civil',category:'lideranca',travelDays:30},
    {id:'FN-04',name:'Pedreiro',category:'operacional',travelDays:60},
    {id:'FN-05',name:'Operador de Equipamentos',category:'operacional',travelDays:60}
  ],
  people:[
    {id:'PES-001',name:'COLABORADOR TESTE 01',cpf:'000.000.000-01',ctps:'TESTE-00001',pis:'000.00000.00-01',cnh:'00000000000',birthDate:'1990-05-15',phone:'(48)99999-0001',address:'Rua TESTE, 100, Cidade TESTE, SC',company:'EMPRESA TESTE',function:'Engenheiro Civil',type:'proprio',admission:'2026-06-01',discharge:null,status:'ativo',documents:[]},
    {id:'PES-002',name:'COLABORADOR TESTE 02',cpf:'000.000.000-02',ctps:'TESTE-00002',pis:'000.00000.00-02',cnh:'00000000002',birthDate:'1988-03-22',phone:'(48)99999-0002',address:'Rua TESTE, 101, Cidade TESTE, SC',company:'EMPRESA TESTE',function:'Técnico de Segurança',type:'proprio',admission:'2026-06-05',discharge:null,status:'ativo',documents:[]},
    {id:'PES-003',name:'COLABORADOR TESTE 03',cpf:'000.000.000-03',ctps:'TESTE-00003',pis:'000.00000.00-03',cnh:'00000000003',birthDate:'1992-08-10',phone:'(48)99999-0003',address:'Rua FORNECEDOR, 50, Cidade TESTE, SC',company:'FORNECEDOR TESTE 02',function:'Encarregado Civil',type:'terceiro',admission:'2026-07-01',discharge:null,status:'ativo',documents:[]},
    {id:'PES-004',name:'COLABORADOR TESTE 04',cpf:'000.000.000-04',ctps:'TESTE-00004',pis:'000.00000.00-04',cnh:'00000000004',birthDate:'1995-11-30',phone:'(48)99999-0004',address:'Rua FORNECEDOR, 51, Cidade TESTE, SC',company:'FORNECEDOR TESTE 02',function:'Pedreiro',type:'terceiro',admission:'2026-07-02',discharge:null,status:'ativo',documents:[]}
  ],
  workforce:[
    {company:'EMPRESA TESTE',own:34,third:0,total:34},
    {company:'FORNECEDOR TESTE 01',own:0,third:24,total:24},
    {company:'FORNECEDOR TESTE 02',own:0,third:18,total:18},
    {company:'FORNECEDOR TESTE 03',own:0,third:15,total:15}
  ],
  activitiesCatalog:[
    {id:'AT-01',description:'Escavação mecânica',unit:'m³',active:true},
    {id:'AT-02',description:'Aterro compactado',unit:'m³',active:true},
    {id:'AT-03',description:'Assentamento de tubulação',unit:'m',active:true},
    {id:'AT-04',description:'Concretagem estrutural',unit:'m³',active:true}
  ],
  epis:[
    {id:'EPI-01',name:'Capacete com jugular',ca:'TESTE-001',validityDays:365,active:true},
    {id:'EPI-02',name:'Óculos de proteção',ca:'TESTE-002',validityDays:180,active:true},
    {id:'EPI-03',name:'Luva de proteção mecânica',ca:'TESTE-003',validityDays:90,active:true}
  ],
  epiDeliveries:[
    {id:'ENT-001',person:'PES-003',epi:'EPI-01',date:'2026-07-01',qty:1,reason:'primeira_entrega',signed:true},
    {id:'ENT-002',person:'PES-003',epi:'EPI-02',date:'2026-07-01',qty:1,reason:'primeira_entrega',signed:true}
  ],
  functionHistory:[
    {id:'FH-001',person:'PES-001',function:'Engenheiro Civil',startDate:'2026-06-01',endDate:null,status:'ativo'},
    {id:'FH-002',person:'PES-002',function:'Técnico de Segurança',startDate:'2026-06-05',endDate:null,status:'ativo'},
    {id:'FH-003',person:'PES-003',function:'Encarregado Civil',startDate:'2026-07-01',endDate:null,status:'ativo'},
    {id:'FH-004',person:'PES-004',function:'Pedreiro',startDate:'2026-07-02',endDate:null,status:'ativo'}
  ],
  equipmentAllocations:[
    {id:'EA-001',equipment:'E-01',workId:'teste',dateIn:'2026-06-15',dateOut:null,status:'ativo'},
    {id:'EA-002',equipment:'E-02',workId:'teste',dateIn:'2026-06-20',dateOut:null,status:'ativo'},
    {id:'EA-003',equipment:'E-03',workId:'teste',dateIn:'2026-07-01',dateOut:null,status:'ativo'}
  ],
  epiFunctionLinks:[
    {id:'EFL-001',epi:'EPI-01',function:'Engenheiro Civil',required:true},
    {id:'EFL-002',epi:'EPI-01',function:'Encarregado Civil',required:true},
    {id:'EFL-003',epi:'EPI-01',function:'Pedreiro',required:true},
    {id:'EFL-004',epi:'EPI-02',function:'Técnico de Segurança',required:true},
    {id:'EFL-005',epi:'EPI-03',function:'Pedreiro',required:true}
  ]
};

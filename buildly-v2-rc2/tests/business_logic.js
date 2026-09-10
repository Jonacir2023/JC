const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={
  window:{},
  localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  location:{protocol:'file:',reload:()=>{}},
  navigator:{},
  console,
  Intl,
  Date,
  Math,
  JSON,
  Number,
  String,
  Set,
  Blob:function(){},
  URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../data.js','utf8'),ctx);
let app=fs.readFileSync(__dirname+'/../app.js','utf8');
const needle='init();\n})();';
if(!app.includes(needle)) throw new Error('Não foi possível instrumentar app.js');
app=app.replace(needle,"window.__test={financial,financialByWbs,poApproved,poReceivedAmount,poBalance,invoicePaidAmount,contractValue,measuredContract,actionsFor,can,state,D};\n})();");
vm.runInContext(app,ctx);
const T=ctx.window.__test,D=T.D;

// Financeiro da base demo.
let f=T.financial();
assert.equal(f.original,100000000);
assert.equal(f.current,105000000);
assert.equal(f.contractCommitments,72000000);
assert.equal(f.available,29000000);
assert.equal(f.paid,31400000);

// Transferências/reclassificações pendentes precisam estar balanceadas em grupo.
const groups={};
for(const a of D.budgetAdjustments.filter(x=>['transferencia','reclassificacao'].includes(x.type))){
  const g=a.group||a.id;(groups[g]??=[]).push(a);
}
for(const [g,rows] of Object.entries(groups)){
  assert.ok(rows.length>=2,`Grupo ${g} sem origem/destino`);
  const delta=rows.reduce((s,x)=>s+Number(x.delta||0),0);
  assert.ok(Math.abs(delta)<0.01,`Grupo ${g} não balanceado: ${delta}`);
}

// Pedido parcialmente recebido continua comprometendo e mantém saldo correto.
const testPo={id:'PO-TEST',amount:1000,status:'parcialmente_recebido'};
D.purchaseOrders.push(testPo);
D.receipts.push({id:'REC-TEST',order:'PO-TEST',amount:400,status:'recebido'});
assert.equal(T.poApproved(testPo),true);
assert.equal(T.poReceivedAmount('PO-TEST'),400);
assert.equal(T.poBalance(testPo),600);
D.receipts.push({id:'REC-TEST-CAN',order:'PO-TEST',amount:300,status:'cancelado'});
assert.equal(T.poBalance(testPo),600,'recebimento cancelado não reduz saldo');
D.purchaseOrders.pop();D.receipts.pop();D.receipts.pop();

// Pagamentos contabilizam somente status pago.
D.payments.push({id:'PG-CANCEL',invoice:'NF-007',amount:999999,status:'cancelado'});
assert.equal(T.invoicePaidAmount('NF-007'),0);
assert.equal(T.financial().paid,31400000);
D.payments.pop();

// RBAC essencial da DEMO.
function profile(id){T.state.profile=D.profiles.find(p=>p.id===id)}
profile('gestor');assert.equal(T.can('custos','approve'),true);assert.equal(T.can('suprimentos','approve'),true);
profile('administrativo');assert.equal(T.can('nfs','create'),true);assert.equal(T.can('custos','approve'),false);assert.equal(T.can('suprimentos','approve'),false);
profile('eng_med');assert.equal(T.can('nfs','view'),true);assert.equal(T.can('custos','create'),true);assert.equal(T.can('custos','approve'),false);
profile('eng_plan');assert.equal(T.can('planejamento','edit'),true);assert.equal(T.can('nfs','view'),false);
profile('tecnico');assert.equal(T.can('tarefas','edit'),true);assert.equal(T.can('documentos','view'),false);

console.log('OK business logic actual app.js');
console.log('  financial baseline');
console.log('  balanced budget transfers');
console.log('  partial procurement receipts');
console.log('  payment status filtering');
console.log('  RBAC essential profiles');

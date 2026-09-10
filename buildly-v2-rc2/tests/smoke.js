const fs=require('fs'),vm=require('vm');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../data.js','utf8'),ctx);
const D=ctx.window.BUILDLY_DATA;
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+Number(f(x)||0),0);
const approved=c=>['aprovado','ativo','encerrado'].includes(c.status);
const cv=c=>sum(c.items,i=>i.amount);
const original=sum(D.budgetLines,b=>b.original);
const adj=sum(D.budgetAdjustments.filter(a=>a.status==='aprovada'),a=>a.delta);
const current=original+adj;
const commitments=sum(D.contracts.filter(approved),cv);
const measured=sum(D.measurements.filter(m=>m.status==='aprovada'),m=>m.amount);
const direct=sum(D.directCosts.filter(c=>c.status==='aprovado'),c=>c.amount);
const assigned=Math.max(0,commitments-measured)+measured+direct;
const available=current-assigned;
const forecast=assigned+sum(D.forecastExtras,f=>f.amount);
const paid=sum(D.invoices.filter(n=>n.status==='paga'),n=>n.amount);
const expected={original:100000000,current:105000000,commitments:72000000,measured:38000000,direct:4000000,assigned:76000000,available:29000000,forecast:102800000,paid:31400000};
const actual={original,current,commitments,measured,direct,assigned,available,forecast,paid};
let ok=true;
for(const [k,v] of Object.entries(expected)){
  if(actual[k]!==v){console.error('FAIL',k,'expected',v,'got',actual[k]);ok=false}
  else console.log('OK',k,v)
}
if(!D.profiles.some(p=>p.id==='eng_med'&&p.specialties.includes('medicoes_custos'))) {console.error('FAIL specialty');ok=false}
if(!D.profiles.some(p=>p.id==='eng_plan'&&p.specialties.includes('planejamento'))) {console.error('FAIL planning specialty');ok=false}
if(D.wbs.length<10||D.contracts.length<6||D.rdos.length<3){console.error('FAIL demo dataset');ok=false}

// Teste conceitual de rateio de uma medição de contrato multi-EAP.
const fake={items:[{wbs:'A',amount:60},{wbs:'B',amount:40}]};
const m={amount:50};
const rate=(ids)=>m.amount*(sum(fake.items.filter(i=>ids.includes(i.wbs)),i=>i.amount)/sum(fake.items,i=>i.amount));
if(rate(['A'])!==30||rate(['B'])!==20||rate(['A','B'])!==50){console.error('FAIL measurement allocation');ok=false}
else console.log('OK multi-WBS measurement allocation 30/20');
// procurement approval simulation: a PO in approval must not consume budget yet.
const poPending=D.purchaseOrders.find(p=>p.status==='em_aprovacao');
if(!poPending){console.error('FAIL procurement pending PO');ok=false}
else {
  const afterApprovalCommitments=commitments+Number(poPending.amount||0);
  const afterApprovalAvailable=current-(assigned+Number(poPending.amount||0));
  if(afterApprovalCommitments!==73500000||afterApprovalAvailable!==27500000){
    console.error('FAIL procurement approval simulation',afterApprovalCommitments,afterApprovalAvailable);ok=false;
  } else console.log('OK procurement approval simulation 1.5M commitment');
}
if((D.purchaseRequests||[]).length<2||(D.purchaseQuotes||[]).length<2||(D.purchaseOrders||[]).length<1){
  console.error('FAIL procurement demo dataset');ok=false;
}else console.log('OK procurement demo dataset');

process.exit(ok?0:1);

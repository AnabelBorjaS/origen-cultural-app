import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Isolated tests of the REAL browser client and moderation DOM handlers.
// No real Auth users, API calls or Supabase production/staging writes.
const apiCode=fs.readFileSync(new URL('../supabase-client.js',import.meta.url),'utf8');
const appCode=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const malicious='<img src=x onerror=alert(1)>';
let resultRows=[{
  id:'33333333-3333-4333-8333-333333333333',
  target_type:'post',target_id:'p-example',reason:malicious,
  details:malicious,status:'open',created_at:'2026-10-13T00:00:00Z',
  reporter_user_id:'PRIVATE-REPORTER-MUST-NOT-LEAK'
}];
let waiting=null;
const queries=[];
const client={
  auth:{onAuthStateChange(){}},
  from(table){
    queries.push({table});
    const q=queries.at(-1);
    return {
      select(cols){q.columns=cols;return this;},
      order(name,opts){q.order=name;q.ascending=opts.ascending;return this;},
      limit(n){
        q.limit=n;
        return waiting||Promise.resolve({data:resultRows,error:null});
      }
    };
  }
};
const browser={
  supabase:{createClient:()=>client},
  location:{href:'https://origen-cultural-staging.pages.dev/'},
  dispatchEvent(){}
};
vm.runInNewContext(apiCode,{window:browser,URL,console},{filename:'supabase-client.js'});
const api=browser.ORIGEN_API;
assert.equal(typeof api.listModerationReports,'function');

await assert.rejects(api.listModerationReports(),/administradora autorizada/i);
assert.equal(queries.length,0,'Signed-out user must not query private reports');

api.cache.session={user:{id:A}};
api.cache.profile={id:A,role:'explorer'};
await assert.rejects(api.listModerationReports(A),/administradora autorizada/i);
api.cache.profile={id:A,role:'creator'};
await assert.rejects(api.listModerationReports(A),/administradora autorizada/i);
api.cache.profile={id:A,role:'admin'};
await assert.rejects(api.listModerationReports(B),/administradora autorizada/i);
assert.equal(queries.length,0,'Neither non-admin nor mismatched session may query');

const reports=await api.listModerationReports(A);
assert.equal(reports.length,1);
assert.equal(reports[0].id,resultRows[0].id);
assert.equal(Object.hasOwn(reports[0],'reporter_user_id'),false,
  'Reporter identity is not exposed by queue results');
assert.deepEqual(Object.keys(reports[0]).sort(),
  ['id','target_type','target_id','reason','details','status','created_at'].sort());
assert.equal(queries[0].table,'moderation_reports');
assert.equal(queries[0].limit,50);
assert.equal(queries[0].order,'created_at');
assert.equal(queries[0].ascending,false);
assert.equal(queries[0].columns.includes('reporter_user_id'),false,
  'Browser should not request reporter identity');

// Account switches during in-flight report requests must discard the response.
let release;
waiting=new Promise(resolve=>{release=resolve;});
const pending=api.listModerationReports(A);
api.cache.session={user:{id:B}};
api.cache.profile={id:B,role:'admin'};
release({data:resultRows,error:null});
await assert.rejects(pending,/sesión cambió/i);
waiting=null;
assert.equal(queries.length,2);
api.cache.session={user:{id:A}};
api.cache.profile={id:A,role:'admin'};

class Node {
  constructor(tag='div'){this.tag=tag;this.children=[];this.isConnected=true;this.attrs={};this.style={};this._text='';}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  appendChild(el){this.children.push(el);return el;}
  replaceChildren(){this.children=[];this._text='';}
  setAttribute(name,value){this.attrs[name]=value;}
}
const root=new Node('div');
const document={
  getElementById(name){return name==='moderation-queue'?root:null;},
  createElement(tag){return new Node(tag);}
};
const state={lang:'es',authReady:true};
let user={id:A,role:'admin'};
let route='moderacion';
const begin=appCode.indexOf('  function moderationQueueView()');
const end=appCode.indexOf('  let _prevRoute',begin);
assert.ok(begin>0 && end>begin,'Extract real UI handlers from app.js');
const ui=vm.runInNewContext(
  '(function(){'+appCode.slice(begin,end)+'return {moderationQueueView,bindModerationQueue};})()',
  {state,me:()=>user,currentRoute:()=>route,document,window:{ORIGEN_API:api},String}
);
assert.ok(ui.moderationQueueView().includes('id="moderation-queue"'));
await ui.bindModerationQueue();
assert.equal(root.children.length,1);
assert.equal(root.children[0].tag,'article');
assert.equal(root.children[0].children[0].textContent,malicious);
assert.equal(root.children[0].children.at(-1).children.at(-1).textContent,malicious);
assert.equal(root.children[0].children.at(-1).tag,'details');
assert.equal(root.attrs['aria-busy'],'false');
assert.equal(root.textContent.includes('PRIVATE-REPORTER-MUST-NOT-LEAK'),false);
assert.equal(root.children.some(node=>node.tag==='img'),false,
  'Submitted HTML must remain inert text; no image element ever constructed');

// A non-admin route never creates the inbox and never calls report APIs.
const before=queries.length;
user={id:A,role:'explorer'};
const denied=ui.moderationQueueView();
assert.match(denied,/Acceso restringido/);
assert.ok(!denied.includes('id="moderation-queue"'));
await ui.bindModerationQueue();
assert.equal(queries.length,before);

// An older async result must not reappear after switching account or route.
user={id:A,role:'admin'};
root.replaceChildren();
waiting=new Promise(resolve=>{release=resolve;});
const reload=ui.bindModerationQueue();
for(let i=0;i<10 && queries.length===before;i++) await Promise.resolve();
user={id:B,role:'admin'};
route='inicio';
root.isConnected=false;
release({data:resultRows,error:null});
await reload;
assert.equal(root.children.length,0,'Stale moderator response cannot render into detached content');
waiting=null;

console.log('PASS Moderation inbox requires exact admin session and server RLS SELECT query.');
console.log('PASS Reporter identities omitted, malicious strings rendered as inert DOM text.');
console.log('PASS Account switch, route navigation, and denied roles never expose reports.');
console.log('PASS Synthetic/no-network tests; all decision and content-removal actions absent.');

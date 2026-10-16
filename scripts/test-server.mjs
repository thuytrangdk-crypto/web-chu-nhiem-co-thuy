import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const rows = new Map(); const backups=[]; const touched=[];
let failWrites=false;
const mock=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://local'); const table=url.pathname.split('/').pop(); touched.push(table);
 let text='';for await(const b of req)text+=b; const body=text?JSON.parse(text):null;
 res.setHeader('Content-Type','application/json');
 if(!['gvcn_private_state','gvcn_private_backups'].includes(table)){res.writeHead(500);return res.end('{}');}
 if(table==='gvcn_private_backups'){backups.push(...body);return res.end('[]');}
 const id=url.searchParams.get('id')?.replace('eq.','')||body?.id;
 if(req.method==='GET')return res.end(JSON.stringify(rows.has(id)?[rows.get(id)]:[]));
 if(failWrites){res.writeHead(500);return res.end(JSON.stringify({message:'simulated storage outage'}));}
 if(req.method==='POST'){
  if(rows.has(id)){res.writeHead(409);return res.end(JSON.stringify({code:'23505'}));}
  rows.set(id,structuredClone(body));return res.end(JSON.stringify([{id}]));
 }
 if(req.method==='PATCH'){
  const old=rows.get(id); if(!old || old.version!==Number(url.searchParams.get('version').replace('eq.','')))return res.end('[]');
  rows.set(id,structuredClone(body));return res.end(JSON.stringify([{id}]));
 }
 res.writeHead(400);res.end('{}');
});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
const env={...process.env,SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,SUPABASE_SECRET_KEY:'sb_secret_test_only',SESSION_SECRET:'test-secret-'.repeat(5),APP_DATA_SCOPE:'test-co-thuy-9a2',INITIAL_ADMIN_PASSWORD:'PrivateTeacher123!'};
const children=[];
async function worker(scope=env.APP_DATA_SCOPE){
 const child=spawn(process.execPath,['--input-type=module','-e',`import app from './api/index.js';const s=app.listen(0,'127.0.0.1',()=>console.log('PORT='+s.address().port));`],{env:{...env,APP_DATA_SCOPE:scope},stdio:['ignore','pipe','pipe']});children.push(child);
 child.stderr.on('data',()=>{});
 const port=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',b=>{out+=b;const m=out.match(/PORT=(\d+)/);if(m)resolve(m[1]);});child.once('exit',c=>reject(new Error(`worker exited ${c}`)));});
 return `http://127.0.0.1:${port}`;
}
async function call(base,path,options={}){
 const response=await fetch(base+'/api'+path,{...options,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
 const body=await response.json();return {status:response.status,body,version:response.headers.get('x-data-version')};
}
const auth=token=>({Authorization:`Bearer ${token}`});
try{
 const a=await worker(); const b=await worker();
 assert.equal((await call(a,'/health')).status,200);assert.equal(rows.size,0,'health must not seed or write');
 assert.equal((await call(a,'/auth/login',{method:'POST',body:{username:'gvcn',password:'wrong'}})).status,401);assert.equal(rows.size,0);
 let login=await call(a,'/auth/login',{method:'POST',body:{username:'gvcn',password:env.INITIAL_ADMIN_PASSWORD}});assert.equal(login.status,200);let token=login.body.token;
 assert.equal((await call(b,'/auth/me',{headers:auth(token)})).status,200,'token survives a different instance');
 let data=await call(a,'/data',{headers:auth(token)});assert.equal(data.body.students.length,0,'no demo students on bootstrap');
 const settings={...data.body.settings,schoolName:'Trường kiểm thử',className:'Lớp 9A14'};
 let labels=await call(a,'/data/update',{method:'POST',headers:{...auth(token),'If-Match':data.version},body:{settings}});assert.equal(labels.status,200);
 const publicLabels=await call(b,'/public/settings');assert.equal(publicLabels.status,200);
 assert.deepEqual(publicLabels.body,{schoolName:'Trường kiểm thử',className:'Lớp 9A14'});
 data=await call(a,'/data',{headers:auth(token)});
 const stale=data.version;
 const student={id:'TEST01',fullName:'Học sinh kiểm thử',gender:'Nữ',dob:'01/01/2012',phone:''};
 let write=await call(a,'/data/update',{method:'POST',headers:{...auth(token),'If-Match':data.version},body:{students:[student]}});assert.equal(write.status,200);
 const other=await call(b,'/data',{headers:auth(token)});assert.equal(other.body.students[0].id,'TEST01');
 assert.equal((await call(b,'/data/update',{method:'POST',headers:{...auth(token),'If-Match':stale},body:{students:[]}})).status,409);
 const slogin=await call(a,'/auth/login',{method:'POST',body:{username:'test01',password:'01012012'}});assert.equal(slogin.status,200);
 assert.equal((await call(a,'/data/update',{method:'POST',headers:{...auth(slogin.body.token),'If-Match':other.version},body:{students:[]}})).status,403);
 const studentChange=await call(a,'/auth/change-password',{method:'POST',headers:auth(slogin.body.token),body:{currentPassword:'01012012',newPassword:'StudentPassword456!'}});assert.equal(studentChange.status,200);
 assert.equal((await call(b,'/auth/login',{method:'POST',body:{username:'TEST01',password:'StudentPassword456!'}})).status,200);
 assert.equal((await call(b,'/auth/login',{method:'POST',body:{username:'test01',password:'01012012'}})).status,401);
 const change=await call(a,'/auth/change-password',{method:'POST',headers:auth(token),body:{currentPassword:env.INITIAL_ADMIN_PASSWORD,newPassword:'ChangedTeacher456!'}});assert.equal(change.status,200);const newToken=change.body.token;
 assert.equal((await call(b,'/auth/me',{headers:auth(token)})).status,401,'old session revoked after password change');
 assert.equal((await call(b,'/auth/login',{method:'POST',body:{username:'gvcn',password:'giaovien123'}})).status,401,'default bypass removed');
 assert.equal((await call(b,'/auth/login',{method:'POST',body:{username:'gvcn',password:'ChangedTeacher456!'}})).status,200);
 data=await call(a,'/data',{headers:auth(newToken)});
 assert.equal((await call(a,'/data/restore',{method:'POST',headers:{...auth(newToken),'If-Match':data.version},body:{backup:{classData:{...data.body,settings:{...data.body.settings,className:'Lớp 9A5'}}},confirmDifferentClass:true}})).status,409,'cross-class restore blocked even if confirmation supplied');
 const backup=await call(a,'/data/restore',{method:'POST',headers:{...auth(newToken),'If-Match':data.version},body:{backup:{classData:data.body}}});assert.equal(backup.status,200);assert.equal(backups.length,1);
 assert.equal((await call(b,'/auth/me',{headers:auth(newToken)})).status,200,'restore preserves teacher password');
 const c=await worker('other-app-scope');assert.equal((await call(c,'/auth/me',{headers:auth(newToken)})).status,401);assert.equal(rows.size,1,'other app cannot seed with existing token');
 data=await call(a,'/data',{headers:auth(newToken)});failWrites=true;
 assert.equal((await call(a,'/data/update',{method:'POST',headers:{...auth(newToken),'If-Match':data.version},body:{students:[]}})).status,503,'write failure must not report success');failWrites=false;
 assert.equal((await call(b,'/data',{headers:auth(newToken)})).body.students.length,1,'failed write does not replace stored state');
 assert(touched.every(t=>t.startsWith('gvcn_private_')),'legacy data must never be accessed');
 console.log('PASS: bootstrap, no startup writes, cross-instance sessions, cloud persistence, stale-write rejection, role filtering, password change, legacy bypass rejection, class isolation, durable restore backup, failed-save handling.');
}finally{for(const c of children)c.kill();mock.close();}

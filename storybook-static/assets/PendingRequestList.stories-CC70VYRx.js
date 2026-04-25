import{n as e}from"./chunk-BEldbCjX.js";import{a as t,c as n,d as r,l as i,o as a,s as o,u as s}from"./seed-C-WhBS7u.js";import{M as c,g as l,i as u,t as d}from"./iframe-DZMZqHPD.js";import{n as f,t as p}from"./RequestCard-D7rYQPqL.js";function m(){return u({queryKey:a.requests(),queryFn:async()=>(await o.getRequests()).requests,refetchInterval:15e3,staleTime:0})}var h=e((()=>{d(),n(),t()}));function g(){let{data:e,isLoading:t}=m();if(t)return(0,_.jsx)(`div`,{className:`space-y-3`,children:[0,1,2].map(e=>(0,_.jsx)(`div`,{className:`rounded-lg border border-zinc-100 bg-zinc-50 p-4 h-28 animate-pulse`},e))});let n=e?.filter(e=>e.status===`pending`)??[];return n.length===0?(0,_.jsx)(`div`,{className:`rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-8 text-center`,children:(0,_.jsx)(`p`,{className:`text-sm text-zinc-500`,children:`No pending requests`})}):(0,_.jsx)(`div`,{className:`space-y-3`,children:n.map(e=>(0,_.jsx)(p,{request:e},e.id))})}var _,v=e((()=>{_=c(),h(),f(),g.__docgenInfo={description:``,methods:[],displayName:`PendingRequestList`}})),y,b,x,S,C,w,T,E;e((()=>{i(),v(),y=new Date().toISOString(),b=[{id:`req-001`,employeeId:`emp-alice`,employeeName:`Alice Johnson`,locationId:`loc-nyc`,delta:-3,reason:`Family vacation`,submittedAt:new Date(Date.now()-5*6e4).toISOString(),status:`pending`},{id:`req-002`,employeeId:`emp-bob`,employeeName:`Bob Martinez`,locationId:`loc-lon`,delta:-5,reason:`Medical appointment`,submittedAt:new Date(Date.now()-30*6e4).toISOString(),status:`pending`}],x=[r.get(`/api/hcm/balance`,({request:e})=>{let t=new URL(e.url),n=t.searchParams.get(`employeeId`),r=t.searchParams.get(`locationId`);return l.json({employeeId:n,locationId:r,balance:n===`emp-alice`?15:10,unit:`days`,asOf:y,version:1})})],S={component:g,tags:[`autodocs`]},C={parameters:{msw:{handlers:[r.get(`/api/hcm/requests`,async()=>{await s(`infinite`)})]}}},w={parameters:{msw:{handlers:[r.get(`/api/hcm/requests`,()=>l.json({requests:[]}))]}}},T={parameters:{msw:{handlers:[r.get(`/api/hcm/requests`,()=>l.json({requests:b})),...x,r.post(`/api/hcm/requests/:id/approve`,({params:e})=>l.json({requestId:e.id,status:`approved`,balance:{employeeId:`emp-alice`,locationId:`loc-nyc`,balance:12,unit:`days`,asOf:y,version:2}})),r.post(`/api/hcm/requests/:id/deny`,({params:e})=>l.json({requestId:e.id,status:`denied`}))]}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/requests', async () => {
        await delay('infinite');
      })]
    }
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/requests', () => HttpResponse.json({
        requests: []
      }))]
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/requests', () => HttpResponse.json({
        requests: mockRequests
      })), ...balanceHandlers, http.post('/api/hcm/requests/:id/approve', ({
        params
      }) => HttpResponse.json({
        requestId: params.id,
        status: 'approved',
        balance: {
          employeeId: 'emp-alice',
          locationId: 'loc-nyc',
          balance: 12,
          unit: 'days',
          asOf: now,
          version: 2
        }
      })), http.post('/api/hcm/requests/:id/deny', ({
        params
      }) => HttpResponse.json({
        requestId: params.id,
        status: 'denied'
      }))]
    }
  }
}`,...T.parameters?.docs?.source}}},E=[`Loading`,`Empty`,`WithRequests`]}))();export{w as Empty,C as Loading,T as WithRequests,E as __namedExportsOrder,S as default};
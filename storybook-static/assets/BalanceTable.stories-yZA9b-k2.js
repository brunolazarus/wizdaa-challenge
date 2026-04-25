import{n as e,o as t}from"./chunk-BEldbCjX.js";import{d as n,i as r,l as i,n as a,r as o,t as s,u as c}from"./seed-C-WhBS7u.js";import{M as l,Z as u,g as d}from"./iframe-DZMZqHPD.js";import{n as f,t as p}from"./BalanceCell-OgJ7mZ5W.js";function m({employeeId:e,locationId:t,locationName:n}){let{data:i,isFetching:a}=r(e,t),o=(0,_.useRef)(void 0),[s,c]=(0,_.useState)(!1);return(0,_.useEffect)(()=>{if(o.current!==void 0&&i?.version!==o.current){c(!0);let e=setTimeout(()=>c(!1),3e3);return()=>clearTimeout(e)}o.current=i?.version},[i?.version]),(0,g.jsxs)(`tr`,{className:`border-b border-zinc-100 last:border-0`,children:[(0,g.jsx)(`td`,{className:`py-3 pr-8 text-sm font-medium text-zinc-600`,children:n}),(0,g.jsx)(`td`,{className:`py-3`,children:(0,g.jsx)(p,{balance:i,isFetching:a,justUpdated:s})})]})}function h({employeeId:e}){return(0,g.jsxs)(`table`,{className:`w-full`,children:[(0,g.jsx)(`thead`,{children:(0,g.jsxs)(`tr`,{className:`border-b border-zinc-200`,children:[(0,g.jsx)(`th`,{className:`pb-2 pr-8 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400`,children:`Location`}),(0,g.jsx)(`th`,{className:`pb-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400`,children:`Balance`})]})}),(0,g.jsx)(`tbody`,{children:s.map(t=>(0,g.jsx)(m,{employeeId:e,locationId:t.id,locationName:t.name},t.id))})]})}var g,_,v=e((()=>{g=l(),_=t(u()),o(),f(),a(),h.__docgenInfo={description:``,methods:[],displayName:`BalanceTable`,props:{employeeId:{required:!0,tsType:{name:`string`},description:``}}}})),y,b,x,S,C,w,T,E,D,O,k,A;e((()=>{i(),v(),y=new Date().toISOString(),b=new Date(Date.now()-9e4).toISOString(),x={employeeId:`emp-alice`,locationId:`loc-nyc`,balance:15,unit:`days`,asOf:y,version:1},S={employeeId:`emp-alice`,locationId:`loc-lon`,balance:5,unit:`days`,asOf:y,version:1},C=[n.get(`/api/hcm/balance`,({request:e})=>{let t=new URL(e.url).searchParams.get(`locationId`);return d.json(t===`loc-nyc`?x:S)})],w={component:h,tags:[`autodocs`],argTypes:{employeeId:{control:`text`,description:`Employee whose balances to display`}}},T={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:C}}},E={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[n.get(`/api/hcm/balance`,async()=>{await c(`infinite`)})]}}},D={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[n.get(`/api/hcm/balance`,()=>d.json({code:`NOT_FOUND`,message:`No balance found`},{status:404}))]}}},O={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[n.get(`/api/hcm/balance`,({request:e})=>{let t=new URL(e.url).searchParams.get(`locationId`)===`loc-nyc`?x:S;return d.json({...t,asOf:b})})]}}},k={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:(()=>{let e=0;return[n.get(`/api/hcm/balance`,({request:t})=>{e++;let n=new URL(t.url).searchParams.get(`locationId`)===`loc-nyc`?x:S;return d.json(e>1?{...n,balance:n.balance+3,version:2}:n)})]})()}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: defaultHandlers
    }
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/balance', async () => {
        await delay('infinite');
      })]
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/balance', () => HttpResponse.json({
        code: 'NOT_FOUND',
        message: 'No balance found'
      }, {
        status: 404
      }))]
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/balance', ({
        request
      }) => {
        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId');
        const row = locationId === 'loc-nyc' ? aliceNyc : aliceLon;
        return HttpResponse.json({
          ...row,
          asOf: staleAsOf
        });
      })]
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: (() => {
        let callCount = 0;
        return [http.get('/api/hcm/balance', ({
          request
        }) => {
          callCount++;
          const url = new URL(request.url);
          const locationId = url.searchParams.get('locationId');
          const base = locationId === 'loc-nyc' ? aliceNyc : aliceLon;
          // Second call simulates a balance change from a background HCM mutation
          return HttpResponse.json(callCount > 1 ? {
            ...base,
            balance: base.balance + 3,
            version: 2
          } : base);
        })];
      })()
    }
  }
}`,...k.parameters?.docs?.source}}},A=[`Default`,`Loading`,`Empty`,`Stale`,`BalanceRefreshedMidSession`]}))();export{k as BalanceRefreshedMidSession,T as Default,D as Empty,E as Loading,O as Stale,A as __namedExportsOrder,w as default};
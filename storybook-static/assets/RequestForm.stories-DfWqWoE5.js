import{n as e,o as t}from"./chunk-BEldbCjX.js";import{a as n,c as r,d as i,i as a,l as o,n as s,o as c,r as l,s as u,t as d,u as f}from"./seed-C-WhBS7u.js";import{M as p,Z as m,a as h,g,n as _,t as v}from"./iframe-DZMZqHPD.js";import{n as y,t as b}from"./RequestStatusBanner-pFBqLdZI.js";import{n as x,t as S}from"./StaleDataWarning-DT-zFIOM.js";function C(){let e=h(),[t,n]=(0,w.useState)(`idle`),r=_({mutationFn:e=>u.writeBalance(e),onMutate:async t=>{let n=c.balance(t.employeeId,t.locationId);await e.cancelQueries({queryKey:n});let r=e.getQueryData(n);return e.setQueryData(n,e=>e&&{...e,balance:e.balance+t.delta}),{snapshot:r,preVersion:r?.version}},onError:(t,r,i)=>{i?.snapshot!==void 0&&e.setQueryData(c.balance(r.employeeId,r.locationId),i.snapshot),t.status===409?n(`hcm-conflict`):t.status===422?n(`hcm-rejected`):n(`optimistic-rolled-back`)},onSuccess:async(t,r,i)=>{let a=c.balance(r.employeeId,r.locationId);(await e.fetchQuery({queryKey:a,queryFn:()=>u.getBalance(r.employeeId,r.locationId),staleTime:0})).version===i?.preVersion?(e.setQueryData(a,i?.snapshot),n(`hcm-silently-wrong`)):n(`hcm-confirmed`)}}),i=r.isPending?`optimistic-pending`:t;return{submit:r.mutate,status:i,isPending:r.isPending,reset:()=>{r.reset(),n(`idle`)}}}var w,T=e((()=>{w=t(m()),v(),r(),n()}));function E({employeeId:e}){let{submit:t,status:n,isPending:r,reset:i}=C(),[o,s]=(0,O.useState)(d[0].id),[c,l]=(0,O.useState)(``),[u,f]=(0,O.useState)(``),[p,m]=(0,O.useState)(``),[h,g]=(0,O.useState)(null),{data:_}=a(e,o);function v(n){if(n.preventDefault(),!c||!u||!_)return;let r=Math.ceil((new Date(u).getTime()-new Date(c).getTime())/(1e3*60*60*24))+1;g({balance:_.balance,unit:_.unit}),t({employeeId:e,locationId:o,delta:-r,reason:p})}function y(){i(),g(null)}return(0,D.jsxs)(`div`,{className:`space-y-4`,children:[n!==`idle`&&(0,D.jsx)(b,{status:n,onReset:y}),n===`hcm-silently-wrong`&&h&&_&&(0,D.jsx)(S,{preBalance:h.balance-1,postBalance:_.balance,unit:h.unit}),(0,D.jsxs)(`form`,{onSubmit:v,className:`space-y-4`,children:[(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`label`,{className:`block text-sm font-medium text-zinc-700 mb-1`,children:`Location`}),(0,D.jsx)(`select`,{value:o,onChange:e=>s(e.target.value),disabled:r,className:`w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50`,children:d.map(e=>(0,D.jsx)(`option`,{value:e.id,children:e.name},e.id))})]}),(0,D.jsxs)(`div`,{className:`flex gap-3`,children:[(0,D.jsxs)(`div`,{className:`flex-1`,children:[(0,D.jsx)(`label`,{className:`block text-sm font-medium text-zinc-700 mb-1`,children:`Start date`}),(0,D.jsx)(`input`,{type:`date`,value:c,onChange:e=>l(e.target.value),disabled:r,required:!0,className:`w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50`})]}),(0,D.jsxs)(`div`,{className:`flex-1`,children:[(0,D.jsx)(`label`,{className:`block text-sm font-medium text-zinc-700 mb-1`,children:`End date`}),(0,D.jsx)(`input`,{type:`date`,value:u,onChange:e=>f(e.target.value),disabled:r,required:!0,min:c,className:`w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50`})]})]}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`label`,{className:`block text-sm font-medium text-zinc-700 mb-1`,children:`Reason`}),(0,D.jsx)(`textarea`,{value:p,onChange:e=>m(e.target.value),disabled:r,rows:3,placeholder:`Brief description of your time-off request…`,className:`w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 resize-none`})]}),(0,D.jsx)(`button`,{type:`submit`,disabled:r||!c||!u,className:`w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`,children:r?`Submitting…`:`Request time off`})]})]})}var D,O,k=e((()=>{D=p(),O=t(m()),T(),y(),x(),l(),s(),E.__docgenInfo={description:``,methods:[],displayName:`RequestForm`,props:{employeeId:{required:!0,tsType:{name:`string`},description:``}}}})),A,j,M,N,P,F,I,L,R,z,B,V;e((()=>{o(),k(),{within:A,userEvent:j,expect:M}=__STORYBOOK_MODULE_TEST__,N={employeeId:`emp-alice`,locationId:`loc-nyc`,balance:15,unit:`days`,asOf:new Date().toISOString(),version:1},P=i.get(`/api/hcm/balance`,({request:e})=>{let t=new URL(e.url).searchParams.get(`locationId`);return g.json(t===`loc-nyc`?N:{...N,locationId:`loc-lon`,balance:5})}),F={component:E,tags:[`autodocs`],argTypes:{employeeId:{control:`text`,description:`The submitting employee`}},parameters:{msw:{handlers:[P,i.post(`/api/hcm/balance`,()=>g.json({success:!0,balance:{...N,balance:14,version:2}}))]}}},I={args:{employeeId:`emp-alice`}},L={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[P,i.post(`/api/hcm/balance`,async()=>{await f(`infinite`)})]}},play:async({canvasElement:e})=>{let t=A(e);await j.selectOptions(t.getByRole(`combobox`),`loc-nyc`),await j.type(t.getByLabelText(`Start date`),`2026-05-01`),await j.type(t.getByLabelText(`End date`),`2026-05-03`),await j.click(t.getByRole(`button`,{name:/request time off/i})),await M(t.getByRole(`button`,{name:/submitting/i})).toBeInTheDocument()}},R={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[P,i.post(`/api/hcm/balance`,()=>g.json({code:`REJECTED`,message:`Insufficient balance`},{status:422}))]}},play:async({canvasElement:e})=>{let t=A(e);await j.selectOptions(t.getByRole(`combobox`),`loc-nyc`),await j.type(t.getByLabelText(`Start date`),`2026-05-01`),await j.type(t.getByLabelText(`End date`),`2026-05-03`),await j.click(t.getByRole(`button`,{name:/request time off/i})),await M(await t.findByText(`Request rejected`)).toBeInTheDocument()}},z={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[P,i.post(`/api/hcm/balance`,()=>g.json({success:!0,balance:N}))]}},play:async({canvasElement:e})=>{let t=A(e);await j.selectOptions(t.getByRole(`combobox`),`loc-nyc`),await j.type(t.getByLabelText(`Start date`),`2026-05-01`),await j.type(t.getByLabelText(`End date`),`2026-05-03`),await j.click(t.getByRole(`button`,{name:/request time off/i})),await M(await t.findByText(`Unconfirmed`)).toBeInTheDocument()}},B={args:{employeeId:`emp-alice`},parameters:{msw:{handlers:[P,i.post(`/api/hcm/balance`,async()=>{await f(`infinite`)})]}},play:async({canvasElement:e})=>{let t=A(e);await j.type(t.getByLabelText(`Start date`),`2026-05-01`),await j.type(t.getByLabelText(`End date`),`2026-05-03`),await j.click(t.getByRole(`button`,{name:/request time off/i})),await M(t.getByRole(`combobox`)).toBeDisabled(),await M(t.getByLabelText(`Start date`)).toBeDisabled(),await M(t.getByLabelText(`End date`)).toBeDisabled()}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [balanceHandler, http.post('/api/hcm/balance', async () => {
        await delay('infinite');
      })]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'loc-nyc');
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01');
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03');
    await userEvent.click(canvas.getByRole('button', {
      name: /request time off/i
    }));
    await expect(canvas.getByRole('button', {
      name: /submitting/i
    })).toBeInTheDocument();
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [balanceHandler, http.post('/api/hcm/balance', () => HttpResponse.json({
        code: 'REJECTED',
        message: 'Insufficient balance'
      }, {
        status: 422
      }))]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'loc-nyc');
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01');
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03');
    await userEvent.click(canvas.getByRole('button', {
      name: /request time off/i
    }));
    await expect(await canvas.findByText('Request rejected')).toBeInTheDocument();
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [balanceHandler,
      // 200 but version unchanged — silent failure path
      http.post('/api/hcm/balance', () => HttpResponse.json({
        success: true,
        balance: aliceNyc
      }))]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'loc-nyc');
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01');
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03');
    await userEvent.click(canvas.getByRole('button', {
      name: /request time off/i
    }));
    await expect(await canvas.findByText('Unconfirmed')).toBeInTheDocument();
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    employeeId: 'emp-alice'
  },
  parameters: {
    msw: {
      handlers: [balanceHandler, http.post('/api/hcm/balance', async () => {
        await delay('infinite');
      })]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01');
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03');
    await userEvent.click(canvas.getByRole('button', {
      name: /request time off/i
    }));
    await expect(canvas.getByRole('combobox')).toBeDisabled();
    await expect(canvas.getByLabelText('Start date')).toBeDisabled();
    await expect(canvas.getByLabelText('End date')).toBeDisabled();
  }
}`,...B.parameters?.docs?.source}}},V=[`Idle`,`Submitting`,`OptimisticRolledBack`,`HcmSilentlyWrong`,`Disabled`]}))();export{B as Disabled,z as HcmSilentlyWrong,I as Idle,R as OptimisticRolledBack,L as Submitting,V as __namedExportsOrder,F as default};
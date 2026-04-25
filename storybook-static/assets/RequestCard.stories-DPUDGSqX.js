import{n as e}from"./chunk-BEldbCjX.js";import{d as t,l as n,u as r}from"./seed-C-WhBS7u.js";import{g as i}from"./iframe-DZMZqHPD.js";import{n as a,t as o}from"./RequestCard-D7rYQPqL.js";var s,c,l,u,d,f,p,m,h,g,_,v,y,b,x;e((()=>{n(),a(),{userEvent:s,within:c,expect:l}=__STORYBOOK_MODULE_TEST__,u=new Date().toISOString(),d=new Date(Date.now()-9e4).toISOString(),f={id:`req-001`,employeeId:`emp-alice`,employeeName:`Alice Johnson`,locationId:`loc-nyc`,delta:-3,reason:`Family vacation`,submittedAt:new Date(Date.now()-5*6e4).toISOString(),status:`pending`},p={employeeId:`emp-alice`,locationId:`loc-nyc`,balance:15,unit:`days`,asOf:u,version:1},m=t.get(`/api/hcm/balance`,()=>i.json(p)),h={component:o,tags:[`autodocs`],argTypes:{request:{control:`object`,description:`Pending time-off request from the HCM request store`}}},g={args:{request:f},parameters:{msw:{handlers:[m,t.post(`/api/hcm/requests/:id/approve`,()=>i.json({requestId:`req-001`,status:`approved`,balance:{...p,balance:12,version:2}})),t.post(`/api/hcm/requests/:id/deny`,()=>i.json({requestId:`req-001`,status:`denied`}))]}}},_={args:{request:f},parameters:{msw:{handlers:[t.get(`/api/hcm/balance`,()=>i.json({...p,asOf:d}))]}}},v={args:{request:f},parameters:{msw:{handlers:[m,t.post(`/api/hcm/requests/:id/approve`,async()=>{await r(`infinite`)})]}},play:async({canvasElement:e})=>{let t=c(e);await t.findByText(`15 days`),await s.click(t.getByRole(`button`,{name:`Approve`})),await l(t.getByRole(`button`,{name:`Approving…`})).toBeInTheDocument()}},y={args:{request:f},parameters:{msw:{handlers:[m,t.post(`/api/hcm/requests/:id/approve`,()=>i.json({requestId:`req-001`,status:`approved`,balance:{...p,balance:12,version:2}}))]}},play:async({canvasElement:e})=>{let t=c(e);await t.findByText(`15 days`),await s.click(t.getByRole(`button`,{name:`Approve`})),await t.findByText(`Approved`)}},b={args:{request:f},parameters:{msw:{handlers:[m,t.post(`/api/hcm/requests/:id/deny`,()=>i.json({requestId:`req-001`,status:`denied`}))]}},play:async({canvasElement:e})=>{let t=c(e);await t.findByText(`15 days`),await s.click(t.getByRole(`button`,{name:`Deny`})),await t.findByText(`Denied`)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    request
  },
  parameters: {
    msw: {
      handlers: [freshBalanceHandler, http.post('/api/hcm/requests/:id/approve', () => HttpResponse.json({
        requestId: 'req-001',
        status: 'approved',
        balance: {
          ...freshBalance,
          balance: 12,
          version: 2
        }
      })), http.post('/api/hcm/requests/:id/deny', () => HttpResponse.json({
        requestId: 'req-001',
        status: 'denied'
      }))]
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    request
  },
  parameters: {
    msw: {
      handlers: [http.get('/api/hcm/balance', () => HttpResponse.json({
        ...freshBalance,
        asOf: staleAsOf
      }))]
    }
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    request
  },
  parameters: {
    msw: {
      handlers: [freshBalanceHandler, http.post('/api/hcm/requests/:id/approve', async () => {
        await delay('infinite');
      })]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('15 days');
    await userEvent.click(canvas.getByRole('button', {
      name: 'Approve'
    }));
    await expect(canvas.getByRole('button', {
      name: 'Approving…'
    })).toBeInTheDocument();
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    request
  },
  parameters: {
    msw: {
      handlers: [freshBalanceHandler, http.post('/api/hcm/requests/:id/approve', () => HttpResponse.json({
        requestId: 'req-001',
        status: 'approved',
        balance: {
          ...freshBalance,
          balance: 12,
          version: 2
        }
      }))]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('15 days');
    await userEvent.click(canvas.getByRole('button', {
      name: 'Approve'
    }));
    await canvas.findByText('Approved');
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    request
  },
  parameters: {
    msw: {
      handlers: [freshBalanceHandler, http.post('/api/hcm/requests/:id/deny', () => HttpResponse.json({
        requestId: 'req-001',
        status: 'denied'
      }))]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('15 days');
    await userEvent.click(canvas.getByRole('button', {
      name: 'Deny'
    }));
    await canvas.findByText('Denied');
  }
}`,...b.parameters?.docs?.source}}},x=[`PendingWithFreshBalance`,`PendingWithStaleBalance`,`ApprovingInFlight`,`ApproveConfirmed`,`DenyConfirmed`]}))();export{y as ApproveConfirmed,v as ApprovingInFlight,b as DenyConfirmed,g as PendingWithFreshBalance,_ as PendingWithStaleBalance,x as __namedExportsOrder,h as default};
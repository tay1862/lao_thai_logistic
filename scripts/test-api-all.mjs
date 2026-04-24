import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@thai-lao.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Admin@123456'

let cookieHeader = ''

function toQuery(params) {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v))
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

function extractSessionCookie(res) {
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) return ''
  const match = setCookie.match(/(?:^|,\s*)([^,;]*tll_session=[^;]+)/)
  return match ? match[1] : ''
}

async function api(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const finalHeaders = {
    ...headers,
    ...(body ? { 'content-type': 'application/json' } : {}),
    ...(auth && cookieHeader ? { cookie: cookieHeader } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json() : await res.text()
  return { res, payload }
}

function expectStatus(actual, expected, label) {
  assert.equal(actual, expected, `${label}: expected ${expected}, got ${actual}`)
}

async function main() {
  console.log(`API test base URL: ${BASE_URL}`)

  // 1) auth/me unauthorized
  {
    const { res } = await api('/api/v1/auth/me')
    expectStatus(res.status, 401, 'GET /api/v1/auth/me unauthorized')
    console.log('OK GET /api/v1/auth/me (unauthorized)')
  }

  // 2) login fail
  {
    const { res } = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: 'wrong-password' },
    })
    expectStatus(res.status, 401, 'POST /api/v1/auth/login invalid credentials')
    console.log('OK POST /api/v1/auth/login (invalid credentials)')
  }

  // 3) login success
  {
    const { res, payload } = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    expectStatus(res.status, 200, 'POST /api/v1/auth/login success')
    assert.equal(payload?.success, true, 'login success payload')

    const session = extractSessionCookie(res)
    assert.ok(session, 'session cookie must exist after login')
    cookieHeader = session
    console.log('OK POST /api/v1/auth/login (success)')
  }

  // 4) auth/me authorized
  {
    const { res, payload } = await api('/api/v1/auth/me', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/auth/me authorized')
    assert.equal(payload?.success, true, 'auth/me success payload')
    console.log('OK GET /api/v1/auth/me (authorized)')
  }

  // 5) branches
  let branches
  {
    const { res, payload } = await api('/api/v1/branches', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/branches')
    assert.equal(payload?.success, true, 'branches success')
    assert.ok(Array.isArray(payload?.data) && payload.data.length >= 2, 'branches >= 2')
    branches = payload.data
    console.log('OK GET /api/v1/branches')
  }

  const origin = branches.find((b) => b.country === 'TH') ?? branches[0]
  const destination = branches.find((b) => b.id !== origin.id) ?? branches[1]
  assert.ok(origin?.id && destination?.id, 'origin/destination branches must exist')

  // 6) dashboard stats
  {
    const { res, payload } = await api('/api/v1/dashboard/stats', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/dashboard/stats')
    assert.equal(payload?.success, true, 'dashboard stats success')
    console.log('OK GET /api/v1/dashboard/stats')
  }

  // 7) list shipments
  let listShipmentId
  {
    const { res, payload } = await api('/api/v1/shipments?page=1&pageSize=20', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/shipments')
    assert.equal(payload?.success, true, 'shipments list success')
    listShipmentId = payload?.data?.[0]?.id
    console.log('OK GET /api/v1/shipments')
  }

  // 8) create shipment
  let createdShipmentId
  let createdTrackingNo
  {
    const unique = Date.now().toString().slice(-6)
    const body = {
      senderFirstname: 'API',
      senderLastname: 'Sender',
      senderPhone: `0899${unique}`,
      senderAddress: 'Bangkok',
      receiverFirstname: 'API',
      receiverLastname: 'Receiver',
      receiverPhone: `0209${unique}`,
      receiverAddress: 'Vientiane',
      originBranchId: origin.id,
      destinationBranchId: destination.id,
      weightKg: 1.2,
      itemDescription: 'API smoke package',
      codAmount: 300,
      priceType: 'calculated',
      externalTrackingNo: `EXT-${unique}`,
      shippingPartner: 'flash',
    }

    const { res, payload } = await api('/api/v1/shipments', {
      method: 'POST',
      auth: true,
      body,
    })

    expectStatus(res.status, 201, 'POST /api/v1/shipments')
    assert.equal(payload?.success, true, 'create shipment success')
    createdShipmentId = payload?.data?.id
    createdTrackingNo = payload?.data?.trackingNo
    assert.ok(createdShipmentId, 'created shipment id exists')
    assert.ok(createdTrackingNo, 'created tracking no exists')
    console.log('OK POST /api/v1/shipments')
  }

  // 9) get shipment by id
  {
    const id = createdShipmentId ?? listShipmentId
    assert.ok(id, 'shipment id for detail endpoint')
    const { res, payload } = await api(`/api/v1/shipments/${id}`, { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/shipments/[id]')
    assert.equal(payload?.success, true, 'shipment detail success')
    console.log('OK GET /api/v1/shipments/[id]')
  }

  // 10) patch shipment status
  {
    const id = createdShipmentId
    assert.ok(id, 'created shipment id for patch')
    const { res, payload } = await api(`/api/v1/shipments/${id}`, {
      method: 'PATCH',
      auth: true,
      body: {
        status: 'in_transit',
        location: 'API Test Location',
        note: 'API smoke status update',
      },
    })
    expectStatus(res.status, 200, 'PATCH /api/v1/shipments/[id]')
    assert.equal(payload?.success, true, 'shipment patch success')
    console.log('OK PATCH /api/v1/shipments/[id]')
  }

  // 11) label html
  {
    const { res, payload } = await api(`/api/v1/shipments/${createdShipmentId}/label`, { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/shipments/[id]/label')
    assert.equal(typeof payload, 'string', 'label payload is html')
    assert.ok(payload.includes('<html'), 'label response contains html')
    console.log('OK GET /api/v1/shipments/[id]/label')
  }

  // 12) cod list and collect/transfer
  let codId
  {
    const { res, payload } = await api('/api/v1/cod?status=pending', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/cod')
    assert.equal(payload?.success, true, 'cod list success')

    const pending = (payload?.data ?? []).find((item) => item?.shipment?.id === createdShipmentId)
    assert.ok(pending?.id, 'pending cod for created shipment exists')
    codId = pending.id
    console.log('OK GET /api/v1/cod')
  }

  {
    const { res, payload } = await api(`/api/v1/cod/${codId}/collect`, {
      method: 'PATCH',
      auth: true,
      body: {
        collectedAmount: 300,
        discrepancyNote: undefined,
      },
    })
    expectStatus(res.status, 200, 'PATCH /api/v1/cod/[id]/collect')
    assert.equal(payload?.success, true, 'cod collect success')
    console.log('OK PATCH /api/v1/cod/[id]/collect')
  }

  {
    const { res, payload } = await api(`/api/v1/cod/${codId}/transfer`, {
      method: 'PATCH',
      auth: true,
    })
    expectStatus(res.status, 200, 'PATCH /api/v1/cod/[id]/transfer')
    assert.equal(payload?.success, true, 'cod transfer success')
    console.log('OK PATCH /api/v1/cod/[id]/transfer')
  }

  // 13) reports export (xlsx + pdf)
  {
    const { res } = await api('/api/v1/reports/export?format=xlsx', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/reports/export?format=xlsx')
    assert.ok((res.headers.get('content-type') ?? '').includes('sheet'), 'xlsx content-type')
    console.log('OK GET /api/v1/reports/export?format=xlsx')
  }

  {
    const { res } = await api('/api/v1/reports/export?format=pdf', { auth: true })
    expectStatus(res.status, 200, 'GET /api/v1/reports/export?format=pdf')
    assert.ok((res.headers.get('content-type') ?? '').includes('pdf'), 'pdf content-type')
    console.log('OK GET /api/v1/reports/export?format=pdf')
  }

  // 14) public tracking endpoint
  {
    const { res, payload } = await api(`/api/v1/tracking/${createdTrackingNo}`)
    expectStatus(res.status, 200, 'GET /api/v1/tracking/[trackingNo]')
    assert.equal(payload?.success, true, 'tracking success')
    console.log('OK GET /api/v1/tracking/[trackingNo]')
  }

  // 15) logout
  {
    const { res, payload } = await api('/api/v1/auth/logout', {
      method: 'POST',
      auth: true,
    })
    expectStatus(res.status, 200, 'POST /api/v1/auth/logout')
    assert.equal(payload?.success, true, 'logout success')
    console.log('OK POST /api/v1/auth/logout')
  }

  console.log('')
  console.log('All API endpoints passed.')
}

main().catch((error) => {
  console.error('API test failed:')
  console.error(error)
  process.exit(1)
})

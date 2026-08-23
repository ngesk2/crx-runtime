/**
 * Customer Routes
 *
 * HPP: HTTP interface for the Customer Authority.
 *
 * POST /customers/import — Import customers from Google People
 * POST /customers/:id/sync-email — Sync email threads for a customer
 * POST /customers/:id/sync-calendar — Sync calendar events for a customer
 * GET /customers — List/search customers
 * GET /customers/stats — Customer aggregate stats
 * GET /customers/:id — Resolve a customer
 * POST /customers — Manually create/update a customer
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createCustomerRoutes(customerAuthority) {
  /**
   * POST /customers/import
   * Import customers from Google People API.
   */
  router.post('/import', asyncHandler('POST /customers/import', async (req) => {
    const { tenant_id, page_size, page_token, sync_token } = req.body;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    const result = await customerAuthority.executeImportCustomers({
      tenantId: tenant_id,
      options: {
        pageSize: page_size,
        pageToken: page_token,
        syncToken: sync_token,
      },
    });

    return result;
  }));

  /**
   * POST /customers/:id/sync-email
   * Sync Gmail threads for a customer.
   */
  router.post('/:id/sync-email', asyncHandler('POST /customers/:id/sync-email', async (req) => {
    const { id } = req.params;
    const { tenant_id, email, max_results, after, before } = req.body;

    if (!tenant_id || !email) {
      throw new Error('tenant_id and email are required');
    }

    const result = await customerAuthority.executeSyncCustomerEmail({
      tenantId: tenant_id,
      customerId: id,
      email,
      options: {
        maxResults: max_results,
        after,
        before,
      },
    });

    return result;
  }));

  /**
   * POST /customers/:id/sync-calendar
   * Sync Calendar events for a customer.
   */
  router.post('/:id/sync-calendar', asyncHandler('POST /customers/:id/sync-calendar', async (req) => {
    const { id } = req.params;
    const { tenant_id, email, time_min, time_max, max_results } = req.body;

    if (!tenant_id || !email) {
      throw new Error('tenant_id and email are required');
    }

    const result = await customerAuthority.executeSyncCustomerCalendar({
      tenantId: tenant_id,
      customerId: id,
      email,
      options: {
        timeMin: time_min,
        timeMax: time_max,
        maxResults: max_results,
      },
    });

    return result;
  }));

  /**
   * GET /customers/stats
   * Customer aggregate stats for a tenant.
   */
  router.get('/stats', asyncHandler('GET /customers/stats', async (req) => {
    const { tenant_id } = req.query;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    const stats = await customerAuthority.executeGetCustomerStats(tenant_id);
    return { stats };
  }));

  /**
   * GET /customers
   * List or search customers.
   */
  router.get('/', asyncHandler('GET /customers', async (req) => {
    const { tenant_id, query, email, source, limit, offset } = req.query;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    if (query || email || source) {
      const customers = await customerAuthority.executeSearchCustomers({
        tenantId: tenant_id,
        query,
        email,
        source,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      return { customers, count: customers.length };
    }

    const customers = await customerAuthority.executeListCustomers({
      tenantId: tenant_id,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return { customers, count: customers.length };
  }));

  /**
   * GET /customers/:id
   * Resolve a single customer.
   */
  router.get('/:id', asyncHandler('GET /customers/:id', async (req) => {
    const { id } = req.params;
    const { tenant_id } = req.query;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    const customer = await customerAuthority.executeResolveCustomer(tenant_id, id);
    if (!customer) {
      throw new Error(`Customer ${id} not found`);
    }
    return { customer };
  }));

  /**
   * POST /customers
   * Manually create or update a customer.
   */
  router.post('/', asyncHandler('POST /customers', async (req) => {
    const { tenant_id, customer } = req.body;

    if (!tenant_id || !customer) {
      throw new Error('tenant_id and customer are required');
    }

    const result = await customerAuthority.executeUpsertCustomer({
      tenantId: tenant_id,
      customer,
    });

    return { customer: result };
  }));

  return router;
}

module.exports = createCustomerRoutes;

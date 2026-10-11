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
const { asyncHandler, admittedCommandHandler, denyLegacyMutation } = require('../route_middleware');

function createCustomerRoutes(customerAuthority) {
  const router = express.Router();
  /**
   * POST /customers/import
   * Import customers from Google People API.
   */
  router.post('/import', denyLegacyMutation);
  router.post('/:id/sync-email', denyLegacyMutation);
  router.post('/:id/sync-calendar', denyLegacyMutation);

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
  router.post('/', admittedCommandHandler(customerAuthority, 'executeAdmittedUpsert', 'CUSTOMER_UPSERT'));

  return router;
}

module.exports = createCustomerRoutes;

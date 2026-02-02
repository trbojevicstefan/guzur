const routes = {
  create: '/api/create-organization',
  update: '/api/update-organization',
  delete: '/api/delete-organization/:id',
  getOrganization: '/api/organization/:id',
  getOrganizations: '/api/organizations/:page/:size',
  getFrontendOrganizations: '/api/frontend-organizations/:type/:page/:size',
  getFrontendOrganization: '/api/frontend-organization/:id',
  getFrontendOrganizationBySlug: '/api/frontend-organization-by-slug/:slug',
  getFrontendOrgMembers: '/api/frontend-org-members/:orgId',
  getOrgMembers: '/api/org-members/:orgId',
  inviteOrgMember: '/api/invite-org-member',
}

export default routes

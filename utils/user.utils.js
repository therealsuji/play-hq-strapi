async function getUserId(ctx) {
  const { id, isAdmin = false } = await strapi.plugins["users-permissions"].services.jwt.getToken(ctx);
  return id;
}

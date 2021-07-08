const { sanitizeEntity } = require("strapi-utils");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.plugins["users-permissions"].models.user,
  });
module.exports = {

  async setPreferences(ctx) {
    const id = ctx.state.user.id;
    let genres = [...ctx.request.body.genres];
    let releaseDates = [...ctx.request.body.releaseDates];
    let platforms = [...ctx.request.body.platforms];
    const entity = await strapi.query("user", "users-permissions").update(
      { id },
      {
        genres,
        releaseDates,
        platforms,
      }
    );
    return sanitizeUser(entity);
  },

  async setLocation(ctx) {
    const id = ctx.state.user.id;
    let location = { ...ctx.request.body.location };
    const entity = await strapi.query("user", "users-permissions").update(
      { id },
      {
        location,
      }
    );
    return sanitizeUser(entity);
  },

  //TODO update phone number and username
};

const { sanitizeUser } = require("../../../utils/helper");

module.exports = {
  async setPreferences(ctx) {
    const id = ctx.state.user.id;
    const body = ctx.request.body;

    let data = {};
    if (body.genres) {
      data.pref_genres = body.genres;
    }
    if (body.release_dates) {
      data.pref_release_dates =  body.release_dates;
    }
    if (body.platforms) {
      data.pref_platforms = body.platforms;
    }
    const user = await strapi.query("user", "users-permissions").update({ id }, data);
    console.log(user);
    return sanitizeUser(user);
  },

  async setDetails(ctx) {
    const id = ctx.state.user.id;
    const body = ctx.request.body;

    let data = {};
    if (body.location) {
      data.location = body.location;
    }
    if (body.phone_number) {
      data.phone_number = body.phone_number;
    }
    if (body.name) {
      data.name = body.name;
    }
    // This sets the user onboarding status to true
    data.setupDone = true;
    const user = await strapi.query("user", "users-permissions").update({ id }, data);
    return sanitizeUser(user);
  },
};

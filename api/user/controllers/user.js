module.exports = {
  async setPreferences(ctx) {
    const id = ctx.state.user.id;
    let genres = [...ctx.request.body.genres];
    let releaseDates = [...ctx.request.body.releaseDates];
    let platforms = [...ctx.request.body.platforms];
    await strapi.query("user", "users-permissions").update(
      { id },
      {
        genres,
        releaseDates,
        platforms,
      }
    );
    return true;
  },
  async setLocation(ctx) {
    const id = ctx.state.user.id;
    let location = { ...ctx.request.body.location };
    await strapi.query("user", "users-permissions").update(
      { id },
      {
        location,
      }
    );
    return true;
  },
};

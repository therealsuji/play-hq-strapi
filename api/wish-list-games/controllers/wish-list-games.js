const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async set(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      const knex = strapi.connections.default;
      await strapi.query("wish-list-games").delete({ user: user_id });
      const data = body.list;
      for (let item of data) {
        item.user = user_id;
      }
      console.log(data);
      await knex.batchInsert("wish_list_games", data);
      const result = await strapi.query("wish-list-games").find({ user: user_id });
      return sanitizeEntity(result, { model: strapi.models["wish-list-games"] });
    }
  },
  async find(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi.query("wish-list-games").find({ user: user_id });
      console.log(result);
      return sanitizeEntity(result, { model: strapi.models["wish-list-games"] });
    }
  },
};

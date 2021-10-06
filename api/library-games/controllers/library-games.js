const { sanitizeEntity } = require("strapi-utils");
const { flattenObjectNested } = require("../../../utils/helper");

module.exports = {
  async create(ctx) {
    if (!ctx.is("multipart")) {
      const body = ctx.request.body;
      body.platforms = body.platforms.map((val) => {
        return { platform: val };
      });
      let result = await strapi.services["library-games"].create(body);
      result.platforms = flattenObjectNested(result.platforms, "platform");

      return sanitizeEntity(result, { model: strapi.models["library-games"] });
    }
  },
  async set(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      const knex = strapi.connections.default;
      await strapi.query("library-games").delete({ user: user_id });
      const data = body.list;
      for (let item of data) {
        item.user = user_id;
        item.platforms = item.platforms.map((val) => {
          return { platform: val };
        });
      }

      await knex.batchInsert("library_games", data);
      const result = await strapi.query("library-games").find({ user: user_id });
      return sanitizeEntity(result, { model: strapi.models["library-games"] });
    }
  },
  async find(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi.query("library-games").find({ user: user_id });
      console.log(result);
      return sanitizeEntity(result, { model: strapi.models["library-games"] });
    }
  },
};

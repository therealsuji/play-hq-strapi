const { sanitizeEntity } = require("strapi-utils");
const { create: createGame } = require("../../games/services/games");
module.exports = {
  async create(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      // will either create a game if new or return the game if it already exists
      const game = await createGame(body);
      const existing_lib_game = await strapi.query("wish-list-games").findOne({ user: user_id, game: game.id }, ["game.platforms", "game.genres"]);
      // if the library game exists for the same user, return it
      if (existing_lib_game) {
        return sanitizeEntity(existing_lib_game, { model: strapi.models["wish-list-games"] });
      }
      await strapi.services["wish-list-games"].create({ game: game.id, user: user_id });
      const result = await strapi.query("wish-list-games").findOne({ user: user_id, game: game.id }, ["game.platforms", "game.genres"]);
      return sanitizeEntity(result, { model: strapi.models["wish-list-games"] });
    }
  },

  async set(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      await strapi.query("wish-list-games").delete({ user: user_id });
      for (let item of body.list) {
        const game = await createGame(item);
        await strapi.services["wish-list-games"].create({ game: game.id, user: user_id });
      }
      const result = await strapi.query("wish-list-games").find({ user: user_id }, ["game.platforms", "game.genres"]);
      return sanitizeEntity(result, { model: strapi.models["wish-list-games"] });

    }
  },

  async find(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi.query("wish-list-games").findOne({ user: user_id }, ["game.platforms", "game.genres"]);
      return sanitizeEntity(result, { model: strapi.models["wish-list-games"] });
    }
  },


};

const { sanitizeEntity } = require("strapi-utils");
const { create: createGame } = require("../../games/services/games");

module.exports = {
  async create(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      // will either create a game if new or return the game if it already exists
      const game = await createGame(body.game);
      const existing_lib_game = await strapi.query("library-games").findOne({ user: user_id, game: game.id });
      // if the library game exists for the same user, return it
      if (existing_lib_game) {
        existing_lib_game.platform = existing_lib_game.platform.id;
        return sanitizeEntity(existing_lib_game, { model: strapi.models["library-games"] });
      }
      await strapi.services["library-games"].create({ game: game.id, platform: body.platform, user: user_id });
      const result = await strapi.query("library-games").findOne({ user: user_id, game: game.id });
      result.platform = result.platform.id;
      return sanitizeEntity(result, { model: strapi.models["library-games"] });
    }
  },

  //Reset the library game for user with new list
  async set(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      await strapi.query("library-games").delete({ user: user_id });
      for (let item of body) {
        const game = await createGame(item.game);
        await strapi.services["library-games"].create({ game: game.id, platform: item.platform, user: user_id });
      }
      let result = await strapi.query("library-games").find({ user: user_id });
      result = result.map((item) => {
        item.platform = item.platform.id;
        return item;
      });
      return sanitizeEntity(result, { model: strapi.models["library-games"] });
    }
  },

  async find(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi
        .query("library-games")
        .find({ user: user_id, ...ctx.query }, ["game.platforms", "game.genres"]);
      return sanitizeEntity(result, { model: strapi.models["library-games"] });
    }
  },
};

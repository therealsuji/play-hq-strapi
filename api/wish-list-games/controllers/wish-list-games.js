const { sanitizeEntity } = require("strapi-utils");
const { create: createGame } = require("../../games/services/games");
module.exports = {
  async create(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      // will either create a game if new or return the game if it already exists
      const game = await createGame(body.game);
      const existing_wishlist_game = await strapi
        .query("wish-list-games")
        .findOne({ user: user_id, game: game.id });
      // if the library game exists for the same user, return it
      if (existing_wishlist_game) {
        existing_wishlist_game.platform = existing_wishlist_game.platform.id;
        return sanitizeEntity(existing_wishlist_game, {
          model: strapi.models["wish-list-games"],
        });
      }
      await strapi.services["wish-list-games"].create({
        game: game.id,
        platform: body.platform,
        user: user_id,
      });
      const result = await strapi
        .query("wish-list-games")
        .findOne({ user: user_id, game: game.id });
      result.platform = result.platform.id;
      return sanitizeEntity(result, {
        model: strapi.models["wish-list-games"],
      });
    }
  },

  async set(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const body = ctx.request.body;
      await strapi.query("wish-list-games").delete({ user: user_id });
      for (let item of body) {
        const game = await createGame(item.game);
        await strapi.services["wish-list-games"].create({
          game: game.id,
          platform: item.platform,
          user: user_id,
        });
      }
      let result = await strapi
        .query("wish-list-games")
        .find({ user: user_id });
      for (item of result) {
        item.platform = item.platform.id;
      }
      return sanitizeEntity(result, {
        model: strapi.models["wish-list-games"],
      });
    }
  },

  async find(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi
        .query("wish-list-games")
        .find({ user: user_id, ...ctx.query });
      for (item of result) {
        item.platform = item.platform.id;
      }
      return sanitizeEntity(result, {
        model: strapi.models["wish-list-games"],
      });
    }
  },
};

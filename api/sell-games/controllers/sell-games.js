"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const { STATES, NOTIFICATION_TYPE } = require("../../../utils/constants");
const _ = require("lodash");
const { sendNotificationToUsers } = require("../../../utils/notifications-helper.js");
const { create: createGame } = require("../../games/services/games");
const { flattenObjectNested } = require("../../../utils/helper");
const { formatSellGame } = require("../helper");

module.exports = {



  async create(ctx) {
    if (!ctx.is("multipart")) {
      const body = ctx.request.body;
      // All orders are set to NOT_COMPLETE by default
      body.status = STATES.NOT_COMPLETE;
      let gameIds = [];
      const game_conditions = [];
      for (const game of body.games) {
        const _game = await createGame(game.game);
        gameIds.push(_game.id);
        game_conditions.push({
          game: _game.id,
          condition: game.condition
        })
      }
      body.games = gameIds;
      body.game_conditions = game_conditions;
      let result = await strapi.services["sell-games"].create(body);
      result = formatSellGame(result)

      return sanitizeEntity(result, { model: strapi.models["sell-games"] });
    }
  },

  /**
   * cancel the sale and the related orders with it
   */
  async cancelSale(ctx) {
    const sell_game_id = ctx.params.id;
    const user_id = ctx.state.user.id;

    if (!sell_game_id) {
      return ctx.response.badRequest("Id required");
    }
    const sale = await strapi.services["sell-games"].findOne({ id: sell_game_id, user: user_id });
    if (!sale) {
      return ctx.response.badRequest("Cannot find sale");
    }

    const orders = await strapi.services["order-sales"].find({
      "sell_game.id": sell_game_id,
      status: STATES.DISPATCHED,
    });

    if (orders.length) {
      return ctx.response.badRequest("Cannot cancel sale when order active");
    }

    // get all order ids for that sale
    const knex = strapi.connections.default;
    const all_order = await knex("order_sales")
      .where("sell_games.id", sell_game_id)
      .join("sell_games", "order_sales.sell_game", "sell_games.id")
      .select("order_sales.id")
      .select("order_sales.user");
    const order_ids = all_order.map((order) => order.id);
    // Update all the orders to cancelled
    const updated_orders = await knex("order_sales").whereIn("id", order_ids).update({ status: STATES.CANCELLED });
    // Update the sell game to cancelled
    const updated_sale = await strapi.services["sell-games"].update(
      { id: ctx.params.id },
      { status: STATES.CANCELLED }
    );

    // send notification to all buyers about order cancelling
    const user_ids = all_order.map((order) => order.user);
    if (user_ids.length) {
      sendNotificationToUsers(user_ids, `${sale.games[0].title} has been canceled`, NOTIFICATION_TYPE.WARNING);
    }

    return sanitizeEntity(updated_sale, { model: strapi.models["sell-games"] });
  },

  async getSalesByGame(ctx) {
    let game_id = ctx.params.id;
    let available_sales = await strapi.services["sell-games"].find({ games: game_id, ...ctx.query });
    available_sales = available_sales.map(sale => formatSellGame(sale));
    return sanitizeEntity(available_sales, { model: strapi.models["sell-games"] });
  },


  async getGamesFromWishList(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi.query("wish-list-games").find({ user: user_id, ...ctx.query });
      const game_ids = [];
      for (const game of result) {
        game_ids.push(game.game.id);
      }
      let sales = await strapi.query("sell-games").find({ games: game_ids });
      sales = sales.map(sale => formatSellGame(sale));
      return sanitizeEntity(sales, { model: strapi.models["sell-games"] });
    }
  },

  async getGamesFromLibraryGames(ctx) {
    if (!ctx.is("multipart")) {
      const user_id = ctx.state.user.id;
      const result = await strapi.query("library-games").find({ user: user_id, ...ctx.query });
      const game_ids = [];
      for (const game of result) {
        game_ids.push(game.game.id);
      }
      let sales = await strapi.query("sell-games").find({ games: game_ids });
      sales = sales.map(sale => formatSellGame(sale));
      return sanitizeEntity(sales, { model: strapi.models["sell-games"] });
    }
  },
};

"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const { STATES } = require("../../../utils/constants");
const _ = require("lodash");

module.exports = {
  /**
   * cancel the sale and the related orders with it
   */
  async cancelSale(ctx) {
    const sell_game_id = ctx.params.id;
    const user_id = ctx.state.user.id;

    if (!sell_game_id) {
      return ctx.response.badRequest("Id required");
    }
    const sale = await strapi.services["sell-games"].findOne({ id: sell_game_id, user_id: user_id });
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
      .select("order_sales.user_id");
    const order_ids = all_order.map((order) => order.id);
    // Update all the orders to cancelled
    const updated_orders = await knex("order_sales").whereIn("id", order_ids).update({ status: STATES.CANCELLED });
    // Update the sell game to cancelled
    const updated_sale = await strapi.services["sell-games"].update(
      { id: ctx.params.id },
      { status: STATES.CANCELLED }
    );
    //TODO send notification to buyer about order cancelling

    return sanitizeEntity(updated_sale, { model: strapi.models["sell-games"] });
  },
};

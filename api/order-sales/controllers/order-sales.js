"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const { STATES } = require("../../../utils/constants");

module.exports = {
  async create(ctx) {
    let entity;
    if (!ctx.is("multipart")) {
      const body = ctx.request.body;
      const user_id = ctx.state.user.id;
      const sale = await strapi.services["sell-games"].findOne({ id: body.sell_game });

      if (!sale) {
        return ctx.response.badRequest("sale not found");
      }

      if (user_id == sale.user_id) {
        return ctx.response.badRequest("cannot buy own game");
      }

      const prev_order = await strapi.services["order-sales"].find({
        user_id: user_id,
        "sell_game.id": sale.id,
      });

      if (prev_order.length == true) {
        return ctx.response.conflict("A new order can't be made when an order already exists");
      }

      if (!sale.negotiable && body.new_price != null) {
        return ctx.response.badRequest("A non-negotiable sale cannot have a new price");
      } else if (sale.negotiable && body.new_price == null) {
        return ctx.response.badRequest("A negotiable sale must have a new price");
      }

      entity = await strapi.services["order-sales"].create(body);
    }
    return sanitizeEntity(entity, { model: strapi.models["order-sales"] });
  },

  async getOrders(ctx) {
    const order_id = ctx.params.id;
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    const sale = await strapi.services["sell-games"].findOne({
      id: order_id,
      user_id: ctx.state.user.id,
    });
    if (!sale) {
      return ctx.response.badRequest("Cannot find sale");
    }

    const orders = await strapi.services["order-sales"].find({
      "sell_game.id": order_id,
      status: STATES.NOT_COMPLETE,
    });

    return orders.map((entity) => sanitizeEntity(entity, { model: strapi.models["order-sales"] }));
  },

  async cancelOrderBuyer(ctx) {
    const order_id = ctx.params.id;
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    const order = await strapi.services["order-sales"].findOne({ id: order_id, user_id: ctx.state.user.id });
    if (!order) {
      return ctx.response.badRequest("Cannot find order");
    }
    if (order.status == STATES.DISPATCHED) {
      return ctx.response.badRequest("Cannot cancel active order");
    }
    const updatedOrder = await strapi.services["order-sales"].update({ id: order.id }, { status: STATES.CANCELLED });
    return sanitizeEntity(updatedOrder, { model: strapi.models["order-sales"] });
  },

  /*
   * When seller is not happy with the new price, he can cancel an order and send notification to buyer to re-negotiate
   */
  async cancelOrderSeller(ctx) {
    const order_id = ctx.params.id;
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    const order = await strapi.services["order-sales"].findOne({
      id: order_id,
      "sell_game.user_id": ctx.state.user.id,
    });
    // TODO send notification to buyer to renegotiate
    if (!order) {
      return ctx.response.badRequest("Cannot find order");
    }

    const updatedOrder = await strapi.services["order-sales"].update({ id: order.id }, { status: STATES.CANCELLED });
    return sanitizeEntity(updatedOrder, { model: strapi.models["order-sales"] });
  },

  async updateOrderStatus(ctx) {
    const order_id = ctx.params.id;
    const status = ctx.request.body.status;
    if (!Object.values(STATES).includes(status)) {
      return ctx.response.badRequest("valid status is required");
    }
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    let updatedOrder = await strapi.services["order-sales"].update({ id: order_id }, { status: status });
    const updatedSale = await strapi.services["sell-games"].update(
      { id: updatedOrder.sell_game.id },
      { status: status }
    );
    updatedOrder = await strapi.services["order-sales"].findOne({
      id: order_id,
    });
    // TODO send notification to buyer 
    return sanitizeEntity(updatedOrder, { model: strapi.models["order-sales"] });
  },

  /*
   * Updates the selected orders status and the sales status and then sets all related orders to the sale to be not selected
   */
  async confirmOrder(ctx) {
    const order_id = ctx.params.id;
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    const order = await strapi.services["order-sales"].findOne({ id: order_id });
    if (!order) {
      return ctx.response.badRequest("Cannot find order");
    }
    const sale = await strapi.services["sell-games"].findOne({ id: order.sell_game.id });
    if (sale.status == STATES.DISPATCHED || sale.status == STATES.CONFIRMED) {
      return ctx.response.badRequest("Cannot confirm order");
    }

    /*UPDATING SELECTED ORDER AND GAME*/
    // Update the order status of selected order and corresponding sale to confirmed
    const updatedSale = await strapi.services["sell-games"].update(
      { id: order.sell_game.id },
      { status: STATES.CONFIRMED }
    );
    const updatedOrder = await strapi.services["order-sales"].update({ id: order.id }, { status: STATES.CONFIRMED });

    /*UPDATING OTHER ORDERS FOR THE SELECTED SALE*/
    // get all other orders for the sale
    const all_orders = await strapi.services["order-sales"].find({ "sell_game.id": sale.id });
    const all_order_ids = all_orders.map((order) => order.id);
    // update all other orders status to not selected
    const knex = strapi.connections.default;
    const updated_other_orders = await knex("order_sales")
      .whereIn("id", all_order_ids)
      .update({ status: STATES.NOT_SELECTED });
    // TODO send notification to other buyers about not getting selected

    return sanitizeEntity(updatedOrder, { model: strapi.models["order-sales"] });
  },
};

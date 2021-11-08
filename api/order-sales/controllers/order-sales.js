"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const { STATES, NOTIFICATION_TYPE } = require("../../../utils/constants");
const { sendNotificationToDevice, sendNotificationToUsers } = require("../../../utils/notifications-helper");
const { formatSellGame } = require("../../sell-games/helper");

module.exports = {
  async create(ctx) {
    if (!ctx.is("multipart")) {
      const body = ctx.request.body;
      const user_id = ctx.state.user.id;
      const sale = await strapi.services["sell-games"].findOne({ id: body.sell_game });

      if (!sale) {
        return ctx.response.badRequest("sale not found");
      }

      if (user_id == sale.user) {
        return ctx.response.badRequest("cannot buy own game");
      }

      const prev_order = await strapi.services["order-sales"].find({
        user: user_id,
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

      let result = await strapi.services["order-sales"].create(body);
      result.sell_game = formatSellGame(result.sell_game);
      return sanitizeEntity(result, { model: strapi.models["order-sales"] });
    }
  },

  async getOrders(ctx) {
    const order_id = ctx.params.id;
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    const sale = await strapi.services["sell-games"].findOne({
      id: order_id,
      user: ctx.state.user.id,
    });
    if (!sale) {
      return ctx.response.badRequest("Cannot find sale");
    }

    const orders = await strapi.services["order-sales"].find({
      "sell_game.id": order_id,
      status: STATES.NOT_COMPLETE,
      ...ctx.query,
    });

    return orders.map((entity) => sanitizeEntity(entity, { model: strapi.models["order-sales"] }));
  },

  async cancelOrderBuyer(ctx) {
    const order_id = ctx.params.id;
    if (!order_id) {
      return ctx.response.badRequest("Id required");
    }
    const order = await strapi.services["order-sales"].findOne({ id: order_id, user: ctx.state.user.id });
    if (!order) {
      return ctx.response.badRequest("Cannot find order");
    }
    if (order.status != STATES.NOT_COMPLETE) {
      return ctx.response.badRequest("Cannot cancel confirmed order");
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
      "sell_game.user": ctx.state.user.id,
    });
    if (!order) {
      return ctx.response.badRequest("Cannot find order");
    }

    const updatedOrder = await strapi.services["order-sales"].update({ id: order.id }, { status: STATES.CANCELLED });

    // send notification to buyer to renegotiate
    sendNotificationToDevice(
      updatedOrder.user,
      "Your order has been cancelled the seller was not happy with your new price, Create a new order to proceed",
      NOTIFICATION_TYPE.DECLINED
    );

    return sanitizeEntity(updatedOrder, { model: strapi.models["order-sales"] });
  },

  async updateOrderStatus(ctx) {
    const order_id = ctx.params.id;
    const status = ctx.request.body.status;
    if (!Object.values(STATES).includes(status)) {
      return ctx.response.badRequest("valid status is required");
    }
    if (status == STATES.CONFIRMED && status == STATES.CANCELLED) {
      return ctx.response.badRequest(`Cannot ${status} order with this endpoint`);
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
    // send notification to buyer
    sendNotificationToDevice(
      updatedOrder.user,
      `Hey your order with ${updatedOrder.sell_game.games[0].title} has been updated`,
      NOTIFICATION_TYPE.INFO
    );
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
    // send notification to buyer about getting confirmed
    sendNotificationToDevice(
      updatedOrder.user,
      `Hey your order with ${updatedOrder.sell_game.games[0].title} has been confirmed`,
      NOTIFICATION_TYPE.ACCEPTED
    );

    /*UPDATING OTHER ORDERS FOR THE SELECTED SALE*/
    // get all other orders for the sale
    const all_orders = await strapi.services["order-sales"].find({ "sell_game.id": sale.id });
    const other_order_ids = all_orders.map((order) => order.id != updatedOrder.id);

    // update all other orders status to not selected
    const knex = strapi.connections.default;
    await knex("order_sales").whereIn("id", other_order_ids).update({ status: STATES.NOT_SELECTED });

    // send notification to other buyers about not getting selected
    const other_user_ids = all_orders.map((order) => order.id != updatedOrder.id);
    if (other_user_ids.length) {
      sendNotificationToUsers(other_user_ids, `${sale.games[0].title} has been canceled`, NOTIFICATION_TYPE.DECLINED);
    }

    return sanitizeEntity(updatedOrder, { model: strapi.models["order-sales"] });
  },
};

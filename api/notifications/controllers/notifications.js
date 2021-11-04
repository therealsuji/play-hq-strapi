'use strict';

const { sanitizeEntity } = require("strapi-utils/lib");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getNotificationForUser(ctx) {
        const user_id = ctx.state.user.id;
        let all_notifications = await strapi.services["notifications"].find({ user: user_id,...ctx.query });
        return sanitizeEntity(all_notifications, { model: strapi.models["notifications"] });
    },
};

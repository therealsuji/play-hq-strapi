"use strict";

const { sanitizeEntity } = require("strapi-utils");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

module.exports = {
  async auth(ctx) {
    try {
      const { token, fcmToken } = ctx.request.body;
      const decodedToken = await strapi.firebase.auth().verifyIdToken(token);
      if (decodedToken.email) {
        let jwt;
        let user = await strapi.plugins["users-permissions"].services.user.fetch({
          email: decodedToken.email,
        });
        if (user) {
          user = sanitizeUser(user);

          jwt = strapi.plugins["users-permissions"].services.jwt.issue({
            id: user.id,
          });

          ctx.body = {
            user,
            jwt,
          };
        } else {
          const pluginStore = await strapi.store({
            environment: "",
            type: "plugin",
            name: "users-permissions",
          });

          const settings = await pluginStore.get({
            key: "advanced",
          });

          const role = await strapi.query("role", "users-permissions").findOne({ type: settings.default_role }, []);

          const params = {};
          params.role = role.id;
          params.email = decodedToken.email;
          params.username = decodedToken.email.split("@")[0];
          params.confirmed = true;
          params.notification_token = fcmToken;

          let user = await strapi.query("user", "users-permissions").create(params);
          if (user) {
            user = sanitizeUser(user);
            jwt = strapi.plugins["users-permissions"].services.jwt.issue({
              id: user.id,
            });

            ctx.body = {
              user,
              jwt,
            };
          } else {
            throw "user empty";
          }
        }
      } else {
        throw "email missing";
      }
    } catch (error) {
      return ctx.badRequest("Invalid token");
    }
  },

  async updateFcmToken(ctx) {
    const user_id = ctx.state.user.id;
    const token = ctx.params.token;
    if (!token) {
      return ctx.response.badRequest("token required");
    }
    return await strapi.query('user', 'users-permissions').update({id: user_id}, {notification_token: token});
  },
};

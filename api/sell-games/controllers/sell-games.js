const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {

  async create(ctx) {
    let entity;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data.user_id = ctx.state.user.id;
      entity = await strapi.services["sell-games"].create(data, { files });
    } else {
      ctx.request.body.user_id = ctx.state.user.id;
      delete ctx.request.body.status;
      entity = await strapi.services["sell-games"].create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models["sell-games"] });
  },
};

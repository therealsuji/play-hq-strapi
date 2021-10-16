module.exports = (strapi) => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          console.error(ctx.request.url);
          if (ctx.method == "POST") {
            console.error(ctx.request.body);
          }
          throw error;
        }
      });
    },
  };
};

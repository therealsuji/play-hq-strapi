module.exports = async (ctx, next) => {
  if (ctx.state.user) {
    ctx.request.body.user_id = ctx.state.user.id;
    return await next();
  }
  ctx.unauthorized(`You're not logged in!`);
};

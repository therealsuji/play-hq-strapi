const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

const sanitizeUser = (user) => {
  const data = sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

  data.pref_genres = _.flatMap(data.pref_genres, (val) => {
    return val.genre;
  });
  data.pref_platforms = _.flatMap(data.pref_platforms, (val) => {
    return val.platform;
  });
  data.pref_release_dates = _.flatMap(data.pref_release_dates, (val) => {
    return val.date;
  });

  return data;
};

module.exports = { sanitizeUser };

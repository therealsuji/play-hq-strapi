const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

const sanitizeUser = (user) => {
  const data = sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });
 

  return data;
};

const flattenObjectNested = (obj, key) => {
  return _.flatMap(obj, (val) => {
    return val[key];
  });
};

module.exports = { sanitizeUser, flattenObjectNested };

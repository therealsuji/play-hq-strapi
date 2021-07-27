"use strict";

const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");
const { platforms, genres } = require("../../data/data");
const isFirstRun = async () => {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: "type",
    name: "setup",
  });
  const initHasRun = await pluginStore.get({
    key: "initHasRun",
  });

  await pluginStore.set({
    key: "initHasRun",
    value: true,
  });
  return !initHasRun;
};

const createSeedData = async () => {
  const genresPromises = genres.map(({ ...rest }) => {
    return strapi.services.genres.create({
      ...rest,
    });
  });
  const platformsPromises = platforms.map(({ ...rest }) => {
    return strapi.services.platforms.create({
      ...rest,
    });
  });
  await Promise.all(genresPromises);
  await Promise.all(platformsPromises);
};
const findPublicRole = async () => {
  const result = await strapi.query("role", "users-permissions").findOne({ type: "public" });
  return result;
};

const findAuthenticatedRole = async () => {
  const result = await strapi.query("role", "users-permissions").findOne({ type: "authenticated" });
  return result;
};

const setDefaultPermission = async () => {
  const publicRole = await findPublicRole();
  const authRole = await findPublicRole();
  const publicPermissions = await strapi
    .query("permission", "users-permissions")
    .find({ type: "application", role: publicRole.id });
  const authenticatedPermissions = await strapi
    .query("permission", "users-permissions")
    .find({ type: "application", role: authRole.id });
  // await Promise.all(
  //   permissions.map(p =>
  //     strapi
  //       .query("permission", "users-permissions")
  //       .update({ id: p.id }, { enabled: true })
  //   )
  // );

  console.log(permissions);
};

module.exports = async () => {
  const shouldSetDefaultData = await isFirstRun();
  if (shouldSetDefaultData) {
    await createSeedData();
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  strapi.firebase = admin;
};

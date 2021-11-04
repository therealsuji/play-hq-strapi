async function sendNotificationToDevice({ user_id, message, type }) {
  const user = await strapi.query("user", "users-permissions").findOne({ id: user_id });
  await strapi.services["notifications"].create({ user: user_id, type: type, message: message });

  const data = {
    data: { message },
    token: user.notification_token,
  };
  return await strapi.firebase
    .messaging()
    .send(data)
    .then((response) => response)
    .catch((error) => {
      ``
      console.log("Error sending message:", error);
    });
} ``

async function sendNotificationToUsers(user_ids, message, type) {
  const users = await strapi.query("user", "users-permissions").find({ id_in: user_ids });
  await strapi.services["notifications"].create({ user: user_id, type: type, message: message });
  for (const user of users) {
    const data = {
      data: { message },
      token: user.notification_token,
    };
    return await strapi.firebase
      .messaging()
      .send(data)
      .then((response) => response)
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  }
}

module.exports = { sendNotificationToDevice, sendNotificationToUsers };

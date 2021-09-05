async function sendNotificationToDevice({ user_id, message }) {
  const user = await strapi.query("user", "users-permissions").findOne({ id: user_id });
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

async function sendNotificationToUsers(user_ids, message) {
  const users = await strapi.query("user", "users-permissions").find({ id_in: user_ids });
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

const _ = require("lodash");
const sell_game_details_model = require("../../../components/games/sell-game-details.json");

function formatSellGame(result) {
  // response formatting
  // flatten game condition to remove game relation object
  const games = result.game_details.map((sell_game) => {
    return {
      game: sell_game.game,
      condition: sell_game.condition,
      platform: sell_game.platform?.id,
    };
  });
  result.game_details = games;
  return result;
}

async function getSellGamesFromPlatformAndGameId(
  platformIds,
  gameIds,
  limit,
  offset
) {
  const knex = strapi.connections.default;
  const query = knex("sell_games_components")
    .where(
      "sell_games_components.component_type",
      sell_game_details_model.collectionName
    )
    .join(
      sell_game_details_model.collectionName,
      "sell_games_components.component_id",
      `${sell_game_details_model.collectionName}.id`
    );
  if (platformIds.length) {
    query.whereIn(
      `${sell_game_details_model.collectionName}.platform`,
      platformIds
    );
  }
  query.whereIn(`${sell_game_details_model.collectionName}.game`, gameIds);
  query.select(`sell_games_components.sell_game_id`);
  if(limit) {
    query.limit(limit);
  }
  if(offset) {
    query.offset(offset);
  }
  const sell_games = await query;
  const sell_game_ids = sell_games.map((sell_game) => sell_game.sell_game_id);
  if (sell_game_ids.length == 0) {
    return [];
  }
  const sale_games_data = await strapi.services["sell-games"].find({
    id: sell_game_ids,
  });
  console.log(sale_games_data)
  const sales = sale_games_data.map((sale) => formatSellGame(sale));
  return sales;
}

module.exports = { formatSellGame, getSellGamesFromPlatformAndGameId };

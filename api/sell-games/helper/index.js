const _ = require("lodash");
const sell_game_details_model = require("../../../components/games/sell-game-details.json");

function formatSellGame(result) {

    // response formatting
    // flatten game condition to remove game relation object
    const games = result.game_details.map(sell_game => {
        return {
            game: sell_game.game,
            condition: sell_game.condition,
            platform: sell_game.platform.id
        }
    });
    result.game_details = games;
    return result;
}

function getSellGamesFromPlatformAndGameId(platformIds,gameIds,limit,offset) {
    const sell_games = await knex("sell_games_components")
      .where("sell_games_components.component_type", sell_game_details_model.collectionName)
      .join(
        sell_game_details_model.collectionName,
        "sell_games_components.component_id",
        `${sell_game_details_model.collectionName}.id`
      )
      .where(`${sell_game_details_model.collectionName}.platform`, platformIds)
      .where(`${sell_game_details_model.collectionName}.game`, gameIds)
      .select(`sell_games_components.sell_game_id`)
      .limit(limit)
      .offset(offset);
    const sell_game_ids = sell_games.map((sell_game) => sell_game.sell_game_id);
    if (sell_game_ids.length == 0) {
      return [];
    }
    return 
    const sale_games_data = await strapi.services["sell-games"].find({ id: sell_game_ids });
    const sales = sale_games_data.map((sale) => formatSellGame(sale));
    return sales;
}

module.exports = { formatSellGame }
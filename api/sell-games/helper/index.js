const _ = require("lodash");

function formatSellGame(result) {

    // response formatting
    // flatten game condition to remove game relation object
    const flat_game_conditions = result.game_conditions.map(condition => {
        return {
            game: condition.game,
            condition: condition.condition
        }
    });
    delete result.game_conditions;
    result.games = flat_game_conditions;
    return result;
}

module.exports = { formatSellGame }
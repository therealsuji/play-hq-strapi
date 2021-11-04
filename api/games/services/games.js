'use strict';
const { isDraft } = require('strapi-utils').contentTypes;

module.exports = {
    async create(data, { files } = {}) {
        let existing_game = await strapi.services["games"].findOne({ api_id: data.api_id });
        if (existing_game) {
            return existing_game;
        }
        const validData = await strapi.entityValidator.validateEntityCreation(
            strapi.models.games,
            data,
            { isDraft: isDraft(data, strapi.models.games) }
        );

        const entry = await strapi.query('games').create(validData);

        if (files) {
            await strapi.entityService.uploadFiles(entry, files, {
                model: 'games',
            });
            return this.findOne({ id: entry.id });
        }

        return entry;
    },
};




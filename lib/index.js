"use strict";

const { Client } = require("@elastic/elasticsearch");

module.exports = (strapi) => {
  return {
    defaultSettins: {
      node: "",
      auth: {},
      port: "443",
    },

    /**
     * Initialize the hook
     */
    async initialize() {
      // Merging defaultSettings and config/elastic.json
      const { node, auth, port } = {
        ...this.defaultSettings,
        ...strapi.config.elastic.settings.elasticsearch,
      };

      const client = new Client({
        node,
        auth,
        port,
      });

      const createIsNotExist = (index) => {
        return new Promise(async (resolve, reject) => {
          try {
            const isExists = await client.indices.exists({ index });
            if (!isExists) {
              await client.indices.create({ index });
              if (strapi.debug) strapi.log.debug(`Index ${index} created`);
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      };

      strapi.services.elasticsearch = {
        client,

        /**
         * Define addDocument function
         * @param index
         * @param _id  * define id
         * @param type * define typeof document
         * @param refresh * If set true force reindex
         * @param payload
         */

        addDocument: async function (index, _id, type, refresh, _payload) {
          try {
            await createIsNotExist(index);
            const res = await client.index({
              index,
              id: _id,
              type,
              refresh,
              body: _payload,
            });

            if (debug)
              strapi.log.debug(
                `Saved object: ${res._id} on the Elastisearch Index: ${index}`
              );
          } catch (err) {
            strapi.log.error(`Elastisearch Hook: ${err.message}`);
          }
        },

        updateDocument: async function (index, _id, type, refresh, _payload) {
          try {
            const res = await client.update({
              index,
              id: _id,
              type,
              refresh,
              body: _payload,
            });

            if (debug)
              strapi.log.debug(
                `Updated object: ${res._id} on the Elastisearch Index: ${index}`
              );
          } catch (err) {
            strapi.log.error(`Elastisearch Hook: ${err.message}`);
          }
        },

        deleteDocument: async function (index, _id, refresh) {
          try {
            const res = await client.delete({
              index,
              id: _id,

              refresh,
            });

            if (debug)
              strapi.log.debug(
                `Updated object: ${res._id} on the Elastisearch Index: ${index}`
              );
          } catch (err) {
            strapi.log.error(`Elastisearch Hook: ${err.message}`);
          }
        },
      };

      if (!host.length || Object.keys(auth)) {
        strapi.log.error(
          "Elasticsearch Hook: Could not initialize: HOST and AUTH must be defined"
        );
      } else {
        client.ping(
          {
            requestTimeout: 3000,
          },
          function (error) {
            if (error) {
              strapi.log.error(
                `Elasticsearch Hook: Could not initialize: ${error.message}`
              );
            } else {
              if (debug)
                strapi.log.debug(
                  `Successfully initialized Elasticsearch service with applicationId: ${host}`
                );
            }
          }
        );
      }
    },
  };
};

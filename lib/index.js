'use strict';

const { Client } = require('@elastic/elasticsearch');

module.exports = {
  /**
   * Initialize the hook
   */
  async init(pluginConfig) {
    const {
      providerOptions: { node = '', auth = {}, port = '443' },
      debug,
    } = pluginConfig;

    if (!host.length || Object.keys(auth)) {
      throw new Error('Elasticsearch Hook: Could not initialize: HOST and AUTH must be defined');
    }

    const client = new Client({
      ...providerOptions,
    });

    client.ping(
      {
        requestTimeout: 3000,
      },
      function (error) {
        if (error) {
          throw new Error(`Elasticsearch Hook: Could not initialize: ${error.message}`);
        } else {
          if (debug) strapi.log.debug(`Successfully initialized Elasticsearch service with applicationId: ${host}`);
        }
      },
    );

    const createIsNotExist = (index) => {
      return new Promise(async (resolve, reject) => {
        try {
          const isExists = await client.indices.exists({ index });
          if (!isExists) {
            await client.indices.create({ index });
            if (debug) strapi.log.debug(`Index ${index} created`);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    };

    return {
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

          if (debug) strapi.log.debug(`Saved object: ${res._id} on the Elastisearch Index: ${index}`);
          return res;
        } catch (err) {
          throw new Error(`Elastisearch Hook: ${err.message}`);
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

          if (debug) strapi.log.debug(`Updated object: ${res._id} on the Elastisearch Index: ${index}`);
        } catch (err) {
          throw new Error(`Elastisearch Hook: ${err.message}`);
        }
      },

      deleteDocument: async function (index, _id, refresh) {
        try {
          const res = await client.delete({
            index,
            id: _id,

            refresh,
          });

          if (debug) strapi.log.debug(`Updated object: ${res._id} on the Elastisearch Index: ${index}`);
        } catch (err) {
          throw new Error(`Elastisearch Hook: ${err.message}`);
        }
      },
    };
  },
};

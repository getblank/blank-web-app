/**
 * Created by kib357 on 25/05/15.
 */

import client from "../wamp/client";
import alerts from "../utils/alertsEmitter";

module.exports = {
    search: function (entityName, searchText, searchProps, extraQuery, itemsCount, skippedCount, orderBy, loadProps) {
        let query = {
            $or: searchProps.map(p => {
                let q = {};
                q[p] = { $regex: searchText, $options: "i" };
                return q;
            }),
        };
        if (extraQuery) {
            query = {
                $and: [query, extraQuery],
            };
        }
        return new Promise(function (resolve, reject) {
            client.call(
                `com.stores.${entityName}.find`,
                { query: query, take: itemsCount, skip: skippedCount, orderBy: orderBy, props: loadProps },
                function (error, res) {
                    if (error == null) {
                        resolve({ text: searchText, items: res.items || [], count: res.count });
                    } else {
                        alerts.error("Search error: " + error.desc);
                        reject(error);
                    }
                }
            );
        });
    },
    searchByIds: function (entityName, ids) {
        let query = {
            _id: {
                $in: ids,
            },
        };
        return new Promise(function (resolve, reject) {
            client.call(
                `com.stores.${entityName}.find`,
                { query: query, take: ids.length },
                function (error, res) {
                    if (error == null) {
                        resolve(res.items || []);
                    } else {
                        alerts.error("SearchByIds error: " + error.desc);
                        reject(error);
                    }
                }
            );
        });
    },
};
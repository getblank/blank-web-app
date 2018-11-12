/**
 * Created by kib357 on 25/05/15.
 */

import alerts from "../utils/alertsEmitter";
import dataActuators from "./dataActuators";

const exports = {
    search: function(entityName, searchText, searchProps, extraQuery, itemsCount, skippedCount, orderBy, loadProps) {
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

        return dataActuators
            .findAndReturn(entityName, query, itemsCount, skippedCount, orderBy)
            .then(res => {
                return { text: searchText, items: res.items || [], count: res.count };
            })
            .catch(err => {
                alerts.error("Search error: " + err.message);
                throw err;
            });
    },
    searchByIds: function(entityName, ids) {
        const query = {
            _id: {
                $in: ids,
            },
        };

        return dataActuators
            .findAndReturn(entityName, query, ids.length, 0, "")
            .then(res => {
                return res.items;
            })
            .catch(err => {
                alerts.error("SearchByIds error: " + err.message);
                throw err;
            });
    },
};

export default exports;

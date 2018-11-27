/**
 * Created by kib357 on 25/05/15.
 */

import alerts from "../utils/alertsEmitter";
import dataActuators from "./dataActuators";

const iTimeout = ms => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
};

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
    searchByIds: function(storeName, ids) {
        return this._aggregateAndSearchByIds(storeName, ids)
            .then(items => {
                return items.filter(i => ids.includes(i._id));
            })
            .catch(err => console.error(err));
    },
    _searchByIds: function(storeName, ids) {
        const query = {
            _id: {
                $in: ids,
            },
        };

        return dataActuators
            .findAndReturn(storeName, query, ids.length, 0, "")
            .then(res => {
                return res.items;
            })
            .catch(err => {
                alerts.error("SearchByIds error: " + err.message);
                throw err;
            });
    },

    async _aggregateAndSearchByIds(storeName, ids) {
        if (!this.searchingPool) this.searchingPool = {};
        this.searchingPool[storeName] = this.searchingPool[storeName] || {};
        if (this.searchingPool[storeName].fn) {
            ids.forEach(id => this.searchingPool[storeName].ids.add(id));
            return this.searchingPool[storeName].fn;
        }

        const fn = async () => {
            await iTimeout(100);
            const ids = [...this.searchingPool[storeName].ids];
            this.searchingPool[storeName].ids.clear();
            this.searchingPool[storeName].t = null;
            this.searchingPool[storeName].fn = null;
            return this._searchByIds(storeName, ids);
        };
        this.searchingPool[storeName] = {
            ids: new Set(ids),
            fn: fn(),
        };

        return this.searchingPool[storeName].fn;
    },
};

export default exports;

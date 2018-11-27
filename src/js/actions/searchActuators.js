/**
 * Created by kib357 on 25/05/15.
 */

import alerts from "../utils/alertsEmitter";
import dataActuators from "./dataActuators";

const iTimeout = (ms, cancel = new Promise(() => {})) => {
    const promise = new Promise(resolve => {
        setTimeout(resolve, ms);
    });

    return Promise.race([promise, cancel]);
};

const searchingPool = {};

const exports = {
    search(entityName, searchText, searchProps, extraQuery, itemsCount, skippedCount, orderBy, loadProps) {
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
    searchByIds(storeName, ids) {
        return this._aggregateAndSearchByIds(storeName, ids)
            .then(items => {
                return items.filter(i => ids.includes(i._id));
            })
            .catch(err => console.error(err));
    },
    _searchByIds(storeName, ids) {
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
        await iTimeout(0);
        searchingPool[storeName] = searchingPool[storeName] || {};
        if (searchingPool[storeName].fn) {
            ids.forEach(id => searchingPool[storeName].ids.add(id));
            if (searchingPool[storeName].ids.size >= 15) {
                searchingPool[storeName].cancel();
            }

            return searchingPool[storeName].fn;
        }

        let cancel;
        const p = new Promise(resolve => {
            cancel = resolve;
        });

        const timeout = iTimeout(100, p);
        const fn = async () => {
            await timeout;
            const ids = [...searchingPool[storeName].ids];
            searchingPool[storeName].ids.clear();
            searchingPool[storeName].fn = null;
            searchingPool[storeName].cancel = null;
            return this._searchByIds(storeName, ids);
        };
        searchingPool[storeName] = {
            ids: new Set(ids),
            fn: fn(),
            cancel,
        };

        return searchingPool[storeName].fn;
    },
};

export default exports;

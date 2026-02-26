/**
 * Supabase-compatible SQLite query builder.
 * Supports: .from(), .select(), .insert(), .delete(),
 *           .eq(), .in(), .order(), .limit(), .single()
 *
 * Each terminal call (.single() or awaiting the builder) returns { data, error }.
 */

const sqliteDb = require('./database');

class QueryBuilder {
    constructor(table) {
        this._table = table;
        this._operation = 'select';   // 'select' | 'insert' | 'delete'
        this._cols = '*';
        this._insertData = null;
        this._conditions = [];        // { type: 'eq'|'in', col, val }
        this._orderCol = null;
        this._orderAsc = true;
        this._limitVal = null;
        this._returning = false;      // whether to SELECT after insert/delete
    }

    // ── operation setters ────────────────────────────────────────────────────

    select(cols = '*') {
        this._operation = 'select';
        this._cols = cols === '*' ? '*' : cols;
        return this;
    }

    insert(data) {
        this._operation = 'insert';
        this._insertData = Array.isArray(data) ? data : [data];
        return this;
    }

    delete() {
        this._operation = 'delete';
        return this;
    }

    // ── chainable filters / options ──────────────────────────────────────────

    eq(col, val) {
        this._conditions.push({ type: 'eq', col, val });
        return this;
    }

    in(col, vals) {
        this._conditions.push({ type: 'in', col, vals });
        return this;
    }

    order(col, { ascending = true } = {}) {
        this._orderCol = col;
        this._orderAsc = ascending;
        return this;
    }

    limit(n) {
        this._limitVal = n;
        return this;
    }

    // marks that after insert/delete we want to return the affected rows
    _withSelect() {
        this._returning = true;
        return this;
    }

    // called by insert(...).select() — mirrors Supabase's API
    // We override select() only when chained after insert/delete
    // by detecting _operation
    // ──────────────────────────────────────────────────────────────────
    // Trick: Supabase users do:  .insert(data).select().single()
    // So we need .select() on an insert builder to mean "return rows".
    // We handle this by checking _operation inside select().
    // ──────────────────────────────────────────────────────────────────

    // ── SQL builders ─────────────────────────────────────────────────────────

    _buildWhere() {
        if (this._conditions.length === 0) return { clause: '', params: [] };
        const parts = [];
        const params = [];
        for (const c of this._conditions) {
            if (c.type === 'eq') {
                parts.push(`"${c.col}" = ?`);
                params.push(c.val);
            } else if (c.type === 'in') {
                const placeholders = c.vals.map(() => '?').join(', ');
                parts.push(`"${c.col}" IN (${placeholders})`);
                params.push(...c.vals);
            }
        }
        return { clause: 'WHERE ' + parts.join(' AND '), params };
    }

    _execSelect() {
        const { clause, params } = this._buildWhere();
        let sql = `SELECT ${this._cols} FROM "${this._table}" ${clause}`;
        if (this._orderCol) {
            sql += ` ORDER BY "${this._orderCol}" ${this._orderAsc ? 'ASC' : 'DESC'}`;
        }
        if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;

        try {
            const rows = sqliteDb.prepare(sql).all(...params);
            return { data: rows, error: null };
        } catch (e) {
            return { data: null, error: { message: e.message } };
        }
    }

    _execInsert() {
        try {
            const results = [];
            for (const row of this._insertData) {
                const keys = Object.keys(row);
                const placeholders = keys.map(() => '?').join(', ');
                const sql = `INSERT INTO "${this._table}" (${keys.map(k => `"${k}"`).join(', ')})
                             VALUES (${placeholders})`;
                const info = sqliteDb.prepare(sql).run(...keys.map(k => row[k]));
                const inserted = sqliteDb.prepare(`SELECT * FROM "${this._table}" WHERE id = ?`).get(info.lastInsertRowid);
                results.push(inserted);
            }
            return { data: results, error: null };
        } catch (e) {
            return { data: null, error: { message: e.message } };
        }
    }

    _execDelete() {
        const { clause, params } = this._buildWhere();
        try {
            let deleted = [];
            if (this._returning) {
                // fetch first so we can return them
                const selectSql = `SELECT * FROM "${this._table}" ${clause}`;
                deleted = sqliteDb.prepare(selectSql).all(...params);
            }
            const sql = `DELETE FROM "${this._table}" ${clause}`;
            sqliteDb.prepare(sql).run(...params);
            return { data: deleted, error: null };
        } catch (e) {
            return { data: null, error: { message: e.message } };
        }
    }

    _execute() {
        if (this._operation === 'select') return this._execSelect();
        if (this._operation === 'insert') return this._execInsert();
        if (this._operation === 'delete') return this._execDelete();
        return { data: null, error: { message: 'Unknown operation' } };
    }

    // ── terminal methods ──────────────────────────────────────────────────────

    /** Returns a single row (or null). Mirrors Supabase .single() */
    single() {
        const result = this._execute();
        if (result.error) return result;
        const arr = result.data;
        if (!arr || arr.length === 0) return { data: null, error: null };
        return { data: arr[0], error: null };
    }

    // ── thenable — allows `await query` without calling .single() ────────────

    then(resolve, reject) {
        try {
            const result = this._execute();
            resolve(result);
        } catch (e) {
            reject(e);
        }
    }
}

// ── Override select() to handle chaining after insert/delete ─────────────────
// We patch it post-class so the logic is clean.
const _originalSelect = QueryBuilder.prototype.select;
QueryBuilder.prototype.select = function (cols = '*') {
    if (this._operation === 'insert' || this._operation === 'delete') {
        // .select() after insert/delete just means "return rows"
        this._returning = true;
        return this;
    }
    return _originalSelect.call(this, cols);
};

// ── Public API ────────────────────────────────────────────────────────────────

const db = {
    from(table) {
        return new QueryBuilder(table);
    }
};

module.exports = db;

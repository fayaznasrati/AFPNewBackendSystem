exports.multipleColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    const keys = Object.keys(object);
    const values = Object.values(object);

    columnSet = keys.map(key => `${key} = ?`).join(', ');

    return {
        columnSet,
        values
    }
}

exports.multipleInsertColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    const keys = Object.keys(object);
    const values = Object.values(object);
    questr = ""
    columnSet = keys.map(key => `${key}`).join(', ');
    questr = keys.map(key => `?`).join(', ');
    return {
        columnSet,
        questr,
        values
    }
}

exports.multipleAndColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    const keys = Object.keys(object);
    // console.log(keys)
    columnSet = keys.map(key => {
        if (key == 'start_date') {
            return `'${object[key]}' <=  date(created_on)`
        }
        if (key == 'end_date') {
            return `date(created_on) <= '${object[key]}'`
        }
        if (key == 'trans_date_time') {
            return `'${object[key]}' <=  CAST(trans_date_time as DATETIME)`
        }
        if(key.includes('_uuid')) return `CAST(${key} AS  CHAR(16)) = ?`
        return `${key} = ${object[key]}`
    }).join(' AND ');

    return {
        columnSet
    }
}
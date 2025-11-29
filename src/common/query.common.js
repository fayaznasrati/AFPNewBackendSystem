exports.multipleColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    let { addBalance, deductBalance, concat1, addBalance1, concat, addBalance2, addBalance3, addBalance4, addBalance5, addBalance6, deductBalance2, deductBalance3, deductBalance4, deductBalance5, deductBalance1, emailid, ...other } = object

    const keys = Object.keys(other);
    const upValues = Object.values(other)

    let upColumnSet

    upColumnSet = keys.map(key => `${key} = ?`);

    // console.log(upColumnSet,typeof(upColumnSet))

    if( addBalance ) {
        upColumnSet.push(`${addBalance.key} = ${addBalance.key} + ? `)
        upValues.push(addBalance.value)
    }
    if( addBalance1 ){
        upColumnSet.push(`${addBalance1.key} = ${addBalance1.key} + ? `)
        upValues.push(addBalance1.value)
    }
    if( addBalance2 ){
        upColumnSet.push(`${addBalance2.key} = ${addBalance2.key} + ? `)
        upValues.push(addBalance2.value)
    }
    if( addBalance3 ){
        upColumnSet.push(`${addBalance3.key} = ${addBalance3.key} + ? `)
        upValues.push(addBalance3.value)
    }
    if( addBalance4 ){
        upColumnSet.push(`${addBalance4.key} = ${addBalance4.key} + ? `)
        upValues.push(addBalance4.value)
    }
    if( addBalance5 ){
        upColumnSet.push(`${addBalance5.key} = ${addBalance5.key} + ? `)
        upValues.push(addBalance5.value)
    }
    if( addBalance6 ){
        upColumnSet.push(`${addBalance6.key} = ${addBalance6.key} + ? `)
        upValues.push(addBalance6.value)
    }
    if( deductBalance ){
        upColumnSet.push(`${deductBalance.key} = ${deductBalance.key} - ? `)
        upValues.push(deductBalance.value)
    }
    if( deductBalance1 ){
        upColumnSet.push(`${deductBalance1.key} = ${deductBalance1.key} - ? `)
        upValues.push(deductBalance1.value)
    }
    if( deductBalance2 ){
        upColumnSet.push(`${deductBalance2.key} = ${deductBalance2.key} - ? `)
        upValues.push(deductBalance2.value)
    }
    if( deductBalance3 ){
        upColumnSet.push(`${deductBalance3.key} = ${deductBalance3.key} - ? `)
        upValues.push(deductBalance3.value)
    }
    if( deductBalance4 ){
        upColumnSet.push(`${deductBalance4.key} = ${deductBalance4.key} - ? `)
        upValues.push(deductBalance4.value)
    }
    if( deductBalance5 ){
        upColumnSet.push(`${deductBalance5.key} = ${deductBalance5.key} - ? `)
        upValues.push(deductBalance5.value)
    }
    if( concat ) {
        upColumnSet.push(`${concat.key} = CONCAT( ${concat.key},  ?  )`)
        upValues.push(concat.value)
    }
    if( concat1 ){
        upColumnSet.push(`${concat1.key} = CONCAT( ${concat1.key},  ?  )`)
        upValues.push(concat1.value)
    }
    if( emailid ){
        if(emailid == 'NULL')   upColumnSet.push(` emailid = NULL`)
        else {
            upColumnSet.push(` emailid = ?`)
            upValues.push(emailid)
        }
    }

    upColumnSet.join(', ')

    return {
        upColumnSet,
        upValues
    }
}

exports.multipleInsertColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    const keys = Object.keys(object);
    var inValues = Object.values(object);
    inQueStr = ""
    inColumnSet = keys.map(key => `${key}`).join(', ');
    inQueStr = keys.map(key => {
        if (object[key] === "uuid()") {
            inValues.shift()
            return `uuid()`
        }
        return `?`
    }).join(',');
    return {
        inColumnSet,
        inQueStr,
        inValues
    }
}

exports.multiRowInsert = (list) => {
    var keys = Object.keys(list[0])
    var finalinColumnSet = keys.map(key => `${key}`).join(', ');
    var finalinValues = []
    var finalinQueStr = list.map((item)=>{
        const {inColumnSet,inQueStr,inValues} = this.multipleInsertColumnSet(item)
        finalinValues = finalinValues.concat(inValues)
        return( "(" + inQueStr + ")")
    }).join(',')
    // console.log(finalinColumnSet,finalinQueStr,finalinValues)
    return{finalinColumnSet,finalinQueStr,finalinValues}
}

exports.multipleAndColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    let { region_ids, child_ids, between, timeDifferent, addBalance, deductBalance, IsIn, ...other } = object

    const keys = Object.keys(other);
    const sevalues = Object.values(other)
    
    seColumnSet = keys.map(key => {
        if(key == 'timeCheck') return `TIMESTAMPDIFF(MINUTE, created_on, CURRENT_TIMESTAMP) <= ?`
        if (key == 'start_date') return `? <=  date(created_on)`
        if (key == 'end_date') return `date(created_on) <= ?`
        if (key == 'trans_date_time') return ` ? <=  date(trans_date_time)`
        if (key == 'start_trans_date_time') return ` ? <=  date(trans_date_time)`
        if (key == 'end_trans_date_time') return `date(trans_date_time) <= ?`
        if (key == 'registerDate') return `date(created_on) = ?`
        if (key == 'get_equal_and_grate_parent_ids') return `usertype_id <= ?`
        if (key == 'get_upper_parent_ids') return `usertype_id < ?`
        if (key == 'get_equal_parent_ids') return `usertype_id = ?`
        if (key == 'get_lower_parent_ids') return `usertype_id > ?`
        if (key == 'lower_agent_type') return `usertype_id > ?`
        if (key == 'mobile_verification_expire_in') return `date(mobile_verification_expire_on) < ?`
        if (key == 'mobile_verification_expire_out') return `date(mobile_verification_expire_on) > ?`
        if(key == 'agent_login_otp_expire_in') return `date(agent_login_otp_expire_on) < ?`
        if(key == 'agent_login_otp_expire_out') return `date(agent_login_otp_expire_on) > ?`
        if(key == 'created_on') return `date(created_on) = ?`
        if(key == 'lower_agent_type_id') return `agent_type_id > ?`
        if(key == 'greater_agent_type_id') return `agent_type_id < ?`
        if(key == 'greater_and_equal_agent_type_id') return `agent_type_id <= ?`
        if(key == 'wall1_comm_gat') return `wallet1_comm >= ?`
        if(key == 'wall2_comm_gat') return `wallet2_comm >= ?`
        if(key == 'wall3_comm_gat') return `wallet3_comm >= ?`
        if(key == 'wall4_comm_gat') return `wallet4_comm >= ?`
        if(key == 'wall5_comm_gat') return `wallet5_comm >= ?`
        if(key.includes('_uuid')) return `CAST(${key} AS CHAR(16)) = ? `
        return `${key} = ?`
    })

    // console.log(seColumnSet,typeof(seColumnSet))

    if( region_ids )  seColumnSet.push( `region_id IN ( ${region_ids} ) ` )
    if( child_ids ) seColumnSet.push( `userid IN ( ${child_ids} ) ` )
    if( timeDifferent ) {
        seColumnSet.push(`TIMESTAMPDIFF(MINUTE, ${timeDifferent.key}, '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
    }
    if( between ) seColumnSet.push(` date( ${between.key} ) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
    if( IsIn ) {
        seColumnSet.push(` ${IsIn.key} IN (${IsIn.value}) `)
    }
        
    seColumnSet = seColumnSet.join(' AND ');

    return {
        seColumnSet,
        sevalues
    }
}

exports.multipleORColumnSet = (object) => {
    if (typeof object !== 'object') {
        throw new Error('Invalid input');
    }

    const keys = Object.keys(object);
    const sevalues = Object.values(object)
    seColumnSet = keys.map(key => {
        if(key.includes('user_uuid')) return `CAST( user_uuid AS CHAR(16)) = ? `
        if(key.includes('_uuid')) return `CAST(${key} AS CHAR(16)) = ? `
        return `${key} = ?`
    }).join(' OR ');

    return {
        seColumnSet,
        sevalues
    }
}
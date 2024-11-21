const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

// const { toIsoString } = require('../common/timeFunction.common')

class newsController {
    tableName1 = 'er_news'

    createNews = async (req, res) => {
        try{
            // verify body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('news/createNews',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let param ={
                news : req.body.news, //str news
                created_by_id : req.body.user_detials.id,
                created_on : isodate,
                active : 1
            }

            let createResponce = await sqlQuery.createQuery(this.tableName1, param)

            res.status(201).send({message: 'News created successfully'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAllNews = async(req, res) =>{
        try{

            // verify body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('news/getAllNews',JSON.stringify(req.body), JSON.stringify(req.query))
            let searchKeyValue = {
                active : 1
            }

            if( req.query.startDate && req.query.endDate )
            searchKeyValue.between = {
                key : 'created_on',
                value : [req.query.startDate, req.query.endDate]
            }

            let key = ['id','news','CAST(created_on AS CHAR(20)) as created_on']

            let searchResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, 'id', 'ASC')
            if(searchResponce.length == 0)  return res.status(204).send({ message: 'No news found' })

            res.status(200).send(searchResponce)

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getTodayNews = async (req, res) =>{
        try{

            // verify body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('news/getTodayNews',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                let todayDate = isodate.slice(0, 10)

                let searchKeyValue = {
                    active : 1, 
                    created_on : todayDate
                }

                let key = ['count(1) AS count']

                let lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, 'id', 'ASC')

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                key = ['news']
    
                let searchResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, 'id', 'ASC', limit, offset)
                // if(searchResponce.length == 0)  return res.status(204).send({ message: 'No news for today' })
    
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(searchResponce)
                }else{
                    res.status(200).send({
                        reportList : searchResponce,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateNews = async (req, res) =>{
        try{

            // verify body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('news/updateNews',JSON.stringify(req.body), JSON.stringify(req.query))
            let searchKeyValue = {
                id : req.body.id,
                active : 1
            }

            let updateRes = await sqlQuery.updateQuery(this.tableName1, { news : req.body.news } , searchKeyValue)

            const { affectedRows, changedRows, info } = updateRes;
            const message = !affectedRows ? 'news not found' :
                affectedRows && changedRows ? 'News updated successfully' : 'News updated';

            res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    deleteNews = async (req, res) =>{
        try{

            // verify body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('news/deleteNews',JSON.stringify(req.body), JSON.stringify(req.query))
            let searchKeyValue = {
                id : req.query.id
            }

            let updateRes = await sqlQuery.updateQuery(this.tableName1, { active : 0 } , searchKeyValue)

            const { affectedRows, changedRows, info } = updateRes;
            const message = !affectedRows ? 'news not found' :
                affectedRows && changedRows ? 'News deleted successfully' : 'News already deleted';

            res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
}

module.exports = new newsController()
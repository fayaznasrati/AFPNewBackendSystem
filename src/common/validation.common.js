const { validationResult } = require('express-validator');

function commonValidation (req, res){
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        
        //res.setHeader("Content-Type", "text/html");
        return res.status(400).json({ errors: errors.array() });
        //res.status(400).json({ errors: errors.errors[0].msg });
    }
    
}

module.exports = {
    commonValidation
}


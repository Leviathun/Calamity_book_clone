const fs = require('fs'); 
let c = fs.readFileSync('server.js', 'utf8'); 

c = c.replace(/const ejs = require\('ejs'\); \/\/ Correct/g, "const ejs = require('ejs');\nconst expressLayouts = require('express-ejs-layouts');"); 

c = c.replace(/app\.set\('view engine', 'ejs'\);/g, "app.set('view engine', 'ejs');\napp.use(expressLayouts);\napp.set('layout', 'layout');"); 

const a = ['admin/add_category', 'admin/manage_category', 'admin/edit_category', 'admin/add_product', 'admin/edit_product', 'admin/manage_product', 'admin/top_product', 'admin/bill_summary', 'admin/staff_login', 'admin/staff_order', 'admin/dashboard', 'admin/staff_product', 'admin/staff_setting']; 
a.forEach(r => { 
    c = c.replace(new RegExp(`res\\.render\\('${r}'(.*?)\\);`, 'g'), (m, p) => { 
        if (p.trim() === '') return `res.render('${r}', { layout: false });`; 
        if (p.trim().startsWith(',')) { 
            return `res.render('${r}'${p.replace('}', ', layout: false}')});`; 
        } 
        return m; 
    }); 
}); 

fs.writeFileSync('server.js', c); 
console.log('Updated server.js');
